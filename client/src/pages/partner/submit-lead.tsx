import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const leadSchema = z.object({
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
});

type LeadForm = z.infer<typeof leadSchema>;

export default function SubmitLead() {
  const { toast } = useToast();

  const form = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: { contactName: "", email: "", phone: "" },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: LeadForm) => {
      const res = await apiRequest("POST", "/api/partners/leads", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Lead submitted",
        description: "Your lead has been submitted successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/partners/leads"] });
    },
    onError: (error: Error) => {
      if (error.message.includes("409")) {
        toast({
          title: "Duplicate lead",
          description:
            "A lead with this email or phone already exists in the system.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Lead</CardTitle>
          <CardDescription>
            Enter the contact details for your referral. You will earn a
            commission when the lead converts.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                placeholder="Full name"
                {...form.register("contactName")}
              />
              {form.formState.errors.contactName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contactName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitMutation.isPending ? "Submitting..." : "Submit Lead"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
