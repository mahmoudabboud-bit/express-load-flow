import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, Loader2, Download, Package, Weight, Truck, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Load {
  id: string;
  status: "Pending" | "Assigned" | "In-Transit" | "Delivered";
  weight_lbs: number;
  created_at: string;
  trailer_type: string;
  price_cents: number | null;
}

export default function InsightsPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userRole === "dispatcher") {
      fetchLoads();
    }
  }, [user, userRole]);

  const fetchLoads = async () => {
    const { data, error } = await supabase
      .from("loads")
      .select("id, status, weight_lbs, created_at, trailer_type")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching loads:", error);
    } else {
      setLoads((data as Load[]) || []);
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== "dispatcher") {
    return <Navigate to="/dashboard" replace />;
  }

  // Calculate KPIs
  const totalLoads = loads.length;
  const deliveredLoads = loads.filter(l => l.status === "Delivered").length;
  const activeTonnage = loads
    .filter(l => l.status === "In-Transit" || l.status === "Assigned")
    .reduce((acc, l) => acc + (l.weight_lbs || 0), 0);
  const totalTonnage = loads.reduce((acc, l) => acc + (l.weight_lbs || 0), 0);

  // Weekly load volume (last 8 weeks)
  const getWeeklyData = () => {
    const weeks: { [key: string]: number } = {};
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekKey = `Week ${8 - i}`;
      weeks[weekKey] = 0;
    }

    loads.forEach(load => {
      const loadDate = new Date(load.created_at);
      const weeksDiff = Math.floor((now.getTime() - loadDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weeksDiff >= 0 && weeksDiff < 8) {
        const weekKey = `Week ${8 - weeksDiff}`;
        weeks[weekKey] = (weeks[weekKey] || 0) + 1;
      }
    });

    return Object.entries(weeks).map(([name, loads]) => ({ name, loads }));
  };

  // Status distribution
  const statusData = [
    { name: "Pending", value: loads.filter(l => l.status === "Pending").length, color: "hsl(45, 93%, 47%)" },
    { name: "Assigned", value: loads.filter(l => l.status === "Assigned").length, color: "hsl(213, 80%, 50%)" },
    { name: "In-Transit", value: loads.filter(l => l.status === "In-Transit").length, color: "hsl(213, 80%, 50%)" },
    { name: "Delivered", value: loads.filter(l => l.status === "Delivered").length, color: "hsl(142, 70%, 45%)" },
  ].filter(d => d.value > 0);

  // Trailer type distribution
  const trailerData = () => {
    const types: { [key: string]: number } = {};
    loads.forEach(load => {
      types[load.trailer_type] = (types[load.trailer_type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  };

  const exportToCSV = () => {
    const headers = ["ID", "Status", "Weight (lbs)", "Trailer Type", "Created At"];
    const rows = loads.map(l => [
      l.id,
      l.status,
      l.weight_lbs,
      l.trailer_type,
      new Date(l.created_at).toISOString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loads-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${loads.length} loads to CSV.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Insights & Reports</h1>
            <p className="text-muted-foreground">Analytics and performance metrics.</p>
          </div>
          <Button variant="accent" onClick={exportToCSV}>
            <Download className="mr-2" size={18} />
            Export to CSV
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="card-elevated">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                      <Package className="text-accent" size={24} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{totalLoads}</p>
                      <p className="text-sm text-muted-foreground">Total Loads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-status-delivered/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-status-delivered" size={24} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{deliveredLoads}</p>
                      <p className="text-sm text-muted-foreground">Loads Delivered</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-status-in-transit/20 rounded-xl flex items-center justify-center">
                      <Truck className="text-status-in-transit" size={24} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {(activeTonnage / 1000).toFixed(1)}k
                      </p>
                      <p className="text-sm text-muted-foreground">Active lbs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                      <Weight className="text-primary" size={24} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {(totalTonnage / 1000).toFixed(1)}k
                      </p>
                      <p className="text-sm text-muted-foreground">Total lbs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Weekly Volume Chart */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Load Volume by Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getWeeklyData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar 
                          dataKey="loads" 
                          fill="hsl(25, 100%, 50%)" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Load Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {statusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={4}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trailer Type Distribution */}
              <Card className="card-elevated lg:col-span-2">
                <CardHeader>
                  <CardTitle>Loads by Trailer Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trailerData()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          type="number"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category"
                          width={100}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="hsl(213, 100%, 14%)" 
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
