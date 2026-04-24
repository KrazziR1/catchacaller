import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Search, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const preBuiltTemplates = {
  hvac: [
    { name: "Initial Response - HVAC", category: "initial_response", body: "Hi {caller_name}! Sorry we missed your call. {business_name} here — we're here to help with your heating/cooling needs. What can we fix for you today?" },
    { name: "Follow-up - HVAC", category: "follow_up", body: "Hi {caller_name}, just checking in! We'd love to help with your HVAC issue. Reply back or click here to book: {booking_url}" },
    { name: "Emergency Response - HVAC", category: "initial_response", body: "Emergency AC/Heating issue? {business_name} is here to help! We can often get someone out TODAY. Reply URGENT for faster service." },
  ],
  plumbing: [
    { name: "Initial Response - Plumbing", category: "initial_response", body: "Hi {caller_name}! {business_name} here — sorry we missed your call. Got a leak or clog? We can help. Reply with details or book now: {booking_url}" },
    { name: "Follow-up - Plumbing", category: "follow_up", body: "Hi {caller_name}, still need a plumber? {business_name} offers same-day appointments. Click to schedule: {booking_url}" },
  ],
  roofing: [
    { name: "Initial Response - Roofing", category: "initial_response", body: "Hi {caller_name}! {business_name} roofing here — thanks for reaching out! Free roof inspections available. Let's get your roof fixed. Book here: {booking_url}" },
    { name: "Storm Damage - Roofing", category: "initial_response", body: "Hi {caller_name}, storm damage? {business_name} roofing offers emergency repairs & insurance billing assistance. Let's help! Book: {booking_url}" },
  ],
  dental: [
    { name: "Initial Response - Dental", category: "initial_response", body: "Hi {caller_name}! Thanks for calling {business_name} dental. We have openings available. Book your appointment: {booking_url}" },
    { name: "Emergency - Dental", category: "initial_response", body: "Tooth pain? {business_name} has emergency dentistry available. We can often see you same-day. Book now: {booking_url}" },
  ],
  fitness: [
    { name: "Initial Response - Fitness", category: "initial_response", body: "Hi {caller_name}! Ready to get fit? {business_name} has memberships that fit your goals & budget. Join us here: {booking_url}" },
    { name: "Offer - Fitness", category: "initial_response", body: "Hi {caller_name}! First month 50% off at {business_name}. Limited time. Schedule your free trial: {booking_url}" },
  ],
  real_estate: [
    { name: "Initial Response - Real Estate", category: "initial_response", body: "Hi {caller_name}! {business_name} here. Interested in buying, selling, or learning about properties? Let's talk. Book a consultation: {booking_url}" },
    { name: "Follow-up - Real Estate", category: "follow_up", body: "Hi {caller_name}, following up on your inquiry with {business_name}. I found a property that might interest you. Let's chat: {booking_url}" },
  ],
  legal: [
    { name: "Initial Response - Legal", category: "initial_response", body: "Hi {caller_name}. {business_name} law firm here. We offer free consultations. Let's discuss your case. Schedule here: {booking_url}" },
  ],
  general: [
    { name: "Friendly - Initial Response", category: "initial_response", body: "Hi {caller_name}! Thanks for reaching out to {business_name}. We're here to help. What do you need? Reply or book here: {booking_url}" },
    { name: "Professional - Follow-up", category: "follow_up", body: "Hi {caller_name}, this is {business_name}. Following up on your inquiry. We'd like to assist you further. Please let us know your availability." },
    { name: "Qualified Lead - Booking", category: "booking", body: "Hi {caller_name}, we'd love to have you as a customer! Click below to schedule your appointment with {business_name}: {booking_url}" },
  ],
};

export default function TemplateLibrary({ onUseTemplate }) {
  const [industry, setIndustry] = useState("general");
  const [search, setSearch] = useState("");

  const templates = preBuiltTemplates[industry] || [];
  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General / Other</SelectItem>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="roofing">Roofing</SelectItem>
              <SelectItem value="dental">Dental / Healthcare</SelectItem>
              <SelectItem value="fitness">Fitness / Wellness</SelectItem>
              <SelectItem value="real_estate">Real Estate</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No templates found</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border p-5 hover:border-primary/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">{t.name}</h3>
                    <Badge variant="outline" className="text-[10px] mt-0.5">
                      {t.category === "initial_response" ? "Initial" : t.category.charAt(0).toUpperCase() + t.category.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                {t.body}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(t.body);
                    toast.success("Template copied to clipboard");
                  }}
                  size="sm"
                  variant="ghost"
                  className="flex-1 rounded-lg text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  onClick={() => onUseTemplate(t)}
                  size="sm"
                  className="flex-1 rounded-lg text-xs"
                >
                  Use Template
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}