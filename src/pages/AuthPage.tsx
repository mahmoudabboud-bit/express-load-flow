import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth, UserRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Package, BarChart3, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

    if (mode === "signup" && !fullName.trim()) {
      newErrors.fullName = "Please enter your full name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message === "Invalid login credentials" 
              ? "Invalid email or password. Please try again."
              : error.message,
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          navigate("/dashboard");
        }
      } else {
        const { error } = await signUp(email, password, role, fullName);
        if (error) {
          const errorMessage = error.message.includes("already registered")
            ? "This email is already registered. Please sign in instead."
            : error.message;
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description: errorMessage,
          });
        } else {
          toast({
            title: "Account created!",
            description: "You can now sign in with your credentials.",
          });
          navigate("/dashboard");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
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
            {mode === "signin" ? "Welcome Back" : "Join Road Runner Express"}
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-12">
            {mode === "signin"
              ? "Sign in to access your dashboard and manage your logistics."
              : "Create an account to start managing your freight operations."}
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-primary-foreground/10 rounded-xl">
              <Package className="text-accent shrink-0" size={24} />
              <div>
                <div className="font-semibold text-primary-foreground">Clients</div>
                <div className="text-sm text-primary-foreground/70">Request loads & track shipments</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-primary-foreground/10 rounded-xl">
              <BarChart3 className="text-accent shrink-0" size={24} />
              <div>
                <div className="font-semibold text-primary-foreground">Dispatchers</div>
                <div className="text-sm text-primary-foreground/70">Manage loads & assign drivers</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-primary-foreground/10 rounded-xl">
              <Truck className="text-accent shrink-0" size={24} />
              <div>
                <div className="font-semibold text-primary-foreground">Drivers</div>
                <div className="text-sm text-primary-foreground/70">Update status on the go</div>
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
              <CardTitle className="text-2xl">
                {mode === "signin" ? "Sign In" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {mode === "signin"
                  ? "Enter your credentials to access your account"
                  : "Fill in your details to get started"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
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
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
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

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="role">I am a...</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">
                          <div className="flex items-center gap-2">
                            <Package size={16} />
                            Client – Request & track loads
                          </div>
                        </SelectItem>
                        <SelectItem value="dispatcher">
                          <div className="flex items-center gap-2">
                            <BarChart3 size={16} />
                            Dispatcher – Manage all loads
                          </div>
                        </SelectItem>
                        <SelectItem value="driver">
                          <div className="flex items-center gap-2">
                            <Truck size={16} />
                            Driver – Update load status
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === "signin" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      onClick={() => setMode("signup")}
                      className="text-accent font-semibold hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("signin")}
                      className="text-accent font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
