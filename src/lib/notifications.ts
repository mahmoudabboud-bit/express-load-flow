import { supabase } from "@/integrations/supabase/client";

interface LoadData {
  id: string;
  origin_address: string;
  destination_address: string;
  pickup_date: string;
  trailer_type?: string;
  weight_lbs?: number;
  driver_name?: string;
  truck_number?: string;
}

type NotificationType = "load_submitted" | "load_approved" | "status_in_transit" | "status_delivered";

export async function sendNotification(
  type: NotificationType,
  recipientEmail: string,
  loadData: LoadData,
  notifyDispatcher: boolean = false,
  recipientUserId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: {
        type,
        recipientEmail,
        recipientUserId,
        loadData,
        notifyDispatcher,
      },
    });

    if (error) {
      console.error("Notification error:", error);
      return { success: false, error: error.message };
    }

    console.log("Notification sent:", data);
    return { success: true };
  } catch (err: any) {
    console.error("Notification exception:", err);
    return { success: false, error: err.message };
  }
}
