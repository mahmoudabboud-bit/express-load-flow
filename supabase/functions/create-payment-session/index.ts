import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { load_id } = await req.json();
    if (!load_id) {
      return new Response(
        JSON.stringify({ error: "Missing load_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch load and verify ownership
    const { data: load, error: loadError } = await supabase
      .from("loads")
      .select("*")
      .eq("id", load_id)
      .single();

    if (loadError || !load) {
      return new Response(
        JSON.stringify({ error: "Load not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is the client who owns this load
    if (load.client_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "You can only pay for your own loads" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify payment is required and pending
    if (!load.payment_required || load.payment_status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Payment is not required for this load" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify price is set
    if (!load.price_cents || load.price_cents <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid price for this load" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    let customerId: string | undefined;
    
    if (profile?.email) {
      // Check if customer already exists
      const existingCustomers = await stripe.customers.list({
        email: profile.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: profile.email,
          metadata: { user_id: user.id },
        });
        customerId = customer.id;
      }
    }

    // Create Stripe Checkout Session
    const origin = req.headers.get("origin") || "https://express-load-flow.lovable.app";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Load Shipment Payment`,
              description: `${load.origin_address} → ${load.destination_address}`,
            },
            unit_amount: load.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/dashboard/shipments?payment=success&load_id=${load_id}`,
      cancel_url: `${origin}/dashboard/shipments?payment=cancelled&load_id=${load_id}`,
      metadata: {
        load_id: load_id,
        user_id: user.id,
      },
    });

    // Store the payment intent ID
    await supabase
      .from("loads")
      .update({ payment_intent_id: session.id })
      .eq("id", load_id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating payment session:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create payment session";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
