const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');

router.use(authenticateToken);

router.get('/', tenantController.getOrganizations);
router.post('/', requirePermission('manage_users'), tenantController.createOrganization);
router.patch('/:id/status', requirePermission('manage_users'), tenantController.updateOrganizationStatus);

module.exports = router;
