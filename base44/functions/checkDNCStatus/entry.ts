import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { phone_number, state } = await req.json();

    if (!phone_number) {
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Check against local DNC registry (SMSOptOut)
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.filter({
      phone_number: phone_number
    });

    const isOnLocalDNC = optOuts.length > 0;

    // Check against prospect's own do_not_call status
    const dncProspects = await base44.asServiceRole.entities.ColdCallProspect.filter({
      phone_number: phone_number,
      status: 'do_not_call'
    });

    const isMarkedDNC = dncProspects.length > 0;

    // Log the DNC check
    await base44.asServiceRole.entities.ColdCallComplianceLog.create({
      phone_number,
      action: 'dnc_check_performed',
      state: state || 'unknown',
      details: `Local DNC: ${isOnLocalDNC}, Marked DNC: ${isMarkedDNC}`,
      timestamp: new Date().toISOString(),
      performed_by: user.email,
    });

    return Response.json({
      isDNC: isOnLocalDNC || isMarkedDNC,
      isOnLocalDNC,
      isMarkedDNC,
      reason: isOnLocalDNC ? 'On local opt-out list' : isMarkedDNC ? 'Marked as do-not-call' : null,
    });
  } catch (error) {
    console.error('checkDNCStatus error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});