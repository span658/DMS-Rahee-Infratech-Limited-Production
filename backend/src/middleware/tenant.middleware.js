// Enforces organization-level tenant isolation
function enforceTenantIsolation(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  // Super Admin can access multi-tenant resources
  if (req.user.is_super_admin) {
    // If Super Admin provides an explicit header or query param for tenant filtering, bind it
    const targetOrgId = req.headers['x-organization-id'] || req.query.organization_id;
    req.tenantOrgId = targetOrgId ? parseInt(targetOrgId) : null;
    return next();
  }

  // Normal user MUST have an organization_id
  if (!req.user.organization_id) {
    return res.status(403).json({ success: false, message: 'Access Denied: User is not assigned to any valid organization.' });
  }

  // Bind tenant organization ID strictly from JWT session
  req.tenantOrgId = req.user.organization_id;
  next();
}

// Helper to verify resource ownership against tenant
function verifyResourceTenant(resourceOrgId, req, res) {
  if (req.user.is_super_admin) return true;
  if (!resourceOrgId || parseInt(resourceOrgId) !== parseInt(req.user.organization_id)) {
    res.status(403).json({ success: false, message: 'Access Denied: You do not have permission to access resources belonging to another organization.' });
    return false;
  }
  return true;
}

module.exports = {
  enforceTenantIsolation,
  verifyResourceTenant
};
