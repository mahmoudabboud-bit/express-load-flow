import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Truck, Package, MapPin, BarChart3, Shield, Clock, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="gradient-hero text-primary-foreground">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo variant="light" size="md" />
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="outline-light" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-balance">
              Logistics Management
              <span className="text-accent"> Made Simple</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl">
              Streamline your freight operations with real-time tracking, intelligent dispatching, 
              and seamless communication between clients, dispatchers, and drivers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline-light" size="xl" className="w-full sm:w-auto">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Move Freight
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools for every role in your logistics operation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Client Features */}
            <div className="card-elevated p-8 group">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Package className="text-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">For Clients</h3>
              <p className="text-muted-foreground mb-4">
                Request loads with ease and track your shipments in real-time. 
                Get instant updates on pickup and delivery status.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Easy load request forms
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Real-time shipment tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Email notifications
                </li>
              </ul>
            </div>

            {/* Dispatcher Features */}
            <div className="card-elevated p-8 group">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <BarChart3 className="text-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">For Dispatchers</h3>
              <p className="text-muted-foreground mb-4">
                Manage all loads from a powerful dashboard. Assign drivers, 
                approve requests, and access detailed analytics.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Master load queue
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Driver assignment workflow
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  KPI insights & reporting
                </li>
              </ul>
            </div>

            {/* Driver Features */}
            <div className="card-elevated p-8 group">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Truck className="text-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">For Drivers</h3>
              <p className="text-muted-foreground mb-4">
                Mobile-optimized interface for on-the-go updates. 
                One-tap status changes and easy navigation integration.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Mobile-first design
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Google Maps integration
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  BOL photo upload
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime Guaranteed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Loads Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Active Carriers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <Shield className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Secure & Compliant</h4>
                <p className="text-sm text-muted-foreground">
                  Industry-standard security with role-based access control
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <Clock className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Real-Time Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Instant notifications for every status change
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">GPS Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Seamless navigation to pickup and delivery locations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Optimize Your Logistics?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join Road Runner Express today and experience seamless freight management.
          </p>
          <Link to="/auth?mode=signup">
            <Button variant="hero" size="xl">
              Get Started Now
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2024 Road Runner Express. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
