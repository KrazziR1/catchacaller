import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";
import { Users, Search, Phone, Mail, Building2 } from "lucide-react";

const industryLabels = {
  hvac: "HVAC", plumbing: "Plumbing", roofing: "Roofing",
  med_spa: "Med Spa", legal: "Legal", other: "Other",
};

const callVolumeLabels = {
  under_50: "< 50/mo", "50_200": "50–200/mo",
  "200_500": "200–500/mo", "500_plus": "500+/mo",
};

const industryColors = {
  hvac: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  plumbing: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  roofing: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  med_spa: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  legal: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  other: "bg-muted text-muted-foreground border-border",
};

export default function WaitlistAdmin() {
  const [search, setSearch] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["waitlist"],
    queryFn: () => base44.entities.WaitlistEntry.list("-created_date", 100),
  });

  const filtered = entries.filter((e) =>
    [e.email, e.business_name, e.phone].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Waitlist</h1>
          <p className="text-muted-foreground text-sm mt-1">{entries.length} signups total</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No signups yet</p>
          <p className="text-sm mt-1">Share your landing page to start collecting leads</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-3 font-medium">Business</th>
                  <th className="text-left px-6 py-3 font-medium">Contact</th>
                  <th className="text-left px-6 py-3 font-medium">Industry</th>
                  <th className="text-left px-6 py-3 font-medium">Call Volume</th>
                  <th className="text-left px-6 py-3 font-medium">Signed Up</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-sm">{entry.business_name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <a href={`mailto:${entry.email}`} className="hover:text-primary transition-colors">{entry.email}</a>
                        </div>
                        {entry.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <Phone className="w-3 h-3 shrink-0" />
                            {entry.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`text-xs border ${industryColors[entry.industry] || industryColors.other}`}>
                        {industryLabels[entry.industry] || entry.industry || "—"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {callVolumeLabels[entry.monthly_calls] || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {entry.created_date ? format(new Date(entry.created_date), "MMM d, yyyy") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}