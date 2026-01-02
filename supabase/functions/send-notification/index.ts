import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const dispatcherEmail = Deno.env.get("DISPATCHER_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "load_submitted" | "load_approved" | "status_in_transit" | "status_delivered";
  recipientEmail: string;
  loadData: {
    id: string;
    origin_address: string;
    destination_address: string;
    pickup_date: string;
    trailer_type?: string;
    weight_lbs?: number;
    driver_name?: string;
    truck_number?: string;
  };
  notifyDispatcher?: boolean;
}

function getEmailContent(type: string, loadData: NotificationRequest["loadData"]) {
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
  
  const detailBoxStyle = `
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  `;
  
  const accentColor = "#FF6B00";

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  switch (type) {
    case "load_submitted":
      return {
        subject: `Load Request #${loadData.id.slice(0, 8)} Received`,
        html: `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">🚚 Road Runner Express</h1>
            </div>
            <div style="${contentStyle}">
              <h2 style="color: #002147; margin-top: 0;">Load Request Received!</h2>
              <p>Thank you for submitting your load request. Our dispatch team is reviewing your shipment and will assign a driver shortly.</p>
              
              <div style="${detailBoxStyle}">
                <h3 style="margin-top: 0; color: #002147;">Shipment Details</h3>
                <p><strong>Reference ID:</strong> #${loadData.id.slice(0, 8)}</p>
                <p><strong>Pickup:</strong> ${loadData.origin_address}</p>
                <p><strong>Delivery:</strong> ${loadData.destination_address}</p>
                <p><strong>Scheduled Pickup:</strong> ${formatDate(loadData.pickup_date)}</p>
                ${loadData.trailer_type ? `<p><strong>Trailer Type:</strong> ${loadData.trailer_type}</p>` : ''}
                ${loadData.weight_lbs ? `<p><strong>Weight:</strong> ${loadData.weight_lbs.toLocaleString()} lbs</p>` : ''}
              </div>
              
              <p style="color: ${accentColor}; font-weight: 600;">We'll notify you once your load is approved and a driver is assigned.</p>
            </div>
            <div style="${footerStyle}">
              <p style="margin: 0;">Road Runner Express - Fast, Reliable, On Time</p>
            </div>
          </div>
        `,
      };

    case "load_approved":
      return {
        subject: `Load #${loadData.id.slice(0, 8)} Approved - Driver Assigned`,
        html: `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">🚚 Road Runner Express</h1>
            </div>
            <div style="${contentStyle}">
              <h2 style="color: #002147; margin-top: 0;">Great News! Your Load is Approved ✓</h2>
              <p>Your shipment has been approved and a driver has been assigned.</p>
              
              <div style="${detailBoxStyle}">
                <h3 style="margin-top: 0; color: #002147;">Shipment Details</h3>
                <p><strong>Reference ID:</strong> #${loadData.id.slice(0, 8)}</p>
                <p><strong>Pickup:</strong> ${loadData.origin_address}</p>
                <p><strong>Delivery:</strong> ${loadData.destination_address}</p>
                <p><strong>Scheduled Pickup:</strong> ${formatDate(loadData.pickup_date)}</p>
              </div>
              
              <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #4caf50;">
                <h3 style="margin-top: 0; color: #2e7d32;">Driver Information</h3>
                <p><strong>Driver:</strong> ${loadData.driver_name || 'Assigned'}</p>
                <p><strong>Truck #:</strong> ${loadData.truck_number || 'Assigned'}</p>
              </div>
              
              <p>We'll send you another update when your shipment is picked up and in transit.</p>
            </div>
            <div style="${footerStyle}">
              <p style="margin: 0;">Road Runner Express - Fast, Reliable, On Time</p>
            </div>
          </div>
        `,
      };

    case "status_in_transit":
      return {
        subject: `Load #${loadData.id.slice(0, 8)} is Now In Transit`,
        html: `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">🚚 Road Runner Express</h1>
            </div>
            <div style="${contentStyle}">
              <h2 style="color: #002147; margin-top: 0;">Your Shipment is On The Move! 🚛</h2>
              <p>Great news! Your shipment has been picked up and is now in transit to its destination.</p>
              
              <div style="${detailBoxStyle}">
                <h3 style="margin-top: 0; color: #002147;">Shipment Details</h3>
                <p><strong>Reference ID:</strong> #${loadData.id.slice(0, 8)}</p>
                <p><strong>From:</strong> ${loadData.origin_address}</p>
                <p><strong>To:</strong> ${loadData.destination_address}</p>
                ${loadData.driver_name ? `<p><strong>Driver:</strong> ${loadData.driver_name}</p>` : ''}
              </div>
              
              <p style="background: ${accentColor}; color: white; padding: 12px 20px; border-radius: 6px; display: inline-block; font-weight: 600;">
                Status: IN TRANSIT
              </p>
              
              <p style="margin-top: 24px;">We'll notify you when your shipment has been delivered.</p>
            </div>
            <div style="${footerStyle}">
              <p style="margin: 0;">Road Runner Express - Fast, Reliable, On Time</p>
            </div>
          </div>
        `,
      };

    case "status_delivered":
      return {
        subject: `Load #${loadData.id.slice(0, 8)} Has Been Delivered`,
        html: `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">🚚 Road Runner Express</h1>
            </div>
            <div style="${contentStyle}">
              <h2 style="color: #002147; margin-top: 0;">Delivery Complete! ✅</h2>
              <p>Your shipment has been successfully delivered to its destination.</p>
              
              <div style="${detailBoxStyle}">
                <h3 style="margin-top: 0; color: #002147;">Shipment Details</h3>
                <p><strong>Reference ID:</strong> #${loadData.id.slice(0, 8)}</p>
                <p><strong>From:</strong> ${loadData.origin_address}</p>
                <p><strong>To:</strong> ${loadData.destination_address}</p>
                ${loadData.driver_name ? `<p><strong>Driver:</strong> ${loadData.driver_name}</p>` : ''}
              </div>
              
              <p style="background: #4caf50; color: white; padding: 12px 20px; border-radius: 6px; display: inline-block; font-weight: 600;">
                Status: DELIVERED
              </p>
              
              <p style="margin-top: 24px;">Thank you for choosing Road Runner Express! We appreciate your business.</p>
            </div>
            <div style="${footerStyle}">
              <p style="margin: 0;">Road Runner Express - Fast, Reliable, On Time</p>
            </div>
          </div>
        `,
      };

    default:
      return { subject: "Road Runner Express Notification", html: "<p>Notification</p>" };
  }
}

