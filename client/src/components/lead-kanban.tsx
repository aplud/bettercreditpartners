import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

interface Lead {
  id: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  partnerId: string;
  partnerName?: string;
  partnerContactName?: string;
  createdAt: string;
  notes?: string;
  creditScore?: number;
}

interface LeadKanbanProps {
  leads: Lead[];
}

const COLUMNS = [
  { key: "new", label: "NEW REFERRAL", color: "bg-blue-500" },
  { key: "contacted", label: "CONTACTED", color: "bg-amber-500" },
  { key: "converted", label: "ENROLLED", color: "bg-emerald-500" },
  { key: "cancelled", label: "CANCELLED / REFUNDED", color: "bg-orange-500" },
  { key: "lost", label: "COMPLETED", color: "bg-gray-400" },
];

function daysInStage(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
}

function KanbanCard({ lead }: { lead: Lead }) {
  const { toast } = useToast();

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("POST", `/api/admin/leads/${lead.id}/status`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-stats"] });
      toast({ title: "Lead status updated" });
    },
  });

  const days = daysInStage(lead.createdAt);
  const partnerDisplay = lead.partnerContactName || lead.partnerName || "Direct";

  const statusActions: Record<string, Array<{ label: string; status: string; variant?: "default" | "outline" | "destructive" }>> = {
    new: [
      { label: "Mark Contacted", status: "contacted" },
      { label: "Mark Lost", status: "lost", variant: "destructive" },
    ],
    contacted: [
      { label: "Mark Enrolled", status: "converted" },
      { label: "Mark Lost", status: "lost", variant: "destructive" },
    ],
    converted: [
      { label: "Cancel / Refund", status: "cancelled", variant: "destructive" },
      { label: "Mark Completed", status: "lost" },
    ],
    cancelled: [],
    lost: [],
  };

  const actions = statusActions[lead.status] || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Card className="p-3 mb-2 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all bg-white">
          <p className="text-sm font-semibold text-gray-900">{lead.contactName}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">via {partnerDisplay}</p>
          <div className="mt-2">
            <Badge variant="outline" className="text-[10px] gap-1 font-normal">
              <User className="w-3 h-3" />
              Individual
            </Badge>
          </div>
          {lead.notes && (
            <p className="text-[11px] text-gray-500 mt-2 line-clamp-1">{lead.notes}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-medium text-emerald-600">
              {lead.email?.split("@")[0]}
            </span>
            <span className="text-[10px] text-gray-400">{days}d</span>
          </div>
        </Card>
      </PopoverTrigger>
      {actions.length > 0 && (
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 px-2 py-1">{lead.contactName}</p>
            {actions.map((action) => (
              <Button
                key={action.status}
                size="sm"
                variant={action.variant || "outline"}
                className="w-full justify-start text-xs"
                onClick={() => updateStatus.mutate(action.status)}
                disabled={updateStatus.isPending}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}

export function LeadKanban({ leads }: LeadKanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colLeads = leads.filter((l) => l.status === col.key);
        return (
          <div key={col.key} className="bg-gray-50 rounded-xl border border-gray-200 p-3 min-h-[200px]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {col.label}
              </h4>
              <span className="text-[10px] font-medium text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                {colLeads.length}
              </span>
            </div>
            <div>
              {colLeads.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-8">No leads</p>
              ) : (
                colLeads.map((lead) => (
                  <KanbanCard key={lead.id} lead={lead} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
