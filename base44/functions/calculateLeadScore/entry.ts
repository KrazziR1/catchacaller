import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { prospect_id } = body;
    
    const base44 = createClientFromRequest(req);
    const prospect = await base44.entities.ColdCallProspect.get(prospect_id);
    
    if (!prospect) {
      return Response.json({ error: 'Prospect not found' }, { status: 404 });
    }

    // Calculate lead score (0-100) with industry weighting
    let score = 0;

    // Status weighting (40 points base, industry-adjusted)
    const industryMultipliers = {
      'hvac': 1.1, 'plumbing': 1.1, 'roofing': 1.1,
      'real_estate': 1.2, 'legal': 1.3,
      'med_spa': 1.0, 'dental': 1.0,
      'general': 1.0
    };
    const multiplier = industryMultipliers[prospect.industry] || 1.0;

    const statusScores = {
      'do_not_call': -100,
      'not_interested': 10,
      'contacted': 25,
      'interested': 50,
      'signed_up_trial': 75,
      'actively_using': 100,
      'discontinued_trial': 30
    };
    score += (statusScores[prospect.status] || 0) * multiplier;

    // Engagement metrics (30 points)
    if (prospect.engagement_metrics) {
      score += Math.min(prospect.engagement_metrics.message_responses * 5, 15);
      score += Math.min(prospect.engagement_metrics.booking_link_clicks * 10, 15);
    }

    // Recent contact with recency decay (20 points)
    if (prospect.date_contacted) {
      const daysSinceContact = Math.floor((new Date() - new Date(prospect.date_contacted)) / (1000 * 60 * 60 * 24));
      let recencyScore = 20;
      // Decay: lose 1 point per 9 days (fully decayed after 180 days)
      recencyScore = Math.max(0, 20 - (daysSinceContact / 9));
      score += recencyScore;
    }

    // Consent & DNC flags
    if (prospect.is_dnc_flagged) score -= 30;
    if (!prospect.has_consent) score -= 10;

    // Clamp between 0-100
    const finalScore = Math.max(0, Math.min(100, score));

    // Update prospect with new score
    await base44.entities.ColdCallProspect.update(prospect_id, {
      lead_score: finalScore
    });

    return Response.json({ lead_score: finalScore, calculation: { statusScores, metrics: prospect.engagement_metrics } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});