function getDispatcherEmailContent(loadData: NotificationRequest["loadData"], clientEmail: string) {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
  `;
  
  return {
    subject: `🚨 New Load Request #${loadData.id.slice(0, 8)}`,
    html: `
      <div style="${baseStyle}">
        <div style="background: #FF6B00; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Load Alert!</h1>
        </div>
        <div style="padding: 24px; background: #ffffff;">
          <p><strong>A new load has been submitted and requires your attention.</strong></p>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #002147;">Load Details</h3>
            <p><strong>Reference ID:</strong> #${loadData.id.slice(0, 8)}</p>
            <p><strong>Client Email:</strong> ${clientEmail}</p>
            <p><strong>Pickup:</strong> ${loadData.origin_address}</p>
            <p><strong>Delivery:</strong> ${loadData.destination_address}</p>
            <p><strong>Pickup Date:</strong> ${new Date(loadData.pickup_date).toLocaleDateString()}</p>
            ${loadData.trailer_type ? `<p><strong>Trailer Type:</strong> ${loadData.trailer_type}</p>` : ''}
            ${loadData.weight_lbs ? `<p><strong>Weight:</strong> ${loadData.weight_lbs.toLocaleString()} lbs</p>` : ''}
          </div>
          
          <p>Please review and assign a driver at your earliest convenience.</p>
        </div>
        <div style="background: #002147; color: white; padding: 16px; text-align: center;">
          <p style="margin: 0;">Road Runner Express Dispatch System</p>
        </div>
      </div>
    `,
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientEmail, loadData, notifyDispatcher }: NotificationRequest = await req.json();
    
    console.log(`Processing ${type} notification for load ${loadData.id}`);
    console.log(`Recipient: ${recipientEmail}`);

    const emailContent = getEmailContent(type, loadData);
    
    // Send to recipient using Resend API
    const recipientResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Road Runner Express <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const recipientData = await recipientResponse.json();

    if (!recipientResponse.ok) {
      console.error("Error sending recipient email:", recipientData);
      throw new Error(recipientData.message || "Failed to send email");
    }
    
    console.log("Recipient email sent successfully:", recipientData);

    // If this is a load submission, also notify dispatcher
    if (notifyDispatcher && dispatcherEmail) {
      const dispatcherContent = getDispatcherEmailContent(loadData, recipientEmail);
      
      const dispatcherResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Road Runner Express <onboarding@resend.dev>",
          to: [dispatcherEmail],
          subject: dispatcherContent.subject,
          html: dispatcherContent.html,
        }),
      });

      const dispatcherData = await dispatcherResponse.json();

      if (!dispatcherResponse.ok) {
        console.error("Error sending dispatcher email:", dispatcherData);
        // Don't throw - dispatcher notification is secondary
      } else {
        console.log("Dispatcher email sent successfully:", dispatcherData);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
