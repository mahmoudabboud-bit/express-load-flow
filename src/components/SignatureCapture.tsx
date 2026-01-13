import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, PenTool, RotateCcw } from "lucide-react";

interface SignatureCaptureProps {
  open: boolean;
  onClose: () => void;
  onSign: (signatureDataUrl: string) => Promise<void>;
  loadInfo?: {
    origin: string;
    destination: string;
    driverName?: string;
  };
}

export function SignatureCapture({ open, onClose, onSign, loadInfo }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#002147";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
      setHasSignature(false);
    }
  }, [open]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!canvasRef.current || !hasSignature) return;

    setSaving(true);
    try {
      const signatureDataUrl = canvasRef.current.toDataURL("image/png");
      await onSign(signatureDataUrl);
      onClose();
    } catch (error) {
      console.error("Error saving signature:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool size={20} className="text-accent" />
            Confirm Delivery
          </DialogTitle>
          <DialogDescription>
            Please sign below to confirm you have received the delivery.
          </DialogDescription>
        </DialogHeader>

        {loadInfo && (
          <div className="p-3 bg-secondary/50 rounded-lg text-sm mb-2">
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">{loadInfo.origin}</span>
              <span className="mx-2">→</span>
              <span className="font-medium text-foreground">{loadInfo.destination}</span>
            </div>
            {loadInfo.driverName && (
              <div className="text-muted-foreground mt-1">
                Driver: <span className="font-medium text-foreground">{loadInfo.driverName}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="border-2 border-dashed border-border rounded-lg p-1 bg-background">
            <canvas
              ref={canvasRef}
              width={380}
              height={180}
              className="w-full touch-none cursor-crosshair rounded"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Sign using your mouse or touch screen
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={!hasSignature || saving}
            className="w-full sm:w-auto"
          >
            <RotateCcw size={16} className="mr-2" />
            Clear
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleSign}
              disabled={!hasSignature || saving}
              className="flex-1 sm:flex-none"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Sign"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
