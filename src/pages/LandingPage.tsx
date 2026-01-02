import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Truck, Package, MapPin, BarChart3, Shield, Clock, ArrowRight, Phone, Fuel, Map, Users } from "lucide-react";

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
            <p className="text-accent font-semibold text-lg mb-4 tracking-wide">
              ESTABLISHED 2005 • 20+ YEARS OF EXPERIENCE
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-balance">
              You Call It,
              <span className="text-accent"> Will Haul It</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl">
              Professional trucking and hauling services specializing in oil & gas equipment transportation. 
              Serving Texas, New Mexico, Oklahoma, Louisiana and the entire lower 48 states with 24/7 dispatch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Get Free Estimate
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

      {/* Stats Section */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">Since 2005</div>
              <div className="text-sm text-muted-foreground">Established</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">20+</div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Dispatch Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">Lower 48</div>
              <div className="text-sm text-muted-foreground">States Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Professional Trucking & Hauling Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experienced and reliable transportation solutions for all your hauling needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Oil & Gas */}
            <div className="card-elevated p-8 group">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Fuel className="text-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Oil & Gas Equipment</h3>
              <p className="text-muted-foreground mb-4">
                Specialized transportation for oil and gas industry equipment. 
                Safe and reliable hauling for drilling rigs, pipelines, and heavy machinery.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Heavy equipment transport
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Pipeline & rig hauling
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Oversized load expertise
                </li>
              </ul>
            </div>

            {/* Trucking Services */}
            <div className="card-elevated p-8 group">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Truck className="text-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Trucking Services</h3>
              <p className="text-muted-foreground mb-4">
                Full-service trucking for commercial and industrial needs. 
                From local deliveries to long-haul transportation across the lower 48.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Flatbed & step deck trailers
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Local & long-haul delivery
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Real-time tracking
                </li>
              </ul>
            </div>

            {/* Experienced Team */}
            <div className="card-elevated p-8 group">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Users className="text-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Experienced Team</h3>
              <p className="text-muted-foreground mb-4">
                Professional drivers and dispatchers with decades of combined experience. 
                Safety-focused operations with excellent track record.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Licensed & insured drivers
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Safety-first culture
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  24/7 customer support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Logistics Platform Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Digital Logistics Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage your shipments online with our easy-to-use platform
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

      {/* Coverage Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Serving the Lower 48 States
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Based in Houston, Texas, Road Runner Express provides reliable trucking and 
                hauling services throughout the continental United States. Our primary service 
                areas include Texas, New Mexico, Oklahoma, and Louisiana, with nationwide 
                delivery capabilities.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Map className="text-accent" size={20} />
                  <span className="text-foreground">Texas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Map className="text-accent" size={20} />
                  <span className="text-foreground">New Mexico</span>
                </div>
                <div className="flex items-center gap-2">
                  <Map className="text-accent" size={20} />
                  <span className="text-foreground">Oklahoma</span>
                </div>
                <div className="flex items-center gap-2">
                  <Map className="text-accent" size={20} />
                  <span className="text-foreground">Louisiana</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-4 p-6 bg-secondary/50 rounded-xl">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="text-primary-foreground" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Safety First</h4>
                  <p className="text-sm text-muted-foreground">
                    Excellent safety ratings and compliance with all DOT regulations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-secondary/50 rounded-xl">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="text-primary-foreground" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">24/7 Dispatch</h4>
                  <p className="text-sm text-muted-foreground">
                    Round-the-clock dispatch available for urgent transportation needs
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-secondary/50 rounded-xl">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="text-primary-foreground" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">GPS Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Real-time tracking for all shipments with live location updates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Need a Free Estimate?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Contact Road Runner Express today for reliable trucking and hauling services. 
            24/7 dispatch available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl">
                Get Started Now
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <a href="tel:+1234567890">
              <Button variant="outline-light" size="xl">
                <Phone className="mr-2" size={20} />
                Call 24/7 Dispatch
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <Logo size="md" className="mb-4" />
              <p className="text-sm text-muted-foreground">
                PANOCEAN INC. DBA Road Runner Express<br />
                Established 2005
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Location</h4>
              <p className="text-sm text-muted-foreground">
                Houston, TX<br />
                United States
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Departments</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Dispatch - 24/7 Available</li>
                <li>Safety Department</li>
                <li>Billing Department</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Road Runner Express. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              You Call It, Will Haul It
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}