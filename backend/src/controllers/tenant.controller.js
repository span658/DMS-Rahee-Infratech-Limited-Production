const db = require('../config/db');
const { logAudit } = require('../services/audit.service');

async function getOrganizations(req, res) {
  try {
    let sql = 'SELECT * FROM organizations';
    let params = [];

    // If non-super admin, limit list to their organization
    if (!req.user.is_super_admin) {
      sql += ' WHERE id = ?';
      params.push(req.user.organization_id);
    }

    sql += ' ORDER BY id ASC';
    const orgs = await db.query(sql, params);
    return res.json({ success: true, organizations: orgs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createOrganization(req, res) {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Organization name and unique code are required.' });
    }

    const uppercaseCode = code.trim().toUpperCase();

    const existing = await db.query('SELECT id FROM organizations WHERE code = ?', [uppercaseCode]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: `Organization code '${uppercaseCode}' already exists.` });
    }

    const result = await db.query(
      'INSERT INTO organizations (name, code, status) VALUES (?, ?, ?)',
      [name.trim(), uppercaseCode, 'ACTIVE']
    );

    await logAudit({
      organization_id: result.insertId,
      action: 'ORGANIZATION_CREATED',
      comment: `New tenant organization '${name.trim()}' (${uppercaseCode}) created by Super Admin.`,
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Organization created successfully.',
      organization: { id: result.insertId, name: name.trim(), code: uppercaseCode, status: 'ACTIVE' }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function updateOrganizationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ACTIVE or INACTIVE.' });
    }

    await db.query('UPDATE organizations SET status = ? WHERE id = ?', [status, id]);

    await logAudit({
      organization_id: id,
      action: 'ORGANIZATION_UPDATED',
      comment: `Organization ID ${id} status set to ${status}.`,
      req
    });

    return res.json({ success: true, message: `Organization status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getOrganizations,
  createOrganization,
  updateOrganizationStatus
};
