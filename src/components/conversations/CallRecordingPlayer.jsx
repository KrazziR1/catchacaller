import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CallRecordingPlayer({ conversationId }) {
  const [playing, setPlaying] = useState(false);

  const { data: recordings = [] } = useQuery({
    queryKey: ["recordings", conversationId],
    queryFn: () =>
      base44.entities.CallRecording.filter(
        { conversation_id: conversationId },
        "-call_date"
      ),
    enabled: !!conversationId,
  });

  if (recordings.length === 0) return null;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <PhoneCall className="w-4 h-4" />
          Call Recordings ({recordings.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recordings.map((rec) => (
          <div key={rec.id} className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">
                  {new Date(rec.call_date).toLocaleString()}
                </p>
                <Badge variant="outline" className="text-xs mt-1">
                  {rec.duration_seconds}s
                </Badge>
              </div>
              {rec.recording_url && (
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setPlaying(!playing)}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <a
                    href={rec.recording_url}
                    download
                    className="flex items-center gap-1"
                  >
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              )}
            </div>
            {playing && rec.recording_url && (
              <audio controls className="w-full mt-2">
                <source src={rec.recording_url} type="audio/wav" />
              </audio>
            )}
            {rec.transcription && (
              <div className="mt-2 p-2 bg-background rounded text-xs">
                <p className="text-muted-foreground font-semibold mb-1">Transcript</p>
                <p>{rec.transcription}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}