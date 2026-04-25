import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { conversation_id } = payload;

    // Fetch conversation and CRM integrations
    const conversation = await base44.asServiceRole.entities.Conversation.get(conversation_id);
    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 1);
    const profile = profiles[0];
    
    if (!profile) {
      return Response.json({ error: 'No business profile' }, { status: 400 });
    }

    // Get enabled integrations
    const integrations = await base44.asServiceRole.entities.CRMIntegration.filter({
      account_id: profile.id,
      is_enabled: true,
    });

    if (integrations.length === 0) {
      return Response.json({ status: 'no_integrations' });
    }

    const results = [];

    for (const integration of integrations) {
      try {
        const payload_data = {
          caller_name: conversation.caller_name,
          caller_phone: conversation.caller_phone,
          pipeline_stage: conversation.pipeline_stage,
          estimated_value: conversation.estimated_value,
          service_type: conversation.service_type,
          messages: conversation.messages?.length || 0,
          conversation_id: conversation.id,
          synced_at: new Date().toISOString(),
        };

        if (integration.platform === 'zapier') {
          // Send to Zapier webhook
          const res = await fetch(integration.api_key, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload_data),
          });
          
          if (!res.ok) {
            throw new Error(`Zapier error: ${res.status}`);
          }
          results.push({ platform: 'zapier', status: 'sent' });
        } else if (integration.platform === 'hubspot') {
          // HubSpot API sync
          const hubspotRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integration.api_key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              properties: {
                firstname: conversation.caller_name?.split(' ')[0] || '',
                lastname: conversation.caller_name?.split(' ')[1] || '',
                phone: conversation.caller_phone,
                lifecyclestage: mapStageToHubSpot(conversation.pipeline_stage),
              },
            }),
          });
          
          if (!hubspotRes.ok) {
            throw new Error(`HubSpot error: ${hubspotRes.status}`);
          }
          results.push({ platform: 'hubspot', status: 'sent' });
        } else if (integration.platform === 'salesforce') {
          // Salesforce API sync (simplified)
          const salesforceRes = await fetch(`https://${integration.workspace_id}.salesforce.com/services/data/v57.0/sobjects/Lead`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integration.api_key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              FirstName: conversation.caller_name?.split(' ')[0] || '',
              LastName: conversation.caller_name?.split(' ')[1] || 'Lead',
              Phone: conversation.caller_phone,
              Status: mapStageToSalesforce(conversation.pipeline_stage),
            }),
          });
          
          if (!salesforceRes.ok) {
            throw new Error(`Salesforce error: ${salesforceRes.status}`);
          }
          results.push({ platform: 'salesforce', status: 'sent' });
        }
      } catch (error) {
        console.error(`Error syncing to ${integration.platform}:`, error);
        results.push({ platform: integration.platform, status: 'error', error: error.message });
        
        // Log sync failure for audit trail
        try {
          await base44.asServiceRole.functions.invoke('logSMSAudit', {
            phone_number: conversation.caller_phone,
            business_phone: profile.phone_number,
            message_body: `CRM sync failed for ${integration.platform}: ${error.message}`,
            message_type: 'campaign',
            conversation_id: conversation.id,
            status: 'failed',
            consent_type: 'called_business',
            sent_by: 'sync_error',
          });
        } catch (auditErr) {
          console.warn(`Sync error audit logging failed (non-critical):`, auditErr.message);
        }
      }
    }

    return Response.json({ status: 'completed', results });
  } catch (error) {
    console.error('CRM sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function mapStageToHubSpot(stage) {
  const mapping = {
    'new': 'subscriber',
    'contacted': 'lead',
    'qualified': 'lead',
    'booked': 'customer',
    'won': 'customer',
    'lost': 'lead',
  };
  return mapping[stage] || 'lead';
}

function mapStageToSalesforce(stage) {
  const mapping = {
    'new': 'Open - Not Contacted',
    'contacted': 'Open - Not Contacted',
    'qualified': 'Open - Qualified',
    'booked': 'Closed - Won',
    'won': 'Closed - Won',
    'lost': 'Closed - Lost',
  };
  return mapping[stage] || 'Open - Not Contacted';
}