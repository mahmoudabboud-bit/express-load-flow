import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const inviteRequestSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
});

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getInviteEmailContent(fullName: string, signupUrl: string) {
  const subject = "You've been invited to join Road Runner Express as a Dispatcher";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dispatcher Invitation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #002147 0%, #003366 100%); padding: 32px 40px; border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                    🚚 Road Runner Express
                  </h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                    You Call It, We'll Haul It
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 16px 0; color: #002147; font-size: 22px;">
                    Welcome to the Team, ${fullName}!
                  </h2>
                  <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                    You've been invited to join Road Runner Express as a <strong style="color: #002147;">Dispatcher</strong>. 
                    As a dispatcher, you'll be able to manage loads, assign drivers, and oversee operations.
                  </p>
                  
                  <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px; font-weight: 600;">
                      YOUR DISPATCHER PRIVILEGES INCLUDE:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #52525b; font-size: 14px; line-height: 1.8;">
                      <li>View and manage all loads</li>
                      <li>Assign drivers to shipments</li>
                      <li>Track real-time delivery status</li>
                      <li>Access financial insights and reports</li>
                      <li>Manage clients and drivers</li>
                    </ul>
                  </div>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center">
                        <a href="${signupUrl}" style="display: inline-block; background-color: #FF6B00; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                          Create Your Account
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 24px 0 0 0; color: #a1a1aa; font-size: 13px; text-align: center;">
                    This invitation link will expire in 7 days.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f4f4f5; padding: 24px 40px; border-radius: 0 0 12px 12px; text-align: center;">
                  <p style="margin: 0; color: #71717a; font-size: 12px;">
                    Road Runner Express | 13830 Trailville Dr., Houston, TX 77077<br>
                    © ${new Date().getFullYear()} PANOCEAN INC. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  return { subject, html };
}

async function handler(req: Request): Promise<Response> {
  console.log("send-dispatcher-invite function called");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is a dispatcher
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("User verification failed:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if user is a dispatcher
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || roleData?.role !== "dispatcher") {
      console.error("User is not a dispatcher:", roleError);
      return new Response(JSON.stringify({ error: "Forbidden - only dispatchers can invite" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse and validate request body
    const body = await req.json();
    const parseResult = inviteRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      console.error("Validation failed:", parseResult.error);
      return new Response(JSON.stringify({ error: "Invalid request data", details: parseResult.error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, fullName } = parseResult.data;

    // Check if email is already invited and pending
    const { data: existingInvite } = await supabase
      .from("dispatcher_invites")
      .select("*")
      .eq("email", email)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingInvite) {
      console.log("Active invite already exists for:", email);
      return new Response(JSON.stringify({ error: "An active invitation already exists for this email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if user is already a dispatcher
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingUser) {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", existingUser.id)
        .single();

      if (existingRole?.role === "dispatcher") {
        return new Response(JSON.stringify({ error: "This email is already registered as a dispatcher" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Generate invite token
    const inviteToken = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Store invite in database
    const { error: insertError } = await supabase
      .from("dispatcher_invites")
      .insert({
        email,
        token: inviteToken,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Failed to store invite:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Build signup URL
    const baseUrl = req.headers.get("origin") || "https://express-load-flow.lovable.app";
    const signupUrl = `${baseUrl}/auth/dispatcher-signup?token=${inviteToken}`;

    // Send email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resend = new Resend(resendApiKey);
    const { subject, html } = getInviteEmailContent(fullName, signupUrl);

    const emailResponse = await resend.emails.send({
      from: "Road Runner Express <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Invitation sent successfully",
      email 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-dispatcher-invite:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

serve(handler);
