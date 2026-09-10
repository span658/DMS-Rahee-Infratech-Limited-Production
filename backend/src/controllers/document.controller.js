const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const JSZip = require('jszip');
const db = require('../config/db');
const { calculateFileHash, uploadDir } = require('../config/storage');
const { sendNotification } = require('../services/notification.service');
const { logAudit } = require('../services/audit.service');

// Upload Initial Document (V1)
async function uploadDocument(req, res) {
  try {
    if (req.user.is_super_admin) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Forbidden: Super Admin accounts are restricted from uploading documents.' });
    }

    if (req.user.role_name === 'RAHEE_ADMIN_REVIEWER' || req.user.role_id === 2 || req.user.email?.toLowerCase() === 'rahul.d@rahee.com') {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Forbidden: Document upload is restricted. Rahul Dey is designated as Stage 1 Admin Reviewer. Initial document uploads are strictly reserved for Document Uploaders (Om Jha).' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid document file.' });
    }

    const { title, description, category } = req.body;
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Document title is required and cannot be empty.' });
    }

    if (title.trim().length > 255) {
      return res.status(400).json({ success: false, message: 'Document title cannot exceed 255 characters.' });
    }

    if (category && category.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Category name cannot exceed 100 characters.' });
    }

    const organizationId = req.user.organization_id;
    if (!organizationId && !req.user.is_super_admin) {
      return res.status(403).json({ success: false, message: 'User does not belong to an active organization.' });
    }

    const orgIdToUse = organizationId || (req.body.organization_id ? parseInt(req.body.organization_id) : 1);

    // Calculate file hash (SHA-256)
    const filePath = req.file.path;
    const fileHash = await calculateFileHash(filePath);

    // Determine document type label and enforce strict format matching validation
    const ext = path.extname(req.file.originalname).toUpperCase().replace('.', '');
    const docTypeMap = {
      PDF: 'PDF',
      DOC: 'WORD',
      DOCX: 'WORD',
      XLS: 'EXCEL',
      XLSX: 'EXCEL',
      PPT: 'POWERPOINT',
      PPTX: 'POWERPOINT',
      JPG: 'IMAGE',
      JPEG: 'IMAGE',
      PNG: 'IMAGE',
      WEBP: 'IMAGE',
      SVG: 'IMAGE'
    };

    const actualDetectedType = docTypeMap[ext];
    if (!actualDetectedType) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: `Unsupported File Format (.${ext.toLowerCase()}). Only Microsoft Word, PDF, Microsoft Excel, Microsoft PowerPoint, and Images are supported.`
      });
    }

    const userSelectedType = (req.body.document_type && req.body.document_type.trim()) 
      ? req.body.document_type.trim().toUpperCase() 
      : actualDetectedType;

    const typeLabels = {
      PDF: 'PDF Document',
      WORD: 'Microsoft Word',
      EXCEL: 'Microsoft Excel',
      POWERPOINT: 'Microsoft PowerPoint',
      IMAGE: 'Image'
    };

    // Strict Type Mismatch Validation Check
    if (['PDF', 'WORD', 'EXCEL', 'POWERPOINT', 'IMAGE'].includes(userSelectedType)) {
      if (userSelectedType !== actualDetectedType) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        const selectedLabel = typeLabels[userSelectedType] || userSelectedType;
        const detectedLabel = typeLabels[actualDetectedType] || actualDetectedType;
        return res.status(400).json({
          success: false,
          message: `Validation Error: You selected '${selectedLabel}', but uploaded a ${detectedLabel} file (.${ext.toLowerCase()}). Please select '${detectedLabel}' in the dropdown or attach a matching file.`
        });
      }
    }

    const documentType = actualDetectedType;
    const folderIdToUse = req.body.folder_id ? parseInt(req.body.folder_id) : null;

    // 1. Create Document Entry
    const docRes = await db.query(
      `INSERT INTO documents (organization_id, uploaded_by, title, description, category, document_type, status, current_version_number, is_locked, folder_id)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING_REVIEW_1', 'V1', 0, ?)`,
      [orgIdToUse, req.user.id, title.trim(), description || '', category || 'General', documentType, folderIdToUse]
    );

    const documentId = docRes.insertId;

    // 2. Create Initial Version Entry (V1)
    const verRes = await db.query(
      `INSERT INTO document_versions (document_id, organization_id, version_number, version_index, original_filename, storage_key, file_size, mime_type, file_hash, uploaded_by, change_description, review_status)
       VALUES (?, ?, 'V1', 1.0, ?, ?, ?, ?, ?, ?, 'Initial document submission', 'PENDING_REVIEW_1')`,
      [documentId, orgIdToUse, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype, fileHash, req.user.id]
    );

    const versionId = verRes.insertId;

    // Update document's current_version_id
    await db.query('UPDATE documents SET current_version_id = ? WHERE id = ?', [versionId, documentId]);

    // 3. Dispatch Notification to All Organization Stakeholders (Reviewers, Managers, Uploaders, Super Admin)
    const targetUsers = await db.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.role_id, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE (u.organization_id = ? OR u.organization_id IS NULL OR r.name = 'SUPER_ADMIN')
         AND u.status = 'ACTIVE'`,
      [orgIdToUse]
    );

    const EXCLUDED_NOTIF_EMAILS = ['ayush.k@rahee.com', 'manoj.g@rahee.com', 'arunabha.p@rahee.com'];

    for (const targetUser of targetUsers) {
      if (targetUser.email && EXCLUDED_NOTIF_EMAILS.includes(targetUser.email.toLowerCase())) {
        continue; // Skip Ayush Khaitan, Manoj Ghosh, and Arunabha Pyne
      }

      const isUploader = targetUser.id === req.user.id;
      const notifTitle = isUploader 
        ? '📄 Document Uploaded Successfully' 
        : `🔔 New Document Uploaded: ${title.trim()}`;
      
      const notifMessage = isUploader
        ? `Your document "${title.trim()}" (V1) has been uploaded successfully and submitted for workflow review.`
        : `A new document "${title.trim()}" (V1) was uploaded by ${req.user.name} and is available in the repository.`;

      await sendNotification({
        recipientId: targetUser.id,
        senderId: req.user.id,
        documentId: documentId,
        organizationId: orgIdToUse,
        title: notifTitle,
        message: notifMessage,
        type: isUploader ? 'DOCUMENT_UPLOAD_SUCCESS' : 'NEW_DOCUMENT_UPLOADED',
        emailDetails: {
          documentTitle: title.trim(),
          documentVersion: 'V1'
        }
      });
    }

    // 4. Audit Trail Log
    await logAudit({
      organization_id: orgIdToUse,
      user_id: req.user.id,
      action: 'DOCUMENT_UPLOADED',
      document_id: documentId,
      version: 'V1',
      comment: `Document '${title.trim()}' uploaded (SHA-256: ${fileHash.substring(0, 10)}...).`,
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully and routed to Stage 1 Reviewer.',
      documentId,
      version: 'V1',
      status: 'PENDING_REVIEW_1'
    });
  } catch (err) {
    console.error('Document Upload Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Get Documents (Strict Tenant Isolated)
async function getDocuments(req, res) {
  try {
    let sql = `
      SELECT d.id, d.organization_id, d.uploaded_by, d.title, d.description, d.category, d.document_type,
             d.status, d.current_version_id, d.current_version_number, d.is_locked, d.folder_id, d.created_at, d.updated_at,
             u.name as uploader_name, u.email as uploader_email,
             o.name as organization_name, o.code as organization_code,
             v.original_filename, v.file_size, v.mime_type,
             fl.name as folder_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN organizations o ON d.organization_id = o.id
      LEFT JOIN document_versions v ON d.current_version_id = v.id
      LEFT JOIN folders fl ON d.folder_id = fl.id
    `;
    let params = [];
    let whereClauses = [];

    // Tenant Isolation Filter: 100% Strictly Restricted per Organization
    if (!req.user.is_super_admin) {
      whereClauses.push('d.organization_id = ?');
      params.push(req.user.organization_id);
    } else if (req.query.organization_id) {
      whereClauses.push('d.organization_id = ?');
      params.push(req.query.organization_id);
    }

    // Folder filter
    if (req.query.folder_id) {
      if (req.query.folder_id === 'uncategorized') {
        whereClauses.push('(d.folder_id IS NULL OR d.folder_id = 0)');
      } else {
        whereClauses.push('d.folder_id = ?');
        params.push(req.query.folder_id);
      }
    }

    // Status filter (supports comma-separated list like PENDING_REVIEW_1,PENDING_REVIEW_2)
    if (req.query.status) {
      const statuses = req.query.status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        whereClauses.push('d.status = ?');
        params.push(statuses[0]);
      } else {
        const placeholders = statuses.map(() => '?').join(',');
        whereClauses.push(`d.status IN (${placeholders})`);
        params.push(...statuses);
      }
    }

    // Document Type filter (PDF, WORD, EXCEL, POWERPOINT, IMAGE)
    if (req.query.document_type) {
      whereClauses.push('d.document_type = ?');
      params.push(req.query.document_type.trim().toUpperCase());
    }

    // Category filter
    if (req.query.category) {
      whereClauses.push('d.category = ?');
      params.push(req.query.category);
    }

    // Search filter
    if (req.query.search) {
      whereClauses.push('(LOWER(d.title) LIKE LOWER(?) OR LOWER(d.description) LIKE LOWER(?))');
      const searchPattern = `%${req.query.search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY d.id DESC';

    const documents = await db.query(sql, params);
    return res.json({ success: true, documents });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Get Document Details (With Version History & Review History)
async function getDocumentById(req, res) {
  try {
    const { id } = req.params;

    const docs = await db.query(
      `SELECT d.*, u.name as uploader_name, u.email as uploader_email, o.name as organization_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       LEFT JOIN organizations o ON d.organization_id = o.id
       WHERE d.id = ?`,
      [id]
    );

    const doc = docs[0];
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Strict Tenant Isolation Check
    const isExecAdmin = req.user.role_name === 'RAHEE_EXEC_ADMIN' || req.user.role_id === 3;
    if (!req.user.is_super_admin && !isExecAdmin && parseInt(doc.organization_id) !== parseInt(req.user.organization_id)) {
      await logAudit({
        organization_id: req.user.organization_id,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        comment: `User attempted to view document ID ${id} belonging to Org ${doc.organization_id}.`,
        req
      });
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to view documents from another organization.' });
    }

    // Fetch Version History
    const versions = await db.query(
      `SELECT v.*, u.name as uploader_name 
       FROM document_versions v
       LEFT JOIN users u ON v.uploaded_by = u.id
       WHERE v.document_id = ?
       ORDER BY v.id DESC`,
      [id]
    );

    // Fetch Review Trail History
    const reviews = await db.query(
      `SELECT r.*, u.name as reviewer_name, u.email as reviewer_email, v.version_number
       FROM document_reviews r
       LEFT JOIN users u ON r.reviewer_id = u.id
       LEFT JOIN document_versions v ON r.document_version_id = v.id
       WHERE r.document_id = ?
       ORDER BY r.id ASC`,
      [id]
    );

    // Record Audit View Event
    await logAudit({
      organization_id: doc.organization_id,
      user_id: req.user.id,
      action: 'DOCUMENT_VIEWED',
      document_id: doc.id,
      version: doc.current_version_number,
      comment: `Document '${doc.title}' detail viewed.`,
      req
    });

    return res.json({
      success: true,
      document: doc,
      versions,
      reviews
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Upload New Version / Edit Document (Re-submission Cycle)
async function uploadNewVersion(req, res) {
  try {
    if (req.user.is_super_admin) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Forbidden: Super Admin accounts are restricted from uploading or editing document files.' });
    }

    const { id } = req.params;
    const { change_description } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please attach the updated document file.' });
    }

    const docs = await db.query('SELECT * FROM documents WHERE id = ?', [id]);
    const doc = docs[0];
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Tenant Check
    if (!req.user.is_super_admin && doc.organization_id !== req.user.organization_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot edit documents outside your organization.' });
    }

    // Uploader Ownership Check (Strictly original document uploader only can edit/submit revised versions)
    const isUploader = doc.uploaded_by === req.user.id;
    if (!isUploader) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the original document uploader can edit or submit revised versions for this document.'
      });
    }

    // Lock Check
    if (doc.is_locked === 1 || doc.status === 'FINAL_APPROVED') {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'This document has received Final Approval and is locked against modifications.' });
    }

    // Calculate new version index & number
    const latestVersions = await db.query(
      'SELECT version_index FROM document_versions WHERE document_id = ? ORDER BY version_index DESC LIMIT 1',
      [id]
    );
    const lastIndex = latestVersions[0] ? parseFloat(latestVersions[0].version_index) : 1.0;
    const newIndex = parseFloat((lastIndex + 0.1).toFixed(1));
    const newVersionNumber = `V${newIndex}`;

    // Hash calculation
    const filePath = req.file.path;
    const fileHash = await calculateFileHash(filePath);

    // Insert new version (never overwrites previous version records!)
    const verRes = await db.query(
      `INSERT INTO document_versions (document_id, organization_id, version_number, version_index, original_filename, storage_key, file_size, mime_type, file_hash, uploaded_by, change_description, review_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_REVIEW_1')`,
      [id, doc.organization_id, newVersionNumber, newIndex, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype, fileHash, req.user.id, change_description || 'Revision submitted after review comments']
    );

    const newVersionId = verRes.insertId;

    // Update main document status back to PENDING_REVIEW_1
    await db.query(
      `UPDATE documents 
       SET current_version_id = ?, current_version_number = ?, status = 'PENDING_REVIEW_1', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newVersionId, newVersionNumber, id]
    );

    // Notify All Organization Stakeholders (Reviewers, Managers, Uploaders, Super Admin) of revision
    const targetUsers = await db.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.role_id, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE (u.organization_id = ? OR u.organization_id IS NULL OR r.name = 'SUPER_ADMIN')
         AND (r.name IS NULL OR r.name != 'MANAGER_OVERSIGHT')
         AND u.status = 'ACTIVE'`,
      [doc.organization_id]
    );

    const EXCLUDED_NOTIF_EMAILS = ['ayush.k@rahee.com', 'manoj.g@rahee.com', 'arunabha.p@rahee.com'];

    for (const targetUser of targetUsers) {
      if (targetUser.email && EXCLUDED_NOTIF_EMAILS.includes(targetUser.email.toLowerCase())) {
        continue; // Skip Ayush Khaitan, Manoj Ghosh, and Arunabha Pyne
      }

      const isUploader = targetUser.id === req.user.id;
      const notifTitle = isUploader 
        ? `🔄 Revision Submitted (${newVersionNumber})` 
        : `🔄 Document Revision Submitted: ${doc.title}`;
      
      const notifMessage = isUploader
        ? `Your revised version ${newVersionNumber} for document "${doc.title}" has been uploaded successfully.`
        : `Revised version ${newVersionNumber} of document "${doc.title}" was uploaded by ${req.user.name}.`;

      await sendNotification({
        recipientId: targetUser.id,
        senderId: req.user.id,
        documentId: id,
        organizationId: doc.organization_id,
        title: notifTitle,
        message: notifMessage,
        type: 'REVISION_SUBMITTED',
        emailDetails: {
          documentTitle: doc.title,
          documentVersion: newVersionNumber
        }
      });
    }

    await logAudit({
      organization_id: doc.organization_id,
      user_id: req.user.id,
      action: 'VERSION_CREATED',
      document_id: id,
      version: newVersionNumber,
      comment: `Uploaded revised version ${newVersionNumber} (${change_description || 'No comment'}).`,
      req
    });

    return res.status(201).json({
      success: true,
      message: `Revised version ${newVersionNumber} uploaded successfully and resubmitted for review.`,
      versionNumber: newVersionNumber,
      status: 'PENDING_REVIEW_1'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Download Document File
async function downloadDocument(req, res) {
  try {
    const { id } = req.params;
    const versionId = req.query.version_id;

    const docs = await db.query('SELECT * FROM documents WHERE id = ?', [id]);
    const doc = docs[0];
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Final Approval Download Restriction Check
    if (doc.status === 'FINAL_APPROVED' || doc.is_locked === 1) {
      await logAudit({
        organization_id: doc.organization_id,
        user_id: req.user.id,
        action: 'DOWNLOAD_BLOCKED_FINAL_APPROVED',
        comment: `Attempted download of document ID ${id} which is Final Approved and locked.`,
        req
      });
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Downloading is disabled for Final Approved and locked documents.'
      });
    }

    // Strict Tenant Isolation Check
    const isExecAdmin = req.user.role_name === 'RAHEE_EXEC_ADMIN' || req.user.role_id === 3;
    if (!req.user.is_super_admin && !isExecAdmin && parseInt(doc.organization_id) !== parseInt(req.user.organization_id)) {
      await logAudit({
        organization_id: req.user.organization_id,
        action: 'UNAUTHORIZED_DOWNLOAD_ATTEMPT',
        comment: `User attempted to download document ID ${id} across tenant boundary.`,
        req
      });
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot download document belonging to another organization.' });
    }

    // Retrieve requested version or current version
    let versionSql = 'SELECT * FROM document_versions WHERE document_id = ?';
    let params = [id];
    if (versionId) {
      versionSql += ' AND id = ?';
      params.push(versionId);
    } else {
      versionSql += ' ORDER BY id DESC LIMIT 1';
    }

    const versions = await db.query(versionSql, params);
    const versionObj = versions[0];
    if (!versionObj) {
      return res.status(404).json({ success: false, message: 'Requested document version file not found.' });
    }

    const filePath = path.join(uploadDir, versionObj.storage_key);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical document storage file missing from server.' });
    }

    await logAudit({
      organization_id: doc.organization_id,
      user_id: req.user.id,
      action: 'DOCUMENT_DOWNLOADED',
      document_id: doc.id,
      version: versionObj.version_number,
      comment: `Downloaded file '${versionObj.original_filename}'.`,
      req
    });

    res.setHeader('Content-Type', versionObj.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${versionObj.original_filename}"`);
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Preview Document File / Content Stream
async function previewDocument(req, res) {
  try {
    const { id } = req.params;

    const docs = await db.query('SELECT * FROM documents WHERE id = ?', [id]);
    const doc = docs[0];
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const isExecAdmin = req.user.role_name === 'RAHEE_EXEC_ADMIN' || req.user.role_id === 3;
    if (!req.user.is_super_admin && !isExecAdmin && parseInt(doc.organization_id) !== parseInt(req.user.organization_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot preview document belonging to another organization.' });
    }

    const versions = await db.query(
      'SELECT * FROM document_versions WHERE document_id = ? ORDER BY id DESC LIMIT 1',
      [id]
    );
    const versionObj = versions[0];
    if (!versionObj) {
      return res.status(404).json({ success: false, message: 'Document version file not found.' });
    }

    const filePath = path.join(uploadDir, versionObj.storage_key);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical document storage file missing.' });
    }

    await logAudit({
      organization_id: doc.organization_id,
      user_id: req.user.id,
      action: 'DOCUMENT_PREVIEWED',
      document_id: doc.id,
      version: versionObj.version_number,
      comment: `Previewed file '${versionObj.original_filename}'.`,
      req
    });

    const ext = path.extname(versionObj.original_filename).toLowerCase();

    // 1. Render Word (.docx, .doc) files directly into clean, responsive HTML
    if (['.docx', '.doc'].includes(ext) || doc.document_type === 'WORD') {
      try {
        const result = await mammoth.convertToHtml({ path: filePath });
        const htmlContent = result.value || '<p style="color:#64748b;">No text content found in Word document.</p>';
        const styledDoc = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${versionObj.original_filename} - In-Browser Preview</title>
            <style>
              body {
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.7;
                color: #1e293b;
                background-color: #f8fafc;
                margin: 0;
                padding: 30px 15px;
              }
              .doc-paper {
                max-width: 850px;
                margin: 0 auto;
                background: #ffffff;
                padding: 50px 60px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.06);
                border: 1px solid #e2e8f0;
              }
              h1, h2, h3, h4, h5, h6 {
                color: #0f172a;
                font-weight: 700;
                margin-top: 1.4em;
                margin-bottom: 0.5em;
              }
              p { margin-bottom: 1em; }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid #cbd5e1;
                padding: 10px 14px;
                text-align: left;
              }
              th {
                background-color: #f1f5f9;
                font-weight: 600;
              }
              img {
                max-width: 100%;
                height: auto;
                border-radius: 6px;
              }
              blockquote {
                border-left: 4px solid #3b82f6;
                padding-left: 16px;
                color: #475569;
                margin: 16px 0;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            <div class="doc-paper">
              ${htmlContent}
            </div>
          </body>
          </html>
        `;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(styledDoc);
      } catch (wordErr) {
        console.warn('Word HTML conversion failed, serving raw file:', wordErr.message);
      }
    }

    // 2. Render Excel (.xlsx, .xls) spreadsheets directly into HTML Data Tables
    if (['.xlsx', '.xls'].includes(ext) || doc.document_type === 'EXCEL') {
      try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const htmlTable = XLSX.utils.sheet_to_html(worksheet);
        const styledSheet = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${versionObj.original_filename} - Spreadsheet Preview</title>
            <style>
              body {
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 20px;
              }
              .sheet-container {
                background: #ffffff;
                padding: 24px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                border: 1px solid #e2e8f0;
                overflow-x: auto;
              }
              h3 {
                margin-top: 0;
                color: #0f172a;
                font-size: 14px;
                font-weight: 700;
                padding-bottom: 12px;
                border-b: 1px solid #f1f5f9;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                font-size: 13px;
              }
              td, th {
                border: 1px solid #cbd5e1;
                padding: 8px 12px;
                white-space: nowrap;
              }
              tr:nth-child(even) { background-color: #f8fafc; }
              tr:hover { background-color: #f1f5f9; }
            </style>
          </head>
          <body>
            <div class="sheet-container">
              <h3>📊 Sheet View: ${sheetName}</h3>
              ${htmlTable}
            </div>
          </body>
          </html>
        `;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(styledSheet);
      } catch (excelErr) {
        console.warn('Excel HTML conversion failed, serving raw file:', excelErr.message);
      }
    }

    // 3. Render PowerPoint (.pptx, .ppt) slides directly into HTML Slide Deck Presentation
    if (['.pptx', '.ppt'].includes(ext) || doc.document_type === 'POWERPOINT') {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const zip = await JSZip.loadAsync(fileBuffer);
        const slideFiles = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name));
        
        slideFiles.sort((a, b) => {
          const matchA = a.match(/\d+/);
          const matchB = b.match(/\d+/);
          const numA = matchA ? parseInt(matchA[0]) : 0;
          const numB = matchB ? parseInt(matchB[0]) : 0;
          return numA - numB;
        });

        const slideHtmlCards = [];
        for (let i = 0; i < slideFiles.length; i++) {
          const xml = await zip.files[slideFiles[i]].async('text');
          const textMatches = xml.match(/<a:t>(.*?)<\/a:t>/g) || [];
          const texts = textMatches.map(m => m.replace(/<\/?a:t>/g, '').trim()).filter(Boolean);
          
          const titleText = texts[0] || `Slide ${i + 1}`;
          const bodyTexts = texts.slice(1);
          
          slideHtmlCards.push(`
            <div class="slide-card">
              <div class="slide-header">
                <span class="slide-badge">SLIDE ${i + 1}</span>
                <h2 class="slide-title">${titleText}</h2>
              </div>
              <div class="slide-body">
                ${bodyTexts.length > 0 ? `<ul>${bodyTexts.map(t => `<li>${t}</li>`).join('')}</ul>` : '<p class="empty-slide">Graphic / Diagram Slide View</p>'}
              </div>
            </div>
          `);
        }

        const styledDeck = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${versionObj.original_filename} - PowerPoint Presentation</title>
            <style>
              body {
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                background-color: #0f172a;
                color: #f8fafc;
                margin: 0;
                padding: 30px 15px;
              }
              .deck-container {
                max-width: 900px;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                gap: 24px;
              }
              .deck-title-bar {
                background: #1e293b;
                padding: 16px 24px;
                border-radius: 12px;
                border: 1px solid #334155;
                display: flex;
                align-items: center;
                justify-content: space-between;
              }
              .deck-title { margin: 0; font-size: 16px; font-weight: 700; color: #38bdf8; }
              .slide-card {
                background: #1e293b;
                border-radius: 16px;
                padding: 32px 40px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                border: 1px solid #334155;
                min-height: 180px;
              }
              .slide-header {
                display: flex;
                align-items: center;
                gap: 12px;
                border-bottom: 1px solid #334155;
                padding-bottom: 16px;
                margin-bottom: 20px;
              }
              .slide-badge {
                background: #0284c7;
                color: #ffffff;
                font-size: 10px;
                font-weight: 900;
                padding: 4px 10px;
                border-radius: 6px;
                letter-spacing: 1px;
              }
              .slide-title { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; }
              .slide-body { font-size: 14px; color: #cbd5e1; line-height: 1.8; }
              .slide-body ul { margin: 0; padding-left: 20px; }
              .slide-body li { margin-bottom: 8px; }
              .empty-slide { font-style: italic; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="deck-container">
              <div class="deck-title-bar">
                <h1 class="deck-title">📊 PowerPoint Presentation Slide Deck (${slideFiles.length} Slides)</h1>
                <span style="font-size: 12px; color: #94a3b8;">${versionObj.original_filename}</span>
              </div>
              ${slideHtmlCards.length > 0 ? slideHtmlCards.join('') : '<div class="slide-card"><p class="empty-slide">Presentation file loaded.</p></div>'}
            </div>
          </body>
          </html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(styledDeck);
      } catch (pptErr) {
        console.warn('PPTX slide conversion failed, serving raw file:', pptErr.message);
      }
    }

    const mimeTypeMap = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };

    const targetMimeType = mimeTypeMap[ext] || versionObj.mime_type || 'application/octet-stream';

    res.setHeader('Content-Type', targetMimeType);
    res.setHeader('Content-Disposition', `inline; filename="${versionObj.original_filename}"`);
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  uploadNewVersion,
  downloadDocument,
  previewDocument
};
