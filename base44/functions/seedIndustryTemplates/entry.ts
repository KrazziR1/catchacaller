import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const industryTemplates = [
  // HVAC
  {
    name: "HVAC Initial Response",
    category: "initial_response",
    industry: "hvac",
    message_body: "Hi! Thanks for calling {business_name}. We missed your call but are ready to help. What's your heating or cooling issue?",
  },
  {
    name: "HVAC Follow-up",
    category: "follow_up",
    industry: "hvac",
    message_body: "Hi {caller_name}, following up on your HVAC issue. We'd love to schedule a service appointment. Here's our availability: {booking_url}",
  },
  // Plumbing
  {
    name: "Plumbing Initial Response",
    category: "initial_response",
    industry: "plumbing",
    message_body: "Hi! Thanks for calling {business_name}. We missed your call but we're here to help. What plumbing issue can we fix for you?",
  },
  {
    name: "Plumbing Follow-up",
    category: "follow_up",
    industry: "plumbing",
    message_body: "Hi {caller_name}, we're ready to help with your plumbing. Book an appointment here: {booking_url}",
  },
  // Roofing
  {
    name: "Roofing Initial Response",
    category: "initial_response",
    industry: "roofing",
    message_body: "Thanks for calling {business_name}! We missed your call. Need a roof inspection or repair? Let's get you taken care of.",
  },
  {
    name: "Roofing Follow-up",
    category: "follow_up",
    industry: "roofing",
    message_body: "Hi {caller_name}, schedule your free roof inspection: {booking_url}",
  },
  // Dental
  {
    name: "Dental Initial Response",
    category: "initial_response",
    industry: "dental",
    message_body: "Hi! Thank you for calling {business_name}. We missed your call. We'd love to help with your dental needs. What brings you in?",
  },
  {
    name: "Dental Follow-up",
    category: "follow_up",
    industry: "dental",
    message_body: "Hi {caller_name}, book your appointment now: {booking_url}",
  },
  // Medical Spa
  {
    name: "Med Spa Initial Response",
    category: "initial_response",
    industry: "med_spa",
    message_body: "Hi {caller_name}! Thanks for calling {business_name}. We're excited to help you look and feel your best.",
  },
  {
    name: "Med Spa Follow-up",
    category: "follow_up",
    industry: "med_spa",
    message_body: "Schedule your consultation: {booking_url}",
  },
  // Legal
  {
    name: "Legal Initial Response",
    category: "initial_response",
    industry: "legal",
    message_body: "Thank you for contacting {business_name}. We missed your call but are ready to assist with your legal matter.",
  },
  {
    name: "Legal Follow-up",
    category: "follow_up",
    industry: "legal",
    message_body: "Book a consultation: {booking_url}",
  },
  // Real Estate
  {
    name: "Real Estate Initial Response",
    category: "initial_response",
    industry: "real_estate",
    message_body: "Hi! Thanks for calling {business_name}. We missed your call but we have the perfect property for you.",
  },
  {
    name: "Real Estate Follow-up",
    category: "follow_up",
    industry: "real_estate",
    message_body: "Schedule a showing: {booking_url}",
  },
  // Automotive
  {
    name: "Automotive Initial Response",
    category: "initial_response",
    industry: "automotive",
    message_body: "Hi! Thanks for calling {business_name}. We missed your call. What can we help you with today?",
  },
  {
    name: "Automotive Follow-up",
    category: "follow_up",
    industry: "automotive",
    message_body: "Book your service appointment: {booking_url}",
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if templates already exist
    const existing = await base44.asServiceRole.entities.SMSTemplate.list("-created_date", 1000);
    if (existing.length > 0) {
      return Response.json({ message: 'Templates already seeded', count: existing.length });
    }

    // Bulk create templates
    const created = await base44.asServiceRole.entities.SMSTemplate.bulkCreate(industryTemplates);

    return Response.json({ success: true, created: created.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});