const db = require('../config/db');
const { MULTI_TENANT_ISOLATION_ENABLED } = require('../config/workflow.config');

async function getDashboardMetrics(req, res) {
  try {
    let tenantCondition = '';
    let params = [];

    if (MULTI_TENANT_ISOLATION_ENABLED && !req.user.is_super_admin) {
      tenantCondition = ' WHERE organization_id = ?';
      params.push(req.user.organization_id);
    } else if (req.query.organization_id) {
      tenantCondition = ' WHERE organization_id = ?';
      params.push(req.query.organization_id);
    }

    // 1. Total Documents
    const totalDocsRes = await db.query(`SELECT COUNT(*) as cnt FROM documents ${tenantCondition}`, params);
    const totalDocuments = totalDocsRes[0] ? (totalDocsRes[0].cnt || totalDocsRes[0]['COUNT(*)']) : 0;

    // 2. Pending Reviews
    const pendingRes = await db.query(
      `SELECT COUNT(*) as cnt FROM documents ${tenantCondition ? tenantCondition + ' AND' : 'WHERE'} status IN ('PENDING_REVIEW_1', 'PENDING_REVIEW_2', 'FINAL_APPROVAL_PENDING')`,
      params
    );
    const pendingReviews = pendingRes[0] ? (pendingRes[0].cnt || pendingRes[0]['COUNT(*)']) : 0;

    // 3. Rejected Documents
    const rejectedRes = await db.query(
      `SELECT COUNT(*) as cnt FROM documents ${tenantCondition ? tenantCondition + ' AND' : 'WHERE'} status = 'REJECTED'`,
      params
    );
    const rejectedDocuments = rejectedRes[0] ? (rejectedRes[0].cnt || rejectedRes[0]['COUNT(*)']) : 0;

    // 4. Final Approved Documents
    const finalApprovedRes = await db.query(
      `SELECT COUNT(*) as cnt FROM documents ${tenantCondition ? tenantCondition + ' AND' : 'WHERE'} status = 'FINAL_APPROVED'`,
      params
    );
    const finalApproved = finalApprovedRes[0] ? (finalApprovedRes[0].cnt || finalApprovedRes[0]['COUNT(*)']) : 0;

    // 5. My Pending Actions Count (tailored to user role)
    let myPendingActions = 0;
    if (['RAHEE_ADMIN_REVIEWER', 'IRCON_ADMIN_REVIEWER', 'REVIEWER_1'].includes(req.user.role_name)) {
      const myPendingRes = await db.query(
        `SELECT COUNT(*) as cnt FROM documents WHERE (organization_id = ? OR organization_id IS NULL) AND status = 'PENDING_REVIEW_1'`,
        [req.user.organization_id]
      );
      myPendingActions = myPendingRes[0] ? (myPendingRes[0].cnt || myPendingRes[0]['COUNT(*)']) : 0;
    } else if (['STEP2_REVIEWER', 'REVIEWER_2'].includes(req.user.role_name)) {
      const myPendingRes = await db.query(
        `SELECT COUNT(*) as cnt FROM documents WHERE (organization_id = ? OR organization_id IS NULL) AND status = 'PENDING_REVIEW_2'`,
        [req.user.organization_id]
      );
      myPendingActions = myPendingRes[0] ? (myPendingRes[0].cnt || myPendingRes[0]['COUNT(*)']) : 0;
    } else if (req.user.role_name === 'FINAL_APPROVER') {
      const myPendingRes = await db.query(
        `SELECT COUNT(*) as cnt FROM documents WHERE (organization_id = ? OR organization_id IS NULL) AND status = 'FINAL_APPROVAL_PENDING'`,
        [req.user.organization_id]
      );
      myPendingActions = myPendingRes[0] ? (myPendingRes[0].cnt || myPendingRes[0]['COUNT(*)']) : 0;
    } else if (req.user.role_name === 'DOCUMENT_UPLOADER') {
      const myPendingRes = await db.query(
        `SELECT COUNT(*) as cnt FROM documents WHERE uploaded_by = ? AND status = 'REJECTED'`,
        [req.user.id]
      );
      myPendingActions = myPendingRes[0] ? (myPendingRes[0].cnt || myPendingRes[0]['COUNT(*)']) : 0;
    } else if (req.user.role_name === 'UPLOAD_USER') {
      const myPendingRes = await db.query(
        `SELECT COUNT(*) as cnt FROM documents WHERE organization_id = ? AND uploaded_by = ? AND status = 'REJECTED'`,
        [req.user.organization_id, req.user.id]
      );
      myPendingActions = myPendingRes[0] ? (myPendingRes[0].cnt || myPendingRes[0]['COUNT(*)']) : 0;
    }

    // 6. Documents Breakdown by Status Chart Data
    const statusChartData = await db.query(
      `SELECT status, COUNT(*) as count FROM documents ${tenantCondition} GROUP BY status`,
      params
    );

    // 7. Documents Breakdown by Document Type
    const categoryChartData = await db.query(
      `SELECT document_type as category, COUNT(*) as count FROM documents ${tenantCondition} GROUP BY document_type`,
      params
    );

    // 8. Recent Audit Activity (Only for users with view_audit_logs permission)
    let recentAuditLogs = [];
    const hasAuditPerm = req.user.is_super_admin || (req.user.permissions && req.user.permissions.includes('view_audit_logs'));
    if (hasAuditPerm) {
      let auditSql = 'SELECT * FROM audit_logs';
      let auditParams = [];
      if (MULTI_TENANT_ISOLATION_ENABLED && !req.user.is_super_admin) {
        auditSql += ' WHERE organization_id = ?';
        auditParams.push(req.user.organization_id);
      }
      auditSql += ' ORDER BY id DESC LIMIT 5';
      recentAuditLogs = await db.query(auditSql, auditParams);
    }

    return res.json({
      success: true,
      metrics: {
        totalDocuments,
        pendingReviews,
        rejectedDocuments,
        finalApproved,
        myPendingActions
      },
      charts: {
        statusBreakdown: statusChartData,
        categoryBreakdown: categoryChartData
      },
      recentAuditLogs
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getDashboardMetrics };
