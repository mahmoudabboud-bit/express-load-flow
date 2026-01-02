import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Truck, Package, MapPin, BarChart3, Shield, Clock, ArrowRight, Phone, Fuel, Map, Users, CheckCircle2 } from "lucide-react";
import heroTruck from "@/assets/hero-truck.jpg";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Background Image */}
      <header className="relative min-h-[90vh] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroTruck} 
            alt="Road Runner Express truck on highway at sunset"
            className="w-full h-full object-cover"
          />
          {/* Strong left-side overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(213,100%,5%)] from-0% via-[hsl(213,100%,5%)/95%] via-30% to-[hsl(213,100%,5%)/40%] to-100%" />
          {/* Bottom fade for smooth transition */}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(213,100%,5%)] via-transparent to-[hsl(213,100%,5%)/30%]" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between">
          <Logo variant="light" size="md" />
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button className="bg-white/20 backdrop-blur-sm text-white font-semibold hover:bg-white/30 border border-white/30">
                Sign In
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm" className="bg-accent text-primary font-bold hover:bg-accent/90 shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="max-w-2xl animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/80 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-8 shadow-lg">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Established 2005 • 20+ Years of Experience
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              You Call It,
              <span className="block text-accent mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">Will Haul It</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white mb-10 max-w-xl leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              Professional trucking and hauling services specializing in oil & gas equipment. 
              24/7 dispatch serving Texas and the entire lower 48 states.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl" className="w-full sm:w-auto shadow-accent group">
                  Get Free Estimate
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="xl" className="w-full sm:w-auto bg-white text-primary font-semibold hover:bg-white/90 border-0">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>

            {/* Quick Features */}
            <div className="flex flex-wrap gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-accent" size={18} />
                <span>24/7 Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-accent" size={18} />
                <span>Lower 48 States</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-accent" size={18} />
                <span>GPS Tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">2005</div>
              <div className="text-sm text-primary-foreground/70 uppercase tracking-wide">Established</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">20+</div>
              <div className="text-sm text-primary-foreground/70 uppercase tracking-wide">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">24/7</div>
              <div className="text-sm text-primary-foreground/70 uppercase tracking-wide">Dispatch Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">48</div>
              <div className="text-sm text-primary-foreground/70 uppercase tracking-wide">States Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">Our Services</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Professional Trucking & Hauling
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experienced and reliable transportation solutions for all your hauling needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Oil & Gas */}
            <div className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-accent/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-[hsl(25,100%,60%)] rounded-2xl flex items-center justify-center mb-6 shadow-accent group-hover:scale-110 transition-transform">
                <Fuel className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Oil & Gas Equipment</h3>
              <p className="text-muted-foreground mb-6">
                Specialized transportation for oil and gas industry equipment. 
                Safe and reliable hauling for drilling rigs, pipelines, and heavy machinery.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-accent shrink-0" size={18} />
                  Heavy equipment transport
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-accent shrink-0" size={18} />
                  Pipeline & rig hauling
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-accent shrink-0" size={18} />
                  Oversized load expertise
                </li>
              </ul>
            </div>

            {/* Trucking Services */}
            <div className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-accent/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-[hsl(25,100%,60%)] rounded-2xl flex items-center justify-center mb-6 shadow-accent group-hover:scale-110 transition-transform">
                <Truck className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Trucking Services</h3>
              <p className="text-muted-foreground mb-6">
                Full-service trucking for commercial and industrial needs. 
                From local deliveries to long-haul transportation across the lower 48.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-accent shrink-0" size={18} />
                  Flatbed & step deck trailers
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-accent shrink-0" size={18} />
                  Local & long-haul delivery
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-accent shrink-0" size={18} />
                  Real-time tracking
                </li>
              </ul>
            </div>

            {/* Experienced Team */}
            <div className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-accent/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-[hsl(25,100%,60%)] rounded-2xl flex items-center justify-center mb-6 shadow-accent group-hover:scale-110 transition-transform">
                <Users className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Experienced Team</h3>
              <p className="text-muted-foreground mb-6">
                Professional drivers and dispatchers with decades of combined experience. 
                Safety-focused operations with excellent track record.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-accent shrink-0" size={18} />
                  Licensed & insured drivers
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-accent shrink-0" size={18} />
                  Safety-first culture
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-accent shrink-0" size={18} />
                  24/7 customer support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Logistics Platform Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">Digital Platform</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Manage Shipments Online
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our easy-to-use logistics platform for clients, dispatchers, and drivers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Client Features */}
            <div className="bg-card rounded-2xl p-8 border border-border/50">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
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
            <div className="bg-card rounded-2xl p-8 border border-border/50">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
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
            <div className="bg-card rounded-2xl p-8 border border-border/50">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
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
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-accent font-semibold text-sm uppercase tracking-wider">Coverage Area</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-3 mb-6">
                Serving the Lower 48 States
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Based in Houston, Texas, Road Runner Express provides reliable trucking and 
                hauling services throughout the continental United States. Our primary service 
                areas include Texas, New Mexico, Oklahoma, and Louisiana, with nationwide 
                delivery capabilities.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Map className="text-accent" size={20} />
                  <span className="font-medium text-foreground">Texas</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Map className="text-accent" size={20} />
                  <span className="font-medium text-foreground">New Mexico</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Map className="text-accent" size={20} />
                  <span className="font-medium text-foreground">Oklahoma</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Map className="text-accent" size={20} />
                  <span className="font-medium text-foreground">Louisiana</span>
                </div>
              </div>
              <Link to="/auth?mode=signup">
                <Button variant="accent" size="lg" className="group">
                  Request a Quote
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-5 p-6 bg-card rounded-2xl border border-border/50 hover:border-accent/30 transition-colors">
                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="text-primary-foreground" size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Safety First</h4>
                  <p className="text-muted-foreground">
                    Excellent safety ratings and compliance with all DOT regulations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5 p-6 bg-card rounded-2xl border border-border/50 hover:border-accent/30 transition-colors">
                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="text-primary-foreground" size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">24/7 Dispatch</h4>
                  <p className="text-muted-foreground">
                    Round-the-clock dispatch available for urgent transportation needs
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5 p-6 bg-card rounded-2xl border border-border/50 hover:border-accent/30 transition-colors">
                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="text-primary-foreground" size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">GPS Tracking</h4>
                  <p className="text-muted-foreground">
                    Real-time tracking for all shipments with live location updates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Need a Free Estimate?
          </h2>
          <p className="text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
            Contact Road Runner Express today for reliable trucking and hauling services. 
            24/7 dispatch available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl" className="shadow-accent group">
                Get Started Now
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="tel:+1234567890">
              <Button variant="outline" size="xl" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50">
                <Phone className="mr-2" size={20} />
                Call 24/7 Dispatch
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Logo size="md" className="mb-6" />
              <p className="text-muted-foreground mb-4 max-w-sm">
                PANOCEAN INC. DBA Road Runner Express. Professional trucking and hauling 
                services since 2005.
              </p>
              <p className="text-accent font-semibold">
                "You Call It, Will Haul It"
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Location</h4>
              <p className="text-muted-foreground">
                Houston, TX<br />
                United States
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Departments</h4>
              <ul className="text-muted-foreground space-y-2">
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
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}