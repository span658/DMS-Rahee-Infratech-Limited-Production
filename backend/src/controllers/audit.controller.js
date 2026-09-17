const db = require('../config/db');
const { MULTI_TENANT_ISOLATION_ENABLED } = require('../config/workflow.config');

async function getAuditLogs(req, res) {
  try {
    let sql = `
      SELECT a.*, o.name as organization_name, o.code as organization_code
      FROM audit_logs a
      LEFT JOIN organizations o ON a.organization_id = o.id
    `;
    let params = [];
    let whereClauses = [];

    // Tenant Isolation
    if (MULTI_TENANT_ISOLATION_ENABLED && !req.user.is_super_admin) {
      whereClauses.push('a.organization_id = ?');
      params.push(req.user.organization_id);
    } else if (req.query.organization_id) {
      whereClauses.push('a.organization_id = ?');
      params.push(req.query.organization_id);
    }

    if (req.query.action) {
      whereClauses.push('a.action = ?');
      params.push(req.query.action);
    }

    if (req.query.user_email) {
      whereClauses.push('LOWER(a.user_email) LIKE LOWER(?)');
      params.push(`%${req.query.user_email.trim()}%`);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY a.id DESC LIMIT 200';

    const logs = await db.query(sql, params);
    return res.json({ success: true, auditLogs: logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAuditLogs };
