import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

interface InviteData {
  email: string;
  expires_at: string;
  used: boolean;
}

export default function DispatcherSignupPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  const { signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setTokenError("No invitation token provided");
        setValidatingToken(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("dispatcher_invites")
          .select("email, expires_at, used")
          .eq("token", token)
          .single();

        if (error || !data) {
          setTokenError("Invalid invitation token");
          setValidatingToken(false);
          return;
        }

        const invite = data as InviteData;

        if (invite.used) {
          setTokenError("This invitation has already been used");
          setValidatingToken(false);
          return;
        }

        if (new Date(invite.expires_at) < new Date()) {
          setTokenError("This invitation has expired");
          setValidatingToken(false);
          return;
        }

        // Token is valid
        setEmail(invite.email);
        setTokenValid(true);
        setValidatingToken(false);
      } catch (err) {
        console.error("Error validating token:", err);
        setTokenError("Failed to validate invitation");
        setValidatingToken(false);
      }
    }

    validateToken();
  }, [token]);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!fullName.trim()) {
      newErrors.fullName = "Please enter your full name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) return;
    
    setLoading(true);

    try {
      // Sign up as dispatcher
      const { error } = await signUp(email, password, "dispatcher", fullName);
      
      if (error) {
        const errorMessage = error.message.includes("already registered")
          ? "This email is already registered. Please sign in instead."
          : error.message;
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: errorMessage,
        });
        setLoading(false);
        return;
      }

      // Mark invite as used
      await supabase
        .from("dispatcher_invites")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("token", token);

      toast({
        title: "Account created!",
        description: "Welcome to Road Runner Express. You now have dispatcher access.",
      });
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>
              {tokenError || "This invitation link is not valid."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Please contact your administrator to request a new invitation.
            </p>
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2" size={16} />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero p-12 flex-col">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-12">
          <ArrowLeft size={20} />
          Back to home
        </Link>
        
        <div className="flex-1 flex flex-col justify-center">
          <Logo variant="light" size="lg" className="mb-8" />
          <h1 className="text-3xl font-bold text-primary-foreground mb-4">
            Dispatcher Access
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-12">
            You've been invited to join Road Runner Express as a dispatcher. Complete your registration to get started.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-primary-foreground/10 rounded-xl">
              <ShieldCheck className="text-accent shrink-0" size={24} />
              <div>
                <div className="font-semibold text-primary-foreground">Admin Privileges</div>
                <div className="text-sm text-primary-foreground/70">Full access to manage loads, drivers & clients</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft size={20} />
            Back to home
          </Link>

          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2 text-accent mb-2">
                <ShieldCheck size={20} />
                <span className="text-sm font-medium">Dispatcher Invitation</span>
              </div>
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <CardDescription>
                Complete your registration to access the dispatch center
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    This email was specified in your invitation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Dispatcher Account"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth" className="text-accent font-semibold hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
