import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { template_id, variant, sent, responded } = body;

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await base44.entities.SMSTemplate.get(template_id);
    if (!template || !template.ab_test_active) {
      return Response.json({ error: 'Template not found or test not active' }, { status: 404 });
    }

    // Update the appropriate variant metrics
    const results = template.ab_test_results || {};
    if (variant === 'a') {
      results.variant_a_sent = (results.variant_a_sent || 0) + (sent || 0);
      results.variant_a_responses = (results.variant_a_responses || 0) + (responded || 0);
    } else if (variant === 'b') {
      results.variant_b_sent = (results.variant_b_sent || 0) + (sent || 0);
      results.variant_b_responses = (results.variant_b_responses || 0) + (responded || 0);
    }

    await base44.entities.SMSTemplate.update(template_id, {
      ab_test_results: results
    });

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});