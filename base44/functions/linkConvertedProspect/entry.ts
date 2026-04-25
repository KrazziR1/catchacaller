import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { business_profile_id } = await req.json();

    if (!business_profile_id) {
      return Response.json({ error: 'Missing business_profile_id' }, { status: 400 });
    }

    // Get the business profile
    const profile = await base44.asServiceRole.entities.BusinessProfile.get(business_profile_id);
    if (!profile) {
      return Response.json({ error: 'Business profile not found' }, { status: 404 });
    }

    // Find matching ColdCallProspect by phone number or created_by email
    const prospects = await base44.asServiceRole.entities.ColdCallProspect.filter({
      phone_number: profile.phone_number,
    });

    let linkedCount = 0;

    for (const prospect of prospects) {
      if (!prospect.linked_business_profile_id) {
        await base44.asServiceRole.entities.ColdCallProspect.update(prospect.id, {
          linked_business_profile_id: business_profile_id,
          status: 'signed_up_trial',
          date_converted: new Date().toISOString(),
        });
        linkedCount++;
      }
    }

    return Response.json({
      success: true,
      linked_count: linkedCount,
      message: `Linked ${linkedCount} prospect(s) to business profile`,
    });
  } catch (error) {
    console.error('linkConvertedProspect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});