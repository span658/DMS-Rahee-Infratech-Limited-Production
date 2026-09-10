const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');

router.use(authenticateToken);

router.get('/', requirePermission('view_audit_logs'), auditController.getAuditLogs);

module.exports = router;
