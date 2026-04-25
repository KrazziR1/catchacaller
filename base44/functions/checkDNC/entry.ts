import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Simple DNC check — can be extended with API integration
// For now: checks our own opt-out list
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone_number } = await req.json();

    if (!phone_number) {
      return Response.json({ error: 'phone_number required' }, { status: 400 });
    }

    // Check if number is in our opt-out list
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({
      phone_number,
    });

    const isDNC = optOuts.length > 0;

    return Response.json({
      phone_number,
      is_dnc: isDNC,
      reason: isDNC ? 'Number has opted out' : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});