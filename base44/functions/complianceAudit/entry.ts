import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// COMPLIANCE AUDIT: Review all SMS activity for violations
// Returns detailed report of potential issues
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Admin-only function
    if (!user || user.role !== 'admin') {
      console.warn(`Unauthorized compliance audit attempt from ${user?.email}`);
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    let { lookback_days = 30 } = payload;
    
    // Validate lookback_days
    if (typeof lookback_days !== 'number' || lookback_days < 1 || lookback_days > 365) {
      lookback_days = 30;
    }
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - lookback_days);

    // Fetch all audit logs
    const auditLogs = await base44.asServiceRole.entities.SMSAuditLog.list('-sent_at', 10000);
    const recentLogs = auditLogs.filter(log => new Date(log.sent_at) > cutoff);

    // Fetch opt-outs and consents
    const optOuts = await base44.asServiceRole.entities.SMSOptOut.list('-opted_out_at', 10000);
    const consents = await base44.asServiceRole.entities.LeadConsent.list('-called_at', 10000);

    const issues = [];
    const stats = {
      total_sms_sent: recentLogs.length,
      total_failed: recentLogs.filter(l => l.status === 'failed').length,
      total_opted_out_numbers: optOuts.length,
      sms_sent_to_opted_out: 0,
      sms_sent_without_consent: 0,
      sms_sent_after_ebr_expired: 0,
      missing_stop_line: 0,
      messages_without_audit: 0,
    };

    const optOutSet = new Set(optOuts.map(o => o.phone_number));

    for (const log of recentLogs) {
      // Check if sent to opted-out number
      if (optOutSet.has(log.phone_number)) {
        stats.sms_sent_to_opted_out++;
        issues.push({
          type: 'VIOLATION',
          severity: 'CRITICAL',
          message: `SMS sent to opted-out number`,
          phone: log.phone_number,
          sent_at: log.sent_at,
          timestamp: new Date(log.sent_at).toISOString(),
        });
      }

      // Check if message includes STOP line
      if (!log.message_body.toUpperCase().includes('STOP')) {
        stats.missing_stop_line++;
        issues.push({
          type: 'WARNING',
          severity: 'HIGH',
          message: `SMS missing TCPA-required STOP keyword`,
          phone: log.phone_number,
          message_type: log.message_type,
          sent_at: log.sent_at,
        });
      }

      // Check consent validity
      if (log.consent_type === 'called_business') {
        const consent = consents.find(c => c.phone_number === log.phone_number && c.is_valid);
        if (!consent) {
          stats.sms_sent_without_consent++;
          issues.push({
            type: 'VIOLATION',
            severity: 'CRITICAL',
            message: `SMS sent without valid consent record`,
            phone: log.phone_number,
            sent_at: log.sent_at,
          });
        } else {
          // Check EBR expiration
          const ebsExp = new Date(consent.ebs_expiration_date);
          const sentAt = new Date(log.sent_at);
          if (sentAt > ebsExp) {
            stats.sms_sent_after_ebr_expired++;
            issues.push({
              type: 'VIOLATION',
              severity: 'CRITICAL',
              message: `SMS sent after EBR expired`,
              phone: log.phone_number,
              ebr_expired_at: consent.ebs_expiration_date,
              sent_at: log.sent_at,
            });
          }
        }
      }
    }

    console.info(`Compliance audit completed by ${user.email}: ${issues.length} issues found in ${lookback_days} days`);
    return Response.json({
      audit_period_days: lookback_days,
      stats,
      total_issues: issues.length,
      issues: issues.slice(0, 100),
      recommendations: generateRecommendations(stats, issues),
    });
  } catch (error) {
    console.error(`Compliance audit error for ${user?.email}:`, error.message);
    return Response.json({ error: 'Audit failed', details: 'System error during compliance audit' }, { status: 500 });
  }
});

function generateRecommendations(stats, issues) {
  const recs = [];
  
  if (stats.sms_sent_to_opted_out > 0) {
    recs.push({
      priority: 'CRITICAL',
      action: 'Implement real-time opt-out list caching to prevent sending to opted-out numbers',
      impact: `Prevents ${stats.sms_sent_to_opted_out} potential TCPA violations`,
    });
  }
  
  if (stats.missing_stop_line > 0) {
    recs.push({
      priority: 'HIGH',
      action: 'Add automated validation to ensure all outbound SMS includes STOP keyword',
      impact: `Ensures TCPA compliance for ${stats.missing_stop_line} messages`,
    });
  }
  
  if (stats.sms_sent_without_consent > 0) {
    recs.push({
      priority: 'CRITICAL',
      action: 'Strengthen consent validation in sendTemplatedSMS and autoFollowUp functions',
      impact: `Prevents illegal contact to ${stats.sms_sent_without_consent} numbers`,
    });
  }

  if (stats.sms_sent_after_ebr_expired > 0) {
    recs.push({
      priority: 'CRITICAL',
      action: 'Add EBR expiration time check before every SMS send',
      impact: `Prevents ${stats.sms_sent_after_ebr_expired} TCPA-violating messages`,
    });
  }

  return recs;
}