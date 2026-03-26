import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Trash2, Shield } from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  role: string;
}

export default function AdminAccounts() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { data: admins, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/admins"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/admin/admins", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      setAddOpen(false);
      setNewUsername("");
      setNewPassword("");
      toast({ title: "Admin account created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/admins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      setDeleteTarget(null);
      toast({ title: "Admin account deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Accounts</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Admin
        </Button>
      </div>

      {currentUser && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-sm">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Your login username</p>
                <p className="font-mono font-semibold text-lg">{currentUser.username}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Administrators</CardTitle>
          <CardDescription>
            Manage who has admin access to the BCP portal. Only admins can create or remove other admins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !admins || admins.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No admin accounts found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {admin.username}
                        {admin.id === currentUser?.id && (
                          <span className="text-xs text-muted-foreground">(you)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">{admin.role}</TableCell>
                    <TableCell>
                      {admin.id !== currentUser?.id ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 h-7"
                          onClick={() => setDeleteTarget(admin)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Admin Account</DialogTitle>
            <DialogDescription>
              Create a new administrator who can manage the entire BCP portal.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate({ username: newUsername, password: newPassword });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                minLength={3}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Admin"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete admin account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.username}</strong>'s admin access.
              They will no longer be able to log in to the admin portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
