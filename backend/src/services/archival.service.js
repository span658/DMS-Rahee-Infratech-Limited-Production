const db = require('../config/db');
const { logAudit } = require('./audit.service');
const { sendNotification } = require('./notification.service');
const { ARCHIVAL_POLICY_ENABLED, OPERATIONAL_FOLDER_ENABLED } = require('../config/workflow.config');

// Check if a folder or any of its parent folders are marked as Operational (prevent archival)
async function isFolderOrAncestorsOperational(folderId) {
  if (!OPERATIONAL_FOLDER_ENABLED || !folderId) return false;

  let currentId = folderId;
  const visited = new Set();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const rows = await db.query('SELECT id, parent_id, is_operational FROM folders WHERE id = ?', [currentId]);
    if (!rows || rows.length === 0) break;

    const folder = rows[0];
    if (folder.is_operational === 1 || folder.is_operational === true) {
      return true;
    }
    currentId = folder.parent_id;
  }

  return false;
}

// Run Archival Policy: Archive documents (manual bulk trigger or 7-day scanner)
async function runArchivalPolicy(forceManual = false, targetFolderId = null) {
  try {
    if (!ARCHIVAL_POLICY_ENABLED && !forceManual) {
      return { success: true, archivedCount: 0, archivedDocTitles: [], message: 'Archival policy scanner inactive.' };
    }

    console.log(`[Archival Policy] Executing archival check (Manual Trigger: ${forceManual ? 'YES' : 'NO'})...`);

    // Fetch active non-archived documents
    let sql = `
      SELECT id, organization_id, uploaded_by, title, status, folder_id, created_at
      FROM documents
      WHERE status != 'ARCHIVED'
    `;
    let params = [];

    if (targetFolderId) {
      sql += ' AND folder_id = ?';
      params.push(parseInt(targetFolderId));
    }

    const unapprovedDocs = await db.query(sql, params);

    const now = new Date();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    let archivedCount = 0;
    const archivedDocTitles = [];

    for (const doc of unapprovedDocs) {
      const createdAt = new Date(doc.created_at);
      const ageMs = now.getTime() - createdAt.getTime();

      // If manual trigger by Super Admin OR doc age >= 7 days
      if (forceManual || ageMs >= SEVEN_DAYS_MS) {
        // Check if document is stored in an operational folder (or subfolder of an operational folder)
        const isOperational = await isFolderOrAncestorsOperational(doc.folder_id);

        if (isOperational && !forceManual) {
          console.log(`[Archival Policy] Document ID ${doc.id} ('${doc.title}') is exempt because it is in an Operational Folder.`);
          continue;
        }

        // Archive the document
        await db.query("UPDATE documents SET status = 'ARCHIVED', is_locked = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [doc.id]);
        archivedCount++;
        archivedDocTitles.push(doc.title);

        // Record Audit Log
        await logAudit({
          organization_id: doc.organization_id,
          user_id: doc.uploaded_by,
          action: forceManual ? 'DOCUMENT_ARCHIVED' : 'DOCUMENT_ARCHIVED_AUTOMATIC',
          document_id: doc.id,
          comment: `Document '${doc.title}' (ID: ${doc.id}) moved to Archive via ${forceManual ? 'Bikramshila Manual Archival Policy trigger' : '7-day automated scanner'}.`
        });

        // Notify Document Uploader
        try {
          await sendNotification({
            recipientId: doc.uploaded_by,
            documentId: doc.id,
            organizationId: doc.organization_id,
            title: '📦 Document Archived',
            message: `Your document "${doc.title}" has been moved to Archive by system administrator policy.`,
            type: 'DOCUMENT_ARCHIVED'
          });
        } catch (notifErr) {
          console.warn(`[Archival Policy] Could not send notification for doc ${doc.id}:`, notifErr.message);
        }
      }
    }

    console.log(`[Archival Policy] Completed check. Archived ${archivedCount} document(s).`);
    return {
      success: true,
      archivedCount,
      archivedDocTitles
    };
  } catch (err) {
    console.error('[Archival Policy Error]:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  runArchivalPolicy,
  isFolderOrAncestorsOperational
};
