import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Recalculate scores for all prospects created by this user
    const prospects = await base44.entities.ColdCallProspect.list('-created_date', 1000);
    
    let updated = 0;
    for (const prospect of prospects) {
      try {
        await base44.functions.invoke('calculateLeadScore', {
          prospect_id: prospect.id
        });
        updated++;
      } catch (e) {
        console.warn(`Failed to recalculate score for ${prospect.id}:`, e.message);
      }
    }

    return Response.json({ success: true, updated, total: prospects.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});