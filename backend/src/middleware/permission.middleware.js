function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Super Admin: Governance & Oversight ONLY (Upload is strictly disabled)
    if (req.user.is_super_admin) {
      if (requiredPermissions.includes('upload')) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Super Admin is configured with Viewer & Governance authority only and cannot upload documents.'
        });
      }
      return next();
    }

    const userPerms = req.user.permissions || [];
    const hasPerm = requiredPermissions.some(perm => userPerms.includes(perm));

    if (hasPerm) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access Denied: Missing required permission (${requiredPermissions.join(' or ')}).`
    });
  };
}

module.exports = { requirePermission };
