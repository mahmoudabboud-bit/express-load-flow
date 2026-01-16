import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Webhook signature verification failed:", errMessage);
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Parse event without verification (for testing)
      event = JSON.parse(body);
      console.warn("Webhook signature not verified - STRIPE_WEBHOOK_SECRET not set");
    }

    // Initialize Supabase with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle checkout session completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const loadId = session.metadata?.load_id;
      const userId = session.metadata?.user_id;

      if (loadId) {
        console.log(`Processing payment completion for load: ${loadId}`);

        // Update load payment status
        const { error: updateError } = await supabase
          .from("loads")
          .update({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            payment_intent_id: session.payment_intent as string || session.id,
          })
          .eq("id", loadId);

        if (updateError) {
          console.error("Error updating load payment status:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update payment status" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Load ${loadId} marked as paid`);

        // Create notification for dispatcher
        const { data: dispatchers } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "dispatcher");

        if (dispatchers && dispatchers.length > 0) {
          // Get load details for notification
          const { data: load } = await supabase
            .from("loads")
            .select("origin_address, destination_address, price_cents")
            .eq("id", loadId)
            .single();

          if (load) {
            const notifications = dispatchers.map((d) => ({
              user_id: d.user_id,
              title: "Payment Received",
              message: `Payment of $${((load.price_cents || 0) / 100).toFixed(2)} received for load: ${load.origin_address} → ${load.destination_address}`,
              type: "payment_received",
              load_id: loadId,
              read: false,
            }));

            await supabase.from("notifications").insert(notifications);
          }
        }

        // Create notification for client
        if (userId) {
          const { data: load } = await supabase
            .from("loads")
            .select("origin_address, destination_address, price_cents")
            .eq("id", loadId)
            .single();

          if (load) {
            await supabase.from("notifications").insert({
              user_id: userId,
              title: "Payment Successful",
              message: `Your payment of $${((load.price_cents || 0) / 100).toFixed(2)} for the shipment to ${load.destination_address} was successful.`,
              type: "payment_confirmed",
              load_id: loadId,
              read: false,
            });
          }
        }
      }
    }

    // Handle payment failed
    if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
      let loadId: string | undefined;
      
      if (event.type === "checkout.session.expired") {
        const session = event.data.object as Stripe.Checkout.Session;
        loadId = session.metadata?.load_id;
      }

      if (loadId) {
        console.log(`Payment failed/expired for load: ${loadId}`);
        
        await supabase
          .from("loads")
          .update({ payment_status: "failed" })
          .eq("id", loadId);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Webhook processing failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
