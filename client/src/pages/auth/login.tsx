import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import bcpLogo from "@assets/BCP-ISOLOGO_1768516740168.png";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/partner");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message.includes("401")
          ? "Invalid username or password"
          : error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#060414]">
      <div className="w-full max-w-md mx-4">
        <div className="flex flex-col items-center mb-8">
          <img src={bcpLogo} alt="Better Credit Partners" className="h-16 w-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Partner Portal</h1>
          <p className="text-white/70 text-sm mt-1">Sign in to manage your referrals and commissions</p>
        </div>

        <form
          onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white/80">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              className="bg-white/10 border-white/10 text-white placeholder:text-white/60 focus:border-[#52ceff]/50"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-sm text-red-400">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="bg-white/10 border-white/10 text-white placeholder:text-white/60 focus:border-[#52ceff]/50 pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-red-400">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#c0d353] to-[#52ceff] text-[#060414] font-bold border-0 hover:opacity-90"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-sm text-white/60 text-center">
            Want to become a partner?{" "}
            <Link
              href="/register"
              className="text-[#52ceff] hover:underline"
            >
              Register here
            </Link>
          </p>
          <p className="text-sm text-white/60 text-center">
            <Link href="/" className="hover:text-white/70 transition-colors">
              &larr; Back to website
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
