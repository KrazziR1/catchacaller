import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ExportReports({ conversations, missedCalls }) {
  const [exporting, setExporting] = useState(false);

  const exportCSV = (data, filename) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => {
          const val = row[h];
          if (typeof val === "object") return JSON.stringify(val);
          if (typeof val === "string" && val.includes(",")) return `"${val}"`;
          return val;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success(`Exported ${data.length} records`);
  };

  const handleExportCalls = async () => {
    setExporting(true);
    const data = missedCalls.map((c) => ({
      date: new Date(c.call_time).toLocaleDateString(),
      caller: c.caller_phone,
      caller_name: c.caller_name || "—",
      status: c.status,
      source: c.source,
      estimated_value: `$${c.estimated_value || 0}`,
    }));
    exportCSV(data, "missed-calls");
    setExporting(false);
  };

  const handleExportConversations = async () => {
    setExporting(true);
    const data = conversations.map((c) => ({
      phone: c.caller_phone,
      name: c.caller_name || "—",
      status: c.status,
      messages: c.messages?.length || 0,
      last_message: c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : "—",
      booking_link_sent: c.booking_link_sent ? "Yes" : "No",
    }));
    exportCSV(data, "conversations");
    setExporting(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCalls}
        disabled={exporting || missedCalls.length === 0}
        className="rounded-lg"
      >
        {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        Export Calls ({missedCalls.length})
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportConversations}
        disabled={exporting || conversations.length === 0}
        className="rounded-lg"
      >
        {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        Export Conversations ({conversations.length})
      </Button>
    </div>
  );
}