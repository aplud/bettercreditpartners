import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const profileSchema = z.object({
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  companyName: z.string().min(1, "Company name is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDetails: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface Partner {
  id: string;
  contactName: string;
  email: string;
  phone: string;
  companyName: string;
  paymentMethod: string;
  paymentDetails: string;
  referralCode: string;
  status: string;
}

interface Program {
  name: string;
}

interface PartnerMeResponse {
  partner: Partner;
  program: Program;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: meData, isLoading } = useQuery<PartnerMeResponse>({
    queryKey: ["/api/partners/me"],
  });
  const profile = meData?.partner;
  const program = meData?.program;

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      contactName: "",
      email: "",
      phone: "",
      companyName: "",
      paymentMethod: "",
      paymentDetails: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        contactName: profile.contactName,
        email: profile.email,
        phone: profile.phone,
        companyName: profile.companyName,
        paymentMethod: profile.paymentMethod,
        paymentDetails: profile.paymentDetails ?? "",
      });
    }
  }, [profile, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest("PATCH", "/api/partners/me", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/partners/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [pwCurrentPassword, setPwCurrentPassword] = useState("");
  const [pwNewPassword, setPwNewPassword] = useState("");
  const [pwConfirmPassword, setPwConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/partners/change-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed", description: "Your password has been updated." });
      setPwCurrentPassword("");
      setPwNewPassword("");
      setPwConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-lg">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Profile</h1>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Program Info</CardTitle>
            <CardDescription>Your referral program details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Program</span>
              <span className="font-medium">{program?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Referral Code</span>
              <span className="font-mono font-medium">
                {profile.referralCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{profile.status}</span>
            </div>
            {user && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Login Username</span>
                <span className="font-mono font-medium">{user.username}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your contact and payment information
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input id="contactName" {...form.register("contactName")} />
              {form.formState.errors.contactName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contactName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...form.register("phone")} />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" {...form.register("companyName")} />
              {form.formState.errors.companyName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.companyName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={form.watch("paymentMethod")}
                onValueChange={(value) => form.setValue("paymentMethod", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ach">ACH (Direct Deposit)</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.paymentMethod && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.paymentMethod.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDetails">Payment Details</Label>
              <Input
                id="paymentDetails"
                placeholder="e.g. PayPal email or mailing address"
                {...form.register("paymentDetails")}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pwNewPassword !== pwConfirmPassword) {
              toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
              return;
            }
            if (pwNewPassword.length < 6) {
              toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
              return;
            }
            passwordMutation.mutate({ currentPassword: pwCurrentPassword, newPassword: pwNewPassword });
          }}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={pwCurrentPassword}
                  onChange={(e) => setPwCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={pwNewPassword}
                  onChange={(e) => setPwNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={pwConfirmPassword}
                  onChange={(e) => setPwConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              variant="outline"
              disabled={passwordMutation.isPending}
            >
              {passwordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {passwordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
