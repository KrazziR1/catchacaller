import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Check, Phone, MessageSquare, TrendingUp, Zap, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ColdCallingScripts from "@/components/sales/ColdCallingScripts";
import ValuePropositions from "@/components/sales/ValuePropositions";
import TwilioExplainer from "@/components/sales/TwilioExplainer";
import FollowUpTemplates from "@/components/sales/FollowUpTemplates";

export default function SalesResources() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        setUser(u);
        if (!u || u.role !== "admin") {
          navigate("/dashboard");
        }
      })
      .catch(() => navigate("/dashboard"))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return null;
  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Sales Resources</h1>
            <p className="text-muted-foreground mt-1">Cold calling scripts, value props, and templates</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="cold-calling" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="cold-calling" className="gap-2">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Cold Calling</span>
            </TabsTrigger>
            <TabsTrigger value="value-props" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Value Props</span>
            </TabsTrigger>
            <TabsTrigger value="twilio" className="gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Twilio 101</span>
            </TabsTrigger>
            <TabsTrigger value="follow-up" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Follow-Up</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cold-calling">
            <ColdCallingScripts />
          </TabsContent>

          <TabsContent value="value-props">
            <ValuePropositions />
          </TabsContent>

          <TabsContent value="twilio">
            <TwilioExplainer />
          </TabsContent>

          <TabsContent value="follow-up">
            <FollowUpTemplates />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}