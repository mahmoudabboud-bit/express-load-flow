import { jsPDF } from "jspdf";
import { getSignedUrl } from "@/hooks/useSignedUrl";
interface LoadData {
  id: string;
  origin_address: string;
  destination_address: string;
  trailer_type: string;
  weight_lbs: number;
  pickup_date: string;
  driver_name: string | null;
  truck_number: string | null;
  price_cents: number | null;
  client_signature_url: string | null;
  delivered_at: string | null;
  created_at: string;
}

export async function generateDeliveryReceipt(load: LoadData): Promise<void> {
  const doc = new jsPDF();
  
  const primaryColor = "#002147";
  const accentColor = "#FF6B00";
  
  // Header
  doc.setFillColor(0, 33, 71); // Navy blue
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Road Runner Express", 20, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Delivery Receipt", 160, 20);
  doc.text(`#${load.id.slice(0, 8).toUpperCase()}`, 160, 27);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Delivery Status Banner
  doc.setFillColor(76, 175, 80); // Green
  doc.rect(20, 50, 170, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("✓ DELIVERY CONFIRMED", 105, 60, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  
  // Shipment Details Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Shipment Details", 20, 80);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 83, 190, 83);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const detailsY = 95;
  const lineHeight = 12;
  
  // Pickup
  doc.setFont("helvetica", "bold");
  doc.text("Pickup Location:", 20, detailsY);
  doc.setFont("helvetica", "normal");
  doc.text(load.origin_address, 70, detailsY);
  
  // Delivery
  doc.setFont("helvetica", "bold");
  doc.text("Delivery Location:", 20, detailsY + lineHeight);
  doc.setFont("helvetica", "normal");
  doc.text(load.destination_address, 70, detailsY + lineHeight);
  
  // Trailer Type
  doc.setFont("helvetica", "bold");
  doc.text("Trailer Type:", 20, detailsY + lineHeight * 2);
  doc.setFont("helvetica", "normal");
  doc.text(load.trailer_type, 70, detailsY + lineHeight * 2);
  
  // Weight
  doc.setFont("helvetica", "bold");
  doc.text("Weight:", 110, detailsY + lineHeight * 2);
  doc.setFont("helvetica", "normal");
  doc.text(`${load.weight_lbs.toLocaleString()} lbs`, 135, detailsY + lineHeight * 2);
  
  // Pickup Date
  doc.setFont("helvetica", "bold");
  doc.text("Scheduled Pickup:", 20, detailsY + lineHeight * 3);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(load.pickup_date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }), 70, detailsY + lineHeight * 3);
  
  // Delivery Date
  if (load.delivered_at) {
    doc.setFont("helvetica", "bold");
    doc.text("Delivered On:", 20, detailsY + lineHeight * 4);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(load.delivered_at).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }), 70, detailsY + lineHeight * 4);
  }
  
  // Driver Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Driver Information", 20, detailsY + lineHeight * 6);
  doc.line(20, detailsY + lineHeight * 6 + 3, 190, detailsY + lineHeight * 6 + 3);
  
  doc.setFontSize(10);
  const driverY = detailsY + lineHeight * 7 + 5;
  
  doc.setFont("helvetica", "bold");
  doc.text("Driver Name:", 20, driverY);
  doc.setFont("helvetica", "normal");
  doc.text(load.driver_name || "N/A", 70, driverY);
  
  doc.setFont("helvetica", "bold");
  doc.text("Truck Number:", 110, driverY);
  doc.setFont("helvetica", "normal");
  doc.text(load.truck_number || "N/A", 150, driverY);
  
  // Signature Section
  if (load.client_signature_url) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Receiver Signature", 20, driverY + 25);
    doc.line(20, driverY + 28, 190, driverY + 28);
    
    try {
      // Get signed URL for private storage bucket
      const signedUrl = await getSignedUrl(load.client_signature_url);
      if (!signedUrl) throw new Error("Failed to get signed URL");
      
      // Fetch and embed the signature image
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => {
          const imgData = reader.result as string;
          doc.addImage(imgData, "PNG", 20, driverY + 35, 80, 40);
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Failed to load signature image:", err);
      doc.setFontSize(10);
      doc.text("Signature on file", 20, driverY + 45);
    }
  }
  
  // Footer
  doc.setFillColor(248, 249, 250);
  doc.rect(0, 270, 210, 30, "F");
  
  doc.setFontSize(8);
  doc.setTextColor(108, 117, 125);
  doc.text("Road Runner Express - Fast, Reliable, On Time", 105, 280, { align: "center" });
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 287, { align: "center" });
  
  // Save the PDF
  doc.save(`delivery-receipt-${load.id.slice(0, 8)}.pdf`);
}
