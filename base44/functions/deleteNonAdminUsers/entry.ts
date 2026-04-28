import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all users
    const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    
    // Filter out admins
    const nonAdmins = users.filter(u => u.role !== 'admin');
    
    if (nonAdmins.length === 0) {
      return Response.json({ success: true, deleted: 0, message: 'No non-admin users found' });
    }

    // Delete each non-admin user and their associated data
    const results = await Promise.allSettled(
      nonAdmins.map(async (u) => {
        // Delete user
        await base44.asServiceRole.entities.User.delete(u.id);
        return u.email;
      })
    );

    const deleted = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Also clean up BusinessProfiles, Subscriptions, AuditLogs
    try {
      const profiles = await base44.asServiceRole.entities.BusinessProfile.list('-created_date', 1000);
      await Promise.allSettled(profiles.map(p => base44.asServiceRole.entities.BusinessProfile.delete(p.id)));
    } catch (e) { console.warn('Profile cleanup failed:', e.message); }

    try {
      const subs = await base44.asServiceRole.entities.Subscription.list('-created_date', 1000);
      await Promise.allSettled(subs.map(s => base44.asServiceRole.entities.Subscription.delete(s.id)));
    } catch (e) { console.warn('Subscription cleanup failed:', e.message); }

    try {
      const logs = await base44.asServiceRole.entities.AdminAuditLog.list('-created_date', 1000);
      await Promise.allSettled(logs.map(l => base44.asServiceRole.entities.AdminAuditLog.delete(l.id)));
    } catch (e) { console.warn('Audit log cleanup failed:', e.message); }

    return Response.json({ 
      success: true, 
      deleted,
      failed,
      message: `Deleted ${deleted} users and all associated data` 
    });

  } catch (error) {
    console.error('deleteNonAdminUsers error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
