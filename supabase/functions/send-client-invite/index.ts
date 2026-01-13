import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const inviteRequestSchema = z.object({
  clientEmail: z.string().email("Invalid email format"),
  clientFirstName: z.string().min(1, "First name required"),
  clientLastName: z.string().min(1, "Last name required"),
  signupUrl: z.string().url("Invalid signup URL"),
});

function getInviteEmailContent(firstName: string, lastName: string, signupUrl: string) {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
  `;
  
  const headerStyle = `
    background: linear-gradient(135deg, #002147 0%, #003366 100%);
    color: white;
    padding: 24px;
    text-align: center;
  `;
  
  const contentStyle = `
    padding: 32px 24px;
    background: #ffffff;
  `;
  
  const footerStyle = `
    background: #f8f9fa;
    padding: 20px 24px;
    text-align: center;
    color: #6c757d;
    font-size: 14px;
  `;
  
  const buttonStyle = `
    display: inline-block;
    background: #FF6B00;
    color: white;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 20px 0;
  `;

  return {
    subject: "Welcome to Road Runner Express - Create Your Account",
    html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 28px;">🚚 Road Runner Express</h1>
        </div>
        <div style="${contentStyle}">
          <h2 style="color: #002147; margin-top: 0;">Welcome, ${firstName}!</h2>
          <p>You've been invited to join Road Runner Express as a client. Create your account to start requesting and tracking shipments with us.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${signupUrl}" style="${buttonStyle}">Create Your Account</a>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #002147;">With Your Account, You Can:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Request new load shipments</li>
              <li>Track your shipments in real-time</li>
              <li>View driver and delivery information</li>
              <li>Download delivery receipts and signatures</li>
              <li>Access your complete shipment history</li>
            </ul>
          </div>
          
          <p><strong>Important:</strong> Please sign up using this email address so your account is automatically linked to your client profile.</p>
          
          <p style="color: #6c757d; font-size: 14px;">If you have any questions, our dispatch team is available 24/7.</p>
        </div>
        <div style="${footerStyle}">
          <p style="margin: 0;">Road Runner Express - Fast, Reliable, On Time</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">You Call It, We'll Haul It</p>
        </div>
      </div>
    `,
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-client-invite function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.error("No authorization header provided");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify the user's token
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    console.error("Invalid token:", authError);
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Verify user is a dispatcher
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (userRole?.role !== "dispatcher") {
    console.error("User is not a dispatcher:", user.id);
    return new Response(
      JSON.stringify({ error: "Forbidden - Only dispatchers can send client invites" }),
      { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const validationResult = inviteRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Input validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { clientEmail, clientFirstName, clientLastName, signupUrl } = validationResult.data;

    console.log(`Sending invite to ${clientEmail}`);

    const emailContent = getInviteEmailContent(clientFirstName, clientLastName, signupUrl);
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Road Runner Express <onboarding@resend.dev>",
        to: [clientEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error sending invite email:", data);
      
      // Check for domain verification error
      if (data.message?.includes("verify a domain")) {
        throw new Error("To send invites to clients, please verify your domain at resend.com/domains. For testing, you can only send to your own email address.");
      }
      
      throw new Error(data.message || "Failed to send email");
    }
    
    console.log("Invite email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Invite sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-client-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);