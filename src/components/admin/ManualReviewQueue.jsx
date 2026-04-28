import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, Phone, Globe, Calendar, Clock, Bot, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ManualReviewQueue({ businesses }) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);

  const flaggedBusinesses = businesses
    .filter((b) => b.requires_manual_review)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const updateBusiness = async (businessId, action) => {
    const business = businesses.find((b) => b.id === businessId);
    await base44.functions.invoke("adminUpdateBusiness", {
      businessId,
      updates: { requires_manual_review: false },
      auditAction: action,
      auditTarget: business.owner_email || business.created_by,
      auditBusiness: business.business_name,
      auditReason: notes[businessId] || (action === "account_approved" ? "Account approved" : "Account rejected"),
    });
    if (action === "account_rejected") {
      try {
        await base44.functions.invoke("sendReviewRejectionEmail", {
          email: business.owner_email || business.created_by,
          business_name: business.business_name,
          reason: notes[businessId] || "Account does not meet compliance requirements",
        });
      } catch (e) {
        console.warn("Rejection email failed:", e);
      }
    }
  };

  const approveMutation = useMutation({
    mutationFn: (id) => updateBusiness(id, "account_approved"),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["all-businesses"] });
      setExpandedId(null);
      setNotes(n => { const c = {...n}; delete c[id]; return c; });
      setSelectedIds(s => { const c = new Set(s); c.delete(id); return c; });
      toast.success("Account approved");
    },
    onError: () => toast.error("Failed to approve account"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => updateBusiness(id, "account_rejected"),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["all-businesses"] });
      setExpandedId(null);
      setNotes(n => { const c = {...n}; delete c[id]; return c; });
      setSelectedIds(s => { const c = new Set(s); c.delete(id); return c; });
      toast.success("Account rejected");
    },
    onError: () => toast.error("Failed to reject account"),
  });

  const handleBatchAction = async (action) => {
    if (selectedIds.size === 0) return;
    setBatchProcessing(true);
    try {
      await Promise.all([...selectedIds].map(id => updateBusiness(id, action)));
      queryClient.invalidateQueries({ queryKey: ["all-businesses"] });
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} account(s) ${action === "account_approved" ? "approved" : "rejected"}`);
    } catch (e) {
      toast.error("Some actions failed");
    } finally {
      setBatchProcessing(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === flaggedBusinesses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(flaggedBusinesses.map(b => b.id)));
    }
  };

  if (flaggedBusinesses.length === 0) {
    return (
      <Card className="rounded-2xl border-accent/20 bg-accent/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Compliance Review Queue</CardTitle>
              <CardDescription>No accounts pending manual review</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-orange-900">Compliance Review Queue</CardTitle>
              <CardDescription className="text-orange-700">
                {flaggedBusinesses.length} account(s) require manual review
              </CardDescription>
            </div>
          </div>

          {/* Batch actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-700 font-medium">{selectedIds.size} selected</span>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-lg h-8"
                disabled={batchProcessing}
                onClick={() => handleBatchAction("account_rejected")}
              >
                {batchProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                Reject All
              </Button>
              <Button
                size="sm"
                className="rounded-lg h-8 bg-accent hover:bg-accent/90"
                disabled={batchProcessing}
                onClick={() => handleBatchAction("account_approved")}
              >
                {batchProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                Approve All
              </Button>
            </div>
          )}
        </div>

        {/* Select all */}
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={selectedIds.size === flaggedBusinesses.length && flaggedBusinesses.length > 0}
            onChange={toggleSelectAll}
            className="rounded"
          />
          <span className="text-xs text-orange-700">Select all</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {flaggedBusinesses.map((business) => {
          const isExpanded = expandedId === business.id;
          const isSelected = selectedIds.has(business.id);
          const ownerEmail = business.owner_email || business.created_by;

          return (
            <div
              key={business.id}
              className={`rounded-xl border bg-white transition-all ${isSelected ? "border-orange-400 ring-1 ring-orange-400" : "border-orange-200"}`}
            >
              {/* Collapsed header — always visible */}
              <div className="flex items-center gap-3 p-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(business.id)}
                  className="rounded shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : business.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{business.business_name}</p>
                    <Badge className="bg-orange-100 text-orange-800 text-xs capitalize">
                      {business.industry === "other" ? "Other Industry" : business.industry}
                    </Badge>
                    {business.created_date && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(business.created_date), "MMM d, yyyy h:mm a")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">{ownerEmail}</p>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-lg h-7 px-2"
                    disabled={rejectMutation.isPending}
                    onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(business.id); }}
                  >
                    <XCircle className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-lg h-7 px-2 bg-accent hover:bg-accent/90"
                    disabled={approveMutation.isPending}
                    onClick={(e) => { e.stopPropagation(); approveMutation.mutate(business.id); }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg h-7 px-2"
                    onClick={() => setExpandedId(isExpanded ? null : business.id)}
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-orange-100 p-4 space-y-4">
                  
                  {/* Onboarding info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {business.industry_description && (
                      <div className="col-span-2 sm:col-span-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-xs font-semibold text-orange-800 mb-1">Services Description</p>
                        <p className="text-sm text-orange-900">{business.industry_description}</p>
                      </div>
                    )}
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Phone className="w-3 h-3" /> Business Phone
                      </div>
                      <p className="text-sm font-medium">{business.phone_number || "—"}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Phone className="w-3 h-3" /> Owner Cell
                      </div>
                      <p className="text-sm font-medium">{business.owner_phone_number || "—"}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Globe className="w-3 h-3" /> Website
                      </div>
                      <p className="text-sm font-medium truncate">{business.website || "—"}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Calendar className="w-3 h-3" /> Booking URL
                      </div>
                      <p className="text-sm font-medium truncate">{business.booking_url || "—"}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Clock className="w-3 h-3" /> Business Hours
                      </div>
                      <p className="text-sm font-medium">{business.business_hours || "—"}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Bot className="w-3 h-3" /> AI Personality
                      </div>
                      <p className="text-sm font-medium capitalize">{business.ai_personality || "—"}</p>
                    </div>
                  </div>

                  {/* Review notes + actions */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold block">Review Notes (optional)</label>
                    <textarea
                      value={notes[business.id] || ""}
                      onChange={(e) => setNotes(n => ({ ...n, [business.id]: e.target.value }))}
                      placeholder="Add notes for your records before approving or rejecting..."
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedId(null)}
                        className="rounded-lg h-8"
                      >
                        Collapse
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectMutation.mutate(business.id)}
                        disabled={rejectMutation.isPending}
                        className="rounded-lg h-8"
                      >
                        {rejectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(business.id)}
                        disabled={approveMutation.isPending}
                        className="rounded-lg h-8 bg-accent hover:bg-accent/90"
                      >
                        {approveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
