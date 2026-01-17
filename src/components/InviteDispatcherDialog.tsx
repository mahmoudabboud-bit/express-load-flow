import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Loader2, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

interface InviteDispatcherDialogProps {
  trigger?: React.ReactNode;
}

export function InviteDispatcherDialog({ trigger }: InviteDispatcherDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; fullName?: string }>({});

  const { toast } = useToast();

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setErrors({});
    setSuccess(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (!fullName.trim()) {
      newErrors.fullName = "Please enter the dispatcher's name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to send invitations",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("send-dispatcher-invite", {
        body: { email, fullName },
      });

      if (error) {
        console.error("Error sending invite:", error);
        toast({
          variant: "destructive",
          title: "Failed to send invitation",
          description: error.message || "An unexpected error occurred",
        });
        setLoading(false);
        return;
      }

      if (data?.error) {
        toast({
          variant: "destructive",
          title: "Failed to send invitation",
          description: data.error,
        });
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast({
        title: "Invitation sent!",
        description: `An invitation has been sent to ${email}`,
      });

    } catch (err: any) {
      console.error("Error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to send invitation",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <UserPlus className="mr-2" size={18} />
            Invite Dispatcher
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="text-accent" size={20} />
            Invite New Dispatcher
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a new dispatcher. They'll receive an email with a link to create their account.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-status-delivered/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-status-delivered" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Invitation Sent!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              An email has been sent to <strong>{email}</strong> with instructions to join as a dispatcher.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={resetForm}>
                Send Another
              </Button>
              <Button variant="accent" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full Name</Label>
              <Input
                id="invite-name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={errors.fullName ? "border-destructive" : ""}
                disabled={loading}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="dispatcher@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-destructive" : ""}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="mr-2" size={16} />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
