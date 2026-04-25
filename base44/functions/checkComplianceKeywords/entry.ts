import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FLAGGED_KEYWORDS = [
  'debt',
  'collection',
  'political',
  'campaign',
  'collections',
  'creditor',
  'judgment',
  'lawsuit',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { business_name, industry } = await req.json();

    if (!business_name) {
      return Response.json({ error: 'business_name required' }, { status: 400 });
    }

    const text = `${business_name} ${industry || ''}`.toLowerCase();
    const flaggedKeywords = FLAGGED_KEYWORDS.filter(kw => text.includes(kw));

    return Response.json({
      requires_manual_review: flaggedKeywords.length > 0,
      flagged_keywords: flaggedKeywords,
      reason: flaggedKeywords.length > 0
        ? `Business profile contains restricted keywords: ${flaggedKeywords.join(', ')}`
        : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});