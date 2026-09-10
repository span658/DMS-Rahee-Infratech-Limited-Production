const { verifyAccessToken } = require('../config/jwt');
const db = require('../config/db');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const decoded = verifyAccessToken(token);
    
    // Retrieve fresh user info from DB to verify status and permissions
    const users = await db.query(
      `SELECT u.id, u.organization_id, u.name, u.email, u.status, u.role_id, r.name as role_name, o.name as organization_name, o.code as organization_code
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = ?`,
      [decoded.userId]
    );

    const user = users[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'User session invalid or account not found.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account has been disabled. Please contact Administrator.' });
    }

    // Fetch user permissions
    const permissions = await db.query(
      `SELECT p.code 
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ?`,
      [user.role_id]
    );

    req.user = {
      id: user.id,
      organization_id: user.organization_id,
      organization_name: user.organization_name,
      organization_code: user.organization_code,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
      is_super_admin: user.role_name === 'SUPER_ADMIN' || user.organization_id === null,
      permissions: permissions.map(p => p.code)
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

module.exports = { authenticateToken };
