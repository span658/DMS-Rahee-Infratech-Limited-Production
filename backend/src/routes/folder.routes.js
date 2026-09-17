const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folder.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { enforceTenantIsolation } = require('../middleware/tenant.middleware');
const { requirePermission } = require('../middleware/permission.middleware');

router.use(authenticateToken);
router.use(enforceTenantIsolation);

router.get('/', folderController.getFolders);
router.post('/', requirePermission('manage_folders', 'view'), folderController.createFolder);
router.put('/:id', requirePermission('manage_folders', 'view'), folderController.updateFolder);
router.get('/:id/permissions', requirePermission('manage_folders', 'view'), folderController.getFolderPermissions);
router.post('/:id/permissions', requirePermission('manage_folders', 'view'), folderController.updateFolderPermissions);
router.delete('/:id', requirePermission('manage_folders', 'view'), folderController.deleteFolder);

module.exports = router;
