// Authentication & authorization helpers

export async function requireAuth(base44) {
  const user = await base44.auth.me().catch(() => null);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin(base44) {
  const user = await requireAuth(base44);
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}

// Ensure user owns the resource they're modifying
export async function authorizeProfileOwner(base44, profileId, user) {
  const profile = await base44.asServiceRole.entities.BusinessProfile.get(profileId);
  
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  // Admins can access anything, users can only access their own
  if (user.role !== 'admin' && profile.created_by !== user.email) {
    throw new Error('Access denied');
  }
  
  return profile;
}

export async function getUserProfile(base44, userEmail) {
  const profiles = await base44.asServiceRole.entities.BusinessProfile.filter({
    created_by: userEmail,
  });
  return profiles[0] || null;
}