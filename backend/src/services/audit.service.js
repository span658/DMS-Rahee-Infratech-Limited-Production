const db = require('../config/db');

async function logAudit({ organization_id, user_id, user_email, user_name, action, document_id, version, comment, req }) {
  try {
    const ipAddress = req?.headers ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    const userAgent = req?.headers ? (req.headers['user-agent'] || 'System Server') : 'System Server';

    const orgId = organization_id !== undefined ? organization_id : (req && req.user ? req.user.organization_id : null);
    const uId = user_id !== undefined ? user_id : (req && req.user ? req.user.id : null);
    const uEmail = user_email || (req && req.user ? req.user.email : 'System');
    const uName = user_name || (req && req.user ? req.user.name : 'System');

    await db.query(
      `INSERT INTO audit_logs (organization_id, user_id, user_email, user_name, action, document_id, version, comment, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orgId, uId, uEmail, uName, action, document_id || null, version || null, comment || null, ipAddress, userAgent]
    );
  } catch (err) {
    console.error('Audit Logging Failed:', err.message);
  }
}

module.exports = { logAudit };
