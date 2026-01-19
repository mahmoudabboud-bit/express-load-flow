import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const dispatcherEmail = Deno.env.get("DISPATCHER_EMAIL");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = "mailto:roadrunner.xprss@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const loadDataSchema = z.object({
  id: z.string().uuid({ message: "Invalid load ID format" }),
  origin_address: z.string().min(1, "Origin address is required").max(500, "Origin address too long"),
  destination_address: z.string().min(1, "Destination address is required").max(500, "Destination address too long"),
  pickup_date: z.string().min(1, "Pickup date is required").max(50, "Pickup date too long"),
  trailer_type: z.string().max(100, "Trailer type too long").optional().nullable(),
  weight_lbs: z.number().int().positive().max(1000000, "Weight exceeds maximum").optional().nullable(),
  driver_name: z.string().max(200, "Driver name too long").optional().nullable(),
  truck_number: z.string().max(50, "Truck number too long").optional().nullable(),
  eta: z.string().max(100, "ETA too long").optional().nullable(),
});

// Driver availability notification schema
const driverDataSchema = z.object({
  driverName: z.string().min(1, "Driver name required").max(200, "Driver name too long"),
  previousStatus: z.string().max(50, "Previous status too long").optional(),
  newStatus: z.string().min(1, "New status required").max(50, "New status too long"),
  availableAt: z.string().max(100, "Available at too long").optional().nullable(),
  truckNumber: z.string().max(50, "Truck number too long").optional().nullable(),
});

const notificationRequestSchema = z.object({
  type: z.enum(['load_submitted', 'load_approved', 'status_in_transit', 'status_delivered', 'eta_updated', 'driver_availability_changed', 'payment_requested'], {
    errorMap: () => ({ message: "Invalid notification type" })
  }),
  recipientEmail: z.string().email("Invalid email format").max(255, "Email too long").optional(),
  recipientUserId: z.string().uuid("Invalid user ID format").optional(),
  loadData: loadDataSchema.optional(),
  driverData: driverDataSchema.optional(),
  notifyDispatcher: z.boolean().optional(),
});

type NotificationRequest = z.infer<typeof notificationRequestSchema>;
type LoadData = z.infer<typeof loadDataSchema>;
type DriverData = z.infer<typeof driverDataSchema>;

function getEmailContent(type: string, loadData: LoadData) {
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
        subject: `Load #${loadData.id.slice(0, 8)} Assigned - Driver Ready`,
        html: `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">🚚 Road Runner Express</h1>
            </div>
            <div style="${contentStyle}">
              <h2 style="color: #002147; margin-top: 0;">Great News! Your Load is Assigned ✓</h2>
              <p>Your shipment has been assigned and a driver is ready for pickup.</p>
              
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

    case "eta_updated":
      const formatEta = (eta: string) => {
        return new Date(eta).toLocaleString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      };
      return {
        subject: `ETA Update for Load #${loadData.id.slice(0, 8)}`,
        html: `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">🚚 Road Runner Express</h1>
            </div>
            <div style="${contentStyle}">
              <h2 style="color: #002147; margin-top: 0;">ETA Update for Your Shipment 📅</h2>
              <p>The estimated arrival time for your shipment has been ${loadData.eta ? 'updated' : 'set'}.</p>
              
              ${loadData.eta ? `
              <div style="background: ${accentColor}; color: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Estimated Arrival</p>
                <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold;">${formatEta(loadData.eta)}</p>
              </div>
              ` : ''}
              
              <div style="${detailBoxStyle}">
                <h3 style="margin-top: 0; color: #002147;">Shipment Details</h3>
                <p><strong>Reference ID:</strong> #${loadData.id.slice(0, 8)}</p>
                <p><strong>From:</strong> ${loadData.origin_address}</p>
                <p><strong>To:</strong> ${loadData.destination_address}</p>
                ${loadData.driver_name ? `<p><strong>Driver:</strong> ${loadData.driver_name}</p>` : ''}
                ${loadData.truck_number ? `<p><strong>Truck:</strong> ${loadData.truck_number}</p>` : ''}
              </div>
              
              <p>Track your shipment anytime by logging into your account.</p>
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

function getDriverAvailabilityEmailContent(driverData: DriverData) {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
  `;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return '#4caf50';
      case 'Maintenance': return '#ff9800';
      case 'Resetting 10 hours': 
      case 'Resetting 34 hours': return '#ff9800';
      case 'Not Available': return '#f44336';
      default: return '#6c757d';
    }
  };

  const formatAvailableAt = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const statusColor = getStatusColor(driverData.newStatus);

  return {
    subject: `🚛 Driver ${driverData.driverName} - Status: ${driverData.newStatus}`,
    html: `
      <div style="${baseStyle}">
        <div style="background: linear-gradient(135deg, #002147 0%, #003366 100%); color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🚚 Road Runner Express</h1>
        </div>
        <div style="padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #002147; margin-top: 0;">Driver Availability Update</h2>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #002147;">Driver Information</h3>
            <p><strong>Driver:</strong> ${driverData.driverName}</p>
            ${driverData.truckNumber ? `<p><strong>Truck #:</strong> ${driverData.truckNumber}</p>` : ''}
            ${driverData.previousStatus ? `<p><strong>Previous Status:</strong> ${driverData.previousStatus}</p>` : ''}
          </div>
          
          <div style="background: ${statusColor}; color: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Current Status</p>
            <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold;">${driverData.newStatus}</p>
            ${driverData.newStatus === 'Not Available' && driverData.availableAt ? `
              <p style="margin: 12px 0 0 0; font-size: 14px; opacity: 0.9;">
                Will be available: ${formatAvailableAt(driverData.availableAt)}
              </p>
            ` : ''}
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">This is an automated notification to keep dispatch informed of driver availability changes.</p>
        </div>
        <div style="background: #002147; color: white; padding: 16px; text-align: center;">
          <p style="margin: 0;">Road Runner Express Dispatch System</p>
        </div>
      </div>
    `,
  };
}

function getDispatcherEmailContent(loadData: LoadData, clientEmail: string) {
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

function getInAppNotificationTitle(type: string): string {
  switch (type) {
    case "load_submitted":
      return "Load Request Received";
    case "load_approved":
      return "Load Assigned!";
    case "status_in_transit":
      return "Shipment In Transit";
    case "status_delivered":
      return "Shipment Delivered";
    case "eta_updated":
      return "ETA Updated";
    case "driver_availability_changed":
      return "Driver Availability Changed";
    default:
      return "Notification";
  }
}

function getInAppNotificationMessage(type: string, loadData?: LoadData, driverData?: DriverData): string {
  if (type === "driver_availability_changed" && driverData) {
    const availableInfo = driverData.newStatus === "Not Available" && driverData.availableAt 
      ? ` - Available ${new Date(driverData.availableAt).toLocaleString()}`
      : '';
    return `${driverData.driverName} is now ${driverData.newStatus}${availableInfo}`;
  }

  if (!loadData) {
    return "You have a new notification.";
  }

  const shortId = loadData.id.slice(0, 8);
  switch (type) {
    case "load_submitted":
      return `Your load request #${shortId} from ${loadData.origin_address} to ${loadData.destination_address} has been received and is under review.`;
    case "load_approved":
      return `Load #${shortId} has been assigned. Driver ${loadData.driver_name || "assigned"} with Truck ${loadData.truck_number || "assigned"}.`;
    case "status_in_transit":
      return `Your shipment #${shortId} is now in transit from ${loadData.origin_address}.`;
    case "status_delivered":
      return `Your shipment #${shortId} has been delivered to ${loadData.destination_address}.`;
    case "eta_updated":
      return `ETA for shipment #${shortId} has been updated${loadData.eta ? `: ${new Date(loadData.eta).toLocaleString()}` : ''}.`;
    default:
      return "You have a new notification.";
  }
}

// Send push notifications to all user's devices
async function sendPushNotifications(
  supabase: any,
  userId: string,
  payload: { title: string; body: string; load_id?: string }
): Promise<{ sent: number; failed: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("VAPID keys not configured, skipping push notifications");
    return { sent: 0, failed: 0 };
  }

  try {
    // Get all push subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for user:", userId);
      return { sent: 0, failed: 0 };
    }

    console.log(`Found ${subscriptions.length} push subscriptions for user ${userId}`);

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions as Array<{ endpoint: string; p256dh: string; auth: string }>) {
      try {
        // Simple push without payload (triggers the service worker)
        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "TTL": "86400",
            "Urgency": "high",
            "Content-Length": "0",
          },
        });

        if (response.status === 201 || response.status === 200) {
          sent++;
          console.log("Push notification sent successfully");
        } else if (response.status === 404 || response.status === 410) {
          expiredEndpoints.push(sub.endpoint);
          failed++;
          console.log("Subscription expired, will remove");
        } else {
          failed++;
          console.log(`Push failed with status ${response.status}`);
        }
      } catch (err) {
        failed++;
        console.error("Error sending push to subscription:", err);
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .in("endpoint", expiredEndpoints);
      console.log(`Removed ${expiredEndpoints.length} expired subscriptions`);
    }

    return { sent, failed };
  } catch (err) {
    console.error("Error in sendPushNotifications:", err);
    return { sent: 0, failed: 0 };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.error("No authorization header provided");
    return new Response(
      JSON.stringify({ error: "Unauthorized - No authorization header" }),
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
      JSON.stringify({ error: "Unauthorized - Invalid token" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  console.log("Authenticated user:", user.id);

  try {
    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      console.error("Failed to parse JSON body");
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const validationResult = notificationRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Input validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validationResult.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { type, recipientEmail, recipientUserId, loadData, driverData, notifyDispatcher } = validationResult.data;

    // Handle driver availability notifications
    if (type === "driver_availability_changed") {
      if (!driverData) {
        return new Response(
          JSON.stringify({ error: "Driver data is required for availability notifications" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if user is a driver
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (userRole?.role !== "driver") {
        console.error("User is not a driver:", user.id);
        return new Response(
          JSON.stringify({ error: "Only drivers can send availability notifications" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`Processing driver availability notification for ${driverData.driverName}: ${driverData.newStatus}`);

      // Fetch all dispatcher user IDs and notify them
      const { data: dispatchers, error: dispatcherError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "dispatcher");

      if (dispatcherError) {
        console.error("Error fetching dispatchers:", dispatcherError);
      }

      const notificationTitle = getInAppNotificationTitle(type);
      const notificationMessage = getInAppNotificationMessage(type, undefined, driverData);

      const notificationsToInsert: Array<{
        user_id: string;
        type: string;
        title: string;
        message: string;
        load_id: null;
        read: boolean;
      }> = [];

      const pushRecipients: string[] = [];

      if (dispatchers && dispatchers.length > 0) {
        for (const dispatcher of dispatchers) {
          notificationsToInsert.push({
            user_id: dispatcher.user_id,
            type,
            title: notificationTitle,
            message: notificationMessage,
            load_id: null,
            read: false,
          });
          pushRecipients.push(dispatcher.user_id);
        }
        console.log(`Adding availability notifications for ${dispatchers.length} dispatchers`);
      }

      // Insert all in-app notifications
      if (notificationsToInsert.length > 0) {
        const { error: notifError } = await supabase.from("notifications").insert(notificationsToInsert);
        
        if (notifError) {
          console.error("Error creating in-app notifications:", notifError);
        } else {
          console.log(`Created ${notificationsToInsert.length} in-app notifications successfully`);
        }
      }

      // Send push notifications to all dispatchers
      let totalPushSent = 0;
      let totalPushFailed = 0;
      
      for (const userId of pushRecipients) {
        const pushPayload = {
          title: notificationTitle,
          body: notificationMessage,
        };
        const { sent, failed } = await sendPushNotifications(supabase, userId, pushPayload);
        totalPushSent += sent;
        totalPushFailed += failed;
      }

      console.log(`Push notifications: ${totalPushSent} sent, ${totalPushFailed} failed`);

      // Send email to dispatcher if configured
      if (dispatcherEmail) {
        const emailContent = getDriverAvailabilityEmailContent(driverData);
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Road Runner Express <onboarding@resend.dev>",
            to: [dispatcherEmail],
            subject: emailContent.subject,
            html: emailContent.html,
          }),
        });

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          console.error("Error sending dispatcher email:", emailData);
        } else {
          console.log("Dispatcher email sent successfully:", emailData);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Availability notification sent",
          push: { sent: totalPushSent, failed: totalPushFailed }
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Handle load-related notifications (existing logic)
    if (!loadData) {
      return new Response(
        JSON.stringify({ error: "Load data is required for load notifications" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Recipient email is required for load notifications" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user has permission to send notifications for this load
    const { data: load, error: loadError } = await supabase
      .from("loads")
      .select("client_id")
      .eq("id", loadData.id)
      .single();

    if (loadError || !load) {
      console.error("Load not found:", loadError);
      return new Response(
        JSON.stringify({ error: "Load not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is the load owner
    const isLoadOwner = load.client_id === user.id;

    // Check if user is a dispatcher or driver
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isDispatcher = userRole?.role === "dispatcher";
    const isDriver = userRole?.role === "driver";

    if (!isLoadOwner && !isDispatcher && !isDriver) {
      console.error("User not authorized for this load:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden - You don't have permission to send notifications for this load" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`User ${user.id} authorized: owner=${isLoadOwner}, dispatcher=${isDispatcher}, driver=${isDriver}`);
    console.log(`Processing ${type} notification for load ${loadData.id}`);
    console.log(`Recipient: ${recipientEmail}, User ID: ${recipientUserId}`);

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

    // Create in-app notification content
    const notificationTitle = getInAppNotificationTitle(type);
    const notificationMessage = getInAppNotificationMessage(type, loadData);
    
    const notificationsToInsert: Array<{
      user_id: string;
      type: string;
      title: string;
      message: string;
      load_id: string;
      read: boolean;
    }> = [];

    const pushRecipients: string[] = [];

    if (recipientUserId) {
      notificationsToInsert.push({
        user_id: recipientUserId,
        type,
        title: notificationTitle,
        message: notificationMessage,
        load_id: loadData.id,
        read: false,
      });
      pushRecipients.push(recipientUserId);
    }

    // Fetch all dispatcher user IDs and notify them
    const { data: dispatchers, error: dispatcherError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "dispatcher");

    if (dispatcherError) {
      console.error("Error fetching dispatchers:", dispatcherError);
    } else if (dispatchers && dispatchers.length > 0) {
      const dispatcherTitle = type === "load_submitted" 
        ? "New Load Request" 
        : `Load #${loadData.id.slice(0, 8)} Updated`;
      
      const dispatcherMessage = type === "load_submitted"
        ? `New load request #${loadData.id.slice(0, 8)} from ${loadData.origin_address} to ${loadData.destination_address}`
        : `Load #${loadData.id.slice(0, 8)}: ${notificationTitle}`;

      for (const dispatcher of dispatchers) {
        if (dispatcher.user_id !== recipientUserId) {
          notificationsToInsert.push({
            user_id: dispatcher.user_id,
            type,
            title: dispatcherTitle,
            message: dispatcherMessage,
            load_id: loadData.id,
            read: false,
          });
          pushRecipients.push(dispatcher.user_id);
        }
      }
      console.log(`Adding notifications for ${dispatchers.length} dispatchers`);
    }

    // Insert all in-app notifications
    if (notificationsToInsert.length > 0) {
      const { error: notifError } = await supabase.from("notifications").insert(notificationsToInsert);
      
      if (notifError) {
        console.error("Error creating in-app notifications:", notifError);
      } else {
        console.log(`Created ${notificationsToInsert.length} in-app notifications successfully`);
      }
    }

    // Send push notifications to all recipients
    let totalPushSent = 0;
    let totalPushFailed = 0;
    
    for (const userId of pushRecipients) {
      const pushPayload = {
        title: notificationTitle,
        body: notificationMessage,
        load_id: loadData.id,
      };
      const { sent, failed } = await sendPushNotifications(supabase, userId, pushPayload);
      totalPushSent += sent;
      totalPushFailed += failed;
    }

    console.log(`Push notifications: ${totalPushSent} sent, ${totalPushFailed} failed`);

    // If this is a load submission, also notify dispatcher via email
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
      } else {
        console.log("Dispatcher email sent successfully:", dispatcherData);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent",
        push: { sent: totalPushSent, failed: totalPushFailed }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);