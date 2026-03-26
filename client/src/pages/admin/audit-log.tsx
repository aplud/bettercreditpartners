import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditEntry {
  id: string;
  userId: string | null;
  username: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  createdAt: string;
}

export default function AuditLog() {
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const queryParams = new URLSearchParams();
  if (entityTypeFilter && entityTypeFilter !== "all") queryParams.set("entityType", entityTypeFilter);
  if (actionFilter && actionFilter !== "all") queryParams.set("action", actionFilter);
  const qs = queryParams.toString();

  const { data: entries, isLoading } = useQuery<AuditEntry[]>({
    queryKey: [`/api/admin/audit-log${qs ? `?${qs}` : ""}`],
  });

  const entityTypes = entries
    ? Array.from(new Set(entries.map((e) => e.entityType))).sort()
    : [];
  const actions = entries
    ? Array.from(new Set(entries.map((e) => e.action))).sort()
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Log</h1>

      <div className="flex gap-4">
        <div className="w-48">
          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Entity Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entity Types</SelectItem>
              {entityTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !entries || entries.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No audit log entries found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{entry.username ?? entry.userId ?? "system"}</TableCell>
                      <TableCell className="font-medium">{entry.action}</TableCell>
                      <TableCell>{entry.entityType}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.entityId}</TableCell>
                      <TableCell className="max-w-xs truncate">{entry.details ?? "-"}</TableCell>
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
