import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteDispatcherDialog } from "@/components/InviteDispatcherDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Trash2,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DispatcherInvite {
  id: string;
  email: string;
  token: string;
  used: boolean;
  used_at: string | null;
  expires_at: string;
  created_at: string;
  invited_by: string;
}

export default function DispatcherInvitesPage() {
  const [invites, setInvites] = useState<DispatcherInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DispatcherInvite | null>(null);
  
  const { userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && userRole !== "dispatcher") {
      navigate("/dashboard");
    }
  }, [userRole, authLoading, navigate]);

  useEffect(() => {
    if (userRole === "dispatcher") {
      fetchInvites();
    }
  }, [userRole]);

  const fetchInvites = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dispatcher_invites")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invites:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invitations",
      });
    } else {
      setInvites((data as DispatcherInvite[]) || []);
    }
    setLoading(false);
  };

  const getInviteStatus = (invite: DispatcherInvite) => {
    if (invite.used) {
      return { label: "Used", variant: "default" as const, icon: CheckCircle };
    }
    if (new Date(invite.expires_at) < new Date()) {
      return { label: "Expired", variant: "destructive" as const, icon: XCircle };
    }
    return { label: "Pending", variant: "secondary" as const, icon: Clock };
  };

  const handleResend = async (invite: DispatcherInvite) => {
    setActionLoading(invite.id);
    
    try {
      // Delete the old invite
      await supabase
        .from("dispatcher_invites")
        .delete()
        .eq("id", invite.id);

      // Send a new invite
      const { data, error } = await supabase.functions.invoke("send-dispatcher-invite", {
        body: { email: invite.email, fullName: invite.email.split("@")[0] },
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || "Failed to resend invitation");
      }

      toast({
        title: "Invitation resent!",
        description: `A new invitation has been sent to ${invite.email}`,
      });

      fetchInvites();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to resend invitation",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async () => {
    if (!deleteConfirm) return;
    
    setActionLoading(deleteConfirm.id);
    
    try {
      const { error } = await supabase
        .from("dispatcher_invites")
        .delete()
        .eq("id", deleteConfirm.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Invitation revoked",
        description: `The invitation for ${deleteConfirm.email} has been revoked`,
      });

      setInvites(invites.filter(i => i.id !== deleteConfirm.id));
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to revoke invitation",
      });
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  };

  const pendingInvites = invites.filter(i => !i.used && new Date(i.expires_at) >= new Date());
  const expiredInvites = invites.filter(i => !i.used && new Date(i.expires_at) < new Date());
  const usedInvites = invites.filter(i => i.used);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dispatcher Invitations</h1>
              <p className="text-muted-foreground">Manage team access invitations</p>
            </div>
          </div>
          <InviteDispatcherDialog
            trigger={
              <Button variant="accent">
                <UserPlus className="mr-2" size={18} />
                Invite Dispatcher
              </Button>
            }
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                  <Clock className="text-status-pending" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingInvites.length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-status-delivered/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-status-delivered" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{usedInvites.length}</p>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-destructive/20 rounded-xl flex items-center justify-center">
                  <XCircle className="text-destructive" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{expiredInvites.length}</p>
                  <p className="text-sm text-muted-foreground">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invitations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail size={20} />
              All Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No invitations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Invite dispatchers to help manage your operations
                </p>
                <InviteDispatcherDialog
                  trigger={
                    <Button variant="accent">
                      <UserPlus className="mr-2" size={16} />
                      Send First Invitation
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires / Used</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => {
                      const status = getInviteStatus(invite);
                      const StatusIcon = status.icon;
                      const isActionLoading = actionLoading === invite.id;
                      
                      return (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">{invite.email}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
                              <StatusIcon size={12} />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(invite.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {invite.used && invite.used_at
                              ? `Accepted ${format(new Date(invite.used_at), "MMM d, yyyy")}`
                              : format(new Date(invite.expires_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!invite.used && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResend(invite)}
                                    disabled={isActionLoading}
                                  >
                                    {isActionLoading ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <RefreshCw size={14} className="mr-1" />
                                        Resend
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setDeleteConfirm(invite)}
                                    disabled={isActionLoading}
                                  >
                                    <Trash2 size={14} className="mr-1" />
                                    Revoke
                                  </Button>
                                </>
                              )}
                              {invite.used && (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Invitation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will revoke the invitation for <strong>{deleteConfirm?.email}</strong>. 
                They will no longer be able to use this link to sign up as a dispatcher.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!actionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevoke}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={!!actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Revoke Invitation"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}