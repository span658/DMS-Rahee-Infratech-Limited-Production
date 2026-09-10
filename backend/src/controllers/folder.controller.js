const db = require('../config/db');
const { logAudit } = require('../services/audit.service');

// Get all folders for the authenticated user's organization scope
async function getFolders(req, res) {
  try {
    let sql = `
      SELECT f.*, pf.name as parent_folder_name, u.name as creator_name,
        (SELECT COUNT(*) FROM documents d WHERE d.folder_id = f.id) as document_count
      FROM folders f
      LEFT JOIN folders pf ON f.parent_id = pf.id
      LEFT JOIN users u ON f.created_by = u.id
    `;
    let params = [];

    const isExecAdmin = req.user.role_name === 'RAHEE_EXEC_ADMIN' || req.user.role_id === 3;
    if (!req.user.is_super_admin && !isExecAdmin) {
      sql += ' WHERE f.organization_id = ?';
      params.push(req.user.organization_id);
    } else if (req.query.organization_id) {
      sql += ' WHERE f.organization_id = ?';
      params.push(req.query.organization_id);
    }

    sql += ' ORDER BY f.name ASC';

    const folders = await db.query(sql, params);
    return res.json({ success: true, folders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Create new folder for tenant organization (Company 1 / Company 2 Admin)
async function createFolder(req, res) {
  try {
    const { name, description, parent_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required.' });
    }

    // STRICT RULE: Folder Creation is EXCLUSIVELY PERMITTED for Company 1 Admin (Rahul Dey / Rajib Ghosh), Company 2 Admin (Shardu Kumar Rastogi), & Super Admin.
    const isCompany1Admin = [2, 3].includes(req.user.role_id) || ['RAHEE_ADMIN_REVIEWER', 'RAHEE_EXEC_ADMIN'].includes(req.user.role_name);
    const isCompany2Admin = req.user.role_id === 8 || req.user.role_name === 'IRCON_ADMIN_REVIEWER';
    const isSuperAdmin = req.user.is_super_admin || req.user.role_id === 1 || req.user.role_name === 'SUPER_ADMIN';

    if (!isCompany1Admin && !isCompany2Admin && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Folder creation is strictly restricted to Company Admins ONLY (Company 1 Admin & Company 2 Admin).'
      });
    }

    const orgId = req.user.organization_id || 1; // Default to Company 1 if superadmin
    const parentId = parent_id ? parseInt(parent_id) : null;

    if (parentId) {
      const parentCheck = await db.query('SELECT id FROM folders WHERE id = ? AND organization_id = ?', [parentId, orgId]);
      if (!parentCheck || parentCheck.length === 0) {
        return res.status(400).json({ success: false, message: 'Selected parent folder does not exist in your organization.' });
      }
    }

    // Check if folder name already exists under the same parent directory
    let existing;
    if (parentId) {
      existing = await db.query(
        'SELECT id FROM folders WHERE organization_id = ? AND parent_id = ? AND LOWER(name) = LOWER(?)',
        [orgId, parentId, name.trim()]
      );
    } else {
      existing = await db.query(
        'SELECT id FROM folders WHERE organization_id = ? AND parent_id IS NULL AND LOWER(name) = LOWER(?)',
        [orgId, name.trim()]
      );
    }

    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: `Folder '${name.trim()}' already exists in this directory.` });
    }

    const result = await db.query(
      'INSERT INTO folders (organization_id, name, description, created_by, parent_id) VALUES (?, ?, ?, ?, ?)',
      [orgId, name.trim(), (description || '').trim(), req.user.id, parentId]
    );

    const folderId = result.insertId || result.id;

    await logAudit({
      organization_id: orgId,
      user_id: req.user.id,
      action: 'FOLDER_CREATED',
      comment: `Created new document folder '${name.trim()}' (ID: ${folderId}${parentId ? `, Parent ID: ${parentId}` : ''}).`,
      req
    });

    return res.status(201).json({
      success: true,
      message: `Folder '${name.trim()}' created successfully.`,
      folder: {
        id: folderId,
        organization_id: orgId,
        name: name.trim(),
        description: (description || '').trim(),
        created_by: req.user.id,
        parent_id: parentId
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Delete folder
async function deleteFolder(req, res) {
  try {
    const { id } = req.params;

    const folders = await db.query('SELECT * FROM folders WHERE id = ?', [id]);
    const folder = folders[0];
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found.' });
    }

    // Role permission check
    const isCompany1Admin = [2, 3].includes(req.user.role_id) || ['RAHEE_ADMIN_REVIEWER', 'RAHEE_EXEC_ADMIN'].includes(req.user.role_name);
    const isCompany2Admin = req.user.role_id === 8 || req.user.role_name === 'IRCON_ADMIN_REVIEWER';
    const isSuperAdmin = req.user.is_super_admin;

    if (!isCompany1Admin && !isCompany2Admin && !isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Folder management is restricted to Company Admins.' });
    }

    // Unlink documents from folder
    await db.query('UPDATE documents SET folder_id = NULL WHERE folder_id = ?', [id]);

    // Delete folder
    await db.query('DELETE FROM folders WHERE id = ?', [id]);

    await logAudit({
      organization_id: folder.organization_id,
      user_id: req.user.id,
      action: 'FOLDER_DELETED',
      comment: `Deleted folder '${folder.name}' (ID: ${id}).`,
      req
    });

    return res.json({ success: true, message: `Folder '${folder.name}' deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getFolders,
  createFolder,
  deleteFolder
};
