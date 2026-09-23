const db = require('../config/db');

async function logAudit({ organization_id, user_id, user_email, user_name, action, document_id, version, comment, req }) {
  try {
    let ipAddress = '127.0.0.1';
    if (req) {
      const forwarded = req.headers?.['x-forwarded-for'];
      if (forwarded) {
        ipAddress = forwarded.split(',')[0].trim();
      } else if (req.ip) {
        ipAddress = req.ip;
      } else if (req.socket?.remoteAddress) {
        ipAddress = req.socket.remoteAddress;
      }
    }

    // Clean IPv6 mapped IPv4 like ::ffff:127.0.0.1
    if (typeof ipAddress === 'string' && ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.replace('::ffff:', '');
    }
    if (typeof ipAddress === 'string' && ipAddress.length > 50) {
      ipAddress = ipAddress.substring(0, 50);
    }

    const userAgent = req?.headers?.['user-agent'] ? String(req.headers['user-agent']).substring(0, 500) : 'System Server';

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
    console.error('Audit Logging Failed (Non-blocking):', err.message);
  }
}

module.exports = { logAudit };
