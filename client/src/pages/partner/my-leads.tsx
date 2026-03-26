import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatDate } from "@/lib/format";

interface Lead {
  id: string;
  contactName: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

export default function MyLeads() {
  const { data: leads, isLoading, isError, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/partners/leads"],
  });

  if (isError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-400 mb-4">Failed to load data. Please try again.</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Leads</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm mb-4">
                No leads yet. Submit your first lead to get started.
              </p>
              <Link href="/partner/submit-lead">
                <Button>Submit Your First Lead</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.contactName}
                      </TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.source ?? "manual"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[lead.status] ?? ""}
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
