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
  driverEmail: z.string().email("Invalid email format"),
  driverFirstName: z.string().min(1, "First name required"),
  driverLastName: z.string().min(1, "Last name required"),
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
    subject: "You're Invited to Join Road Runner Express",
    html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 28px;">🚚 Road Runner Express</h1>
        </div>
        <div style="${contentStyle}">
          <h2 style="color: #002147; margin-top: 0;">Welcome to the Team, ${firstName}!</h2>
          <p>You've been added as a driver with Road Runner Express. To start receiving and managing your assigned loads, please create your account using the link below.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${signupUrl}" style="${buttonStyle}">Create Your Account</a>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #002147;">What You'll Be Able To Do:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>View loads assigned to you</li>
              <li>Update shipment status (Picked Up / Delivered)</li>
              <li>Upload BOL photos</li>
              <li>Get navigation to pickup and delivery locations</li>
            </ul>
          </div>
          
          <p><strong>Important:</strong> Please sign up using this email address (<strong>${firstName.toLowerCase()}'s email</strong>) so your account is automatically linked to your driver profile.</p>
          
          <p style="color: #6c757d; font-size: 14px;">If you have any questions, contact dispatch.</p>
        </div>
        <div style="${footerStyle}">
          <p style="margin: 0;">Road Runner Express - Fast, Reliable, On Time</p>
        </div>
      </div>
    `,
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-driver-invite function called");
  
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
      JSON.stringify({ error: "Forbidden - Only dispatchers can send driver invites" }),
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

    const { driverEmail, driverFirstName, driverLastName, signupUrl } = validationResult.data;

    console.log(`Sending invite to ${driverEmail}`);

    const emailContent = getInviteEmailContent(driverFirstName, driverLastName, signupUrl);
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Road Runner Express <onboarding@resend.dev>",
        to: [driverEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error sending invite email:", data);
      throw new Error(data.message || "Failed to send email");
    }
    
    console.log("Invite email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Invite sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-driver-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
