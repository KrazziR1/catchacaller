import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { PhoneCall, Clock, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";

export default function AccountUnderReview({ user, auditLog }) {
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const hasAlreadyRequested = auditLog?.user_requested_review;

  const handleRequestReview = async () => {
    setLoading(true);
    try {
      await base44.asServiceRole.entities.AdminAuditLog.update(auditLog.id, {
        user_requested_review: true,
        user_review_message: message.trim() || null,
        review_status: "pending",
      });
      setSubmitted(true);
    } catch (e) {
      console.error("Failed to submit review request:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <PhoneCall className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">CatchACaller</span>
      </div>

      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Your account requires review</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your account is currently under an administrative review. This is sometimes required for compliance or verification purposes. We'll reach out to <span className="font-medium text-foreground">{user?.email}</span> once the review is complete.
        </p>

        {submitted || hasAlreadyRequested ? (
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3 text-left">
            <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
            <div>
              <p className="text-sm font-semibold text-accent">Review request submitted</p>
              <p className="text-xs text-muted-foreground mt-0.5">Our team has been notified and will follow up via email.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-left">
            <p className="text-sm font-medium">Want to request a review or ask a question?</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional: describe your situation or ask a question..."
              className="w-full h-24 px-3 py-2 text-sm rounded-xl border border-input bg-background resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button
              onClick={handleRequestReview}
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><MessageSquare className="w-4 h-4 mr-2" /> Submit Review Request</>
              )}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-6">
          Need immediate help? Email us at{" "}
          <a href="mailto:support@catchacaller.com" className="text-primary underline">
            support@catchacaller.com
          </a>
        </p>
      </div>
    </div>
  );
}