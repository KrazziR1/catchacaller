import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function SMSSegmentCounter({ message }) {
  const [segments, setSegments] = useState(1);

  useEffect(() => {
    const calculateSegments = async () => {
      if (!message) {
        setSegments(1);
        return;
      }

      try {
        const result = await base44.functions.invoke("calculateSMSSegments", {
          message
        });
        setSegments(result.data.segments);
      } catch (e) {
        // Fallback calculation
        const segments = Math.ceil(message.length / 153) || 1;
        setSegments(segments);
      }
    };

    calculateSegments();
  }, [message]);

  return (
    <div className="flex gap-4 text-xs text-muted-foreground">
      <span>{message?.length || 0} characters</span>
      <span>{segments} SMS segment{segments > 1 ? 's' : ''}</span>
      <span className="font-semibold text-foreground">${(segments * 0.01).toFixed(2)}</span>
    </div>
  );
}