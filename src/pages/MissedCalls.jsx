import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PhoneMissed, Plus, Search, MessageSquare, CalendarCheck, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  new: { label: "New", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  sms_sent: { label: "SMS Sent", className: "bg-primary/10 text-primary border-primary/20" },
  replied: { label: "Replied", className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  booked: { label: "Booked", className: "bg-accent/10 text-accent border-accent/20" },
  lost: { label: "Lost", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function MissedCalls() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newCall, setNewCall] = useState({ caller_phone: "", caller_name: "", call_time: new Date().toISOString() });
  
  const queryClient = useQueryClient();

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ["missed-calls"],
    queryFn: () => base44.entities.MissedCall.list("-call_time", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MissedCall.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missed-calls"] });
      setShowAdd(false);
      setNewCall({ caller_phone: "", caller_name: "", call_time: new Date().toISOString() });
    },
  });

  const filtered = calls.filter(call => {
    const matchesSearch = !search || 
      call.caller_phone?.includes(search) || 
      call.caller_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || call.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Missed Calls</h1>
          <p className="text-muted-foreground mt-1">Track and manage all missed call leads</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add Call
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="sms_sent">SMS Sent</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <PhoneMissed className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-semibold text-muted-foreground">No missed calls found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Add a missed call or adjust your filters</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((call) => {
            const status = statusConfig[call.status] || statusConfig.new;
            return (
              <div key={call.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-primary/20 transition-all flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <PhoneMissed className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{call.caller_name || "Unknown Caller"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{call.caller_phone}</p>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-muted-foreground">
                    {call.call_time ? format(new Date(call.call_time), "MMM d, h:mm a") : "—"}
                  </p>
                  {call.response_time_seconds && (
                    <p className="text-xs text-accent font-mono flex items-center gap-1 justify-end mt-0.5">
                      <Clock className="w-3 h-3" />
                      {call.response_time_seconds}s
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={`${status.className} border text-xs shrink-0`}>
                  {status.label}
                </Badge>
                {call.estimated_value && (
                  <span className="text-sm font-bold text-foreground shrink-0">${call.estimated_value}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Missed Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Phone Number</Label>
              <Input
                placeholder="(555) 123-4567"
                value={newCall.caller_phone}
                onChange={(e) => setNewCall({ ...newCall, caller_phone: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Caller Name (optional)</Label>
              <Input
                placeholder="John Smith"
                value={newCall.caller_name}
                onChange={(e) => setNewCall({ ...newCall, caller_name: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(newCall)} disabled={!newCall.caller_phone}>
              Add Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}