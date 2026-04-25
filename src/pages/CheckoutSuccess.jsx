import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [destination, setDestination] = useState("/dashboard");

  useEffect(() => {
    base44.entities.BusinessProfile.list().then((profiles) => {
      if (!profiles || profiles.length === 0) setDestination("/onboarding");
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      navigate(destination);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate, destination]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-accent" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome to CatchACaller!</h1>
        <p className="text-muted-foreground mb-6">
          Your subscription is now active. Your 7-day trial starts today.
        </p>
        <div className="bg-primary/10 rounded-lg p-4 mb-6">
          <p className="text-sm font-mono text-primary">
            Redirecting in {countdown} seconds...
          </p>
        </div>
        <Button
          onClick={() => navigate(destination)}
          className="w-full rounded-xl h-11"
        >
          Go to Dashboard Now
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </Card>
    </div>
  );
}