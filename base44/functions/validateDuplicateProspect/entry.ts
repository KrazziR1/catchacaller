import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { phone_number } = body;

    const base44 = createClientFromRequest(req);
    
    // Check for existing prospect with same phone
    const existing = await base44.entities.ColdCallProspect.filter({
      phone_number: phone_number
    });

    if (existing.length > 0) {
      return Response.json({
        exists: true,
        prospect: existing[0],
        message: `Prospect ${existing[0].business_name} already exists with this phone number`
      });
    }

    return Response.json({ exists: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});