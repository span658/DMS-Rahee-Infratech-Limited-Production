-- ============================================================================
-- Enterprise Document Management System (EDMS) - Master Database Schema & Seed
-- Target Engine: MySQL 5.7+ / 8.0+
-- Scope: Rahee Infratech Limited (Company 1) & Ircon International Limited (Company 2)
-- Architecture: Unified Bikramshila Directory Hierarchy & Enterprise RBAC Governance
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- Clean Reset: Drop Existing Database & Tables for Fresh Deployment
-- ----------------------------------------------------------------------------
DROP DATABASE IF EXISTS `enterprise_dms`;
CREATE DATABASE `enterprise_dms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `enterprise_dms`;

-- ----------------------------------------------------------------------------
-- 1. ORGANIZATIONS (Multi-Company Tenancy)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 2. ROLES (RBAC Groups)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 3. PERMISSIONS (Granular Security Keys)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 4. ROLE_PERMISSIONS (Role-to-Permission Mapping)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `role_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 5. USERS (Company Stakeholders & Governance Accounts)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `designation` VARCHAR(100) DEFAULT 'Manager',
  `document_capability` VARCHAR(50) DEFAULT 'Viewer',
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `failed_login_attempts` INT DEFAULT 0,
  `lockout_until` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_org` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 6. FOLDERS (Bikramshila Central Directory & Company Branches)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `folders`;
CREATE TABLE `folders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `parent_id` INT DEFAULT NULL,
  `is_operational` TINYINT DEFAULT 0,
  `created_by` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_folders_parent` (`parent_id`),
  INDEX `idx_folders_org` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 7. FOLDER_PERMISSIONS (Folder Level Access Control)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `folder_permissions`;
CREATE TABLE `folder_permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `folder_id` INT NOT NULL,
  `role_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `permission_level` VARCHAR(50) NOT NULL DEFAULT 'READ',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 8. DOCUMENTS (Core Document Metadata)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL,
  `uploaded_by` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100) DEFAULT 'General',
  `document_type` VARCHAR(50) DEFAULT 'PDF',
  `status` VARCHAR(50) NOT NULL DEFAULT 'FINAL_APPROVED',
  `current_version_id` INT DEFAULT NULL,
  `current_version_number` VARCHAR(50) DEFAULT 'General Version V1',
  `is_locked` TINYINT DEFAULT 0,
  `folder_id` INT DEFAULT NULL,
  `approval_cycle` INT DEFAULT 1,
  `parent_document_id` INT DEFAULT NULL,
  `is_archived` TINYINT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE SET NULL,
  INDEX `idx_docs_org` (`organization_id`),
  INDEX `idx_docs_folder` (`folder_id`),
  INDEX `idx_docs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 9. DOCUMENT_VERSIONS (File Storage, Hashes & Revisions)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `document_versions`;
CREATE TABLE `document_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `organization_id` INT DEFAULT NULL,
  `version_number` VARCHAR(50) NOT NULL,
  `version_index` DECIMAL(4,1) DEFAULT 1.0,
  `storage_key` VARCHAR(255) NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `file_hash` VARCHAR(64) DEFAULT NULL,
  `review_status` VARCHAR(50) DEFAULT 'FINAL_APPROVED',
  `uploaded_by` INT NOT NULL,
  `change_description` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_versions_doc` (`document_id`),
  INDEX `idx_versions_org` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 10. DOCUMENT_REVIEWS (Approval Workflows & Audit Log of Reviews)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `document_reviews`;
CREATE TABLE `document_reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `document_version_id` INT NOT NULL,
  `reviewer_id` INT NOT NULL,
  `stage` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `comments` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`document_version_id`) REFERENCES `document_versions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 11. AUDIT_LOGS (Immutable Security & User Activity Audit Trail)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `user_email` VARCHAR(255) DEFAULT NULL,
  `user_name` VARCHAR(255) DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `document_id` INT DEFAULT NULL,
  `version` VARCHAR(50) DEFAULT NULL,
  `comment` TEXT,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `user_agent` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 12. NOTIFICATIONS (In-App Notification Inbox)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT DEFAULT NULL,
  `recipient_id` INT NOT NULL,
  `sender_id` INT DEFAULT NULL,
  `document_id` INT DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `is_read` TINYINT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL,
  INDEX `idx_notifications_recipient` (`recipient_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 13. EMAIL_LOGS (Outbox & Email Transmission History)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `email_logs`;
CREATE TABLE `email_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `recipient_email` VARCHAR(255) NOT NULL,
  `recipient_name` VARCHAR(255) DEFAULT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `document_title` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'SENT',
  `error_message` TEXT,
  `body_html` LONGTEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email_recipient` (`recipient_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================================
-- MASTER DATA SEEDING (100% Matching Official Specifications)
-- ============================================================================

-- 1. Organizations
INSERT INTO `organizations` (`id`, `name`, `code`, `status`) VALUES
(1, 'Rahee Infratech Limited', 'RAHEE', 'ACTIVE'),
(2, 'Ircon International Limited', 'IRCON', 'ACTIVE');

-- 2. Roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'SUPER_ADMIN', 'Global Super Administrator dedicated to User Creation & System Governance'),
(2, 'RAHEE_ADMIN_REVIEWER', 'Rahee Company Admin (Rahul Dey) - Upload & Folder Control'),
(3, 'RAHEE_EXEC_ADMIN', 'Executive Cross-Company Governance'),
(4, 'STEP2_REVIEWER', 'Workflow Reviewer'),
(5, 'FINAL_APPROVER', 'Final Approver'),
(6, 'MANAGER_OVERSIGHT', 'Departmental Manager Oversight, Cross-Company Viewer & Reports'),
(7, 'DOCUMENT_UPLOADER', 'Document Uploader & Execution Control (Somnath Mondal)'),
(8, 'IRCON_ADMIN_REVIEWER', 'Ircon Company Admin (Om Jha) - Upload & Folder Control');

-- 3. Permissions
INSERT INTO `permissions` (`id`, `code`, `description`) VALUES
(1, 'upload', 'Upload documents under authorized branch'),
(2, 'view', 'Search and view document listings across companies'),
(3, 'preview', 'Preview document file and CAD models in-browser'),
(4, 'edit', 'Edit metadata and upload revised versions'),
(5, 'download', 'Download original binary files'),
(6, 'manage_users', 'Create and manage user accounts (Super Admin)'),
(7, 'view_audit_logs', 'View system audit trail logs'),
(8, 'view_reports', 'Access analytics reports and metrics'),
(9, 'manage_folders', 'Create folders and manage permissions');

-- 4. Role Permissions Mapping
-- Super Admin: Full Governance, User Management, Audit Logs, Reports, Folders, View & Download (No Upload)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9);

-- Rahee Admin (Rahul Dey): Upload, View, Preview, Download, Edit, Manage Folders, Audit, Reports
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 7), (2, 8), (2, 9);

-- Ircon Admin (Om Jha): Upload, View, Preview, Download, Edit, Manage Folders, Audit, Reports
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(8, 1), (8, 2), (8, 3), (8, 4), (8, 5), (8, 7), (8, 8), (8, 9);

-- Document Uploader / Execution Control (Somnath Mondal): Upload, View, Preview, Download, Edit, Reports
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(7, 1), (7, 2), (7, 3), (7, 4), (7, 5), (7, 7), (7, 8);

-- Manager / Viewer Roles (All have View, Preview, Download, Reports, Audit):
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(6, 2), (6, 3), (6, 5), (6, 7), (6, 8);

-- 5. Bikramshila Central Directory Hierarchy
INSERT INTO `folders` (`id`, `organization_id`, `name`, `description`, `parent_id`, `is_operational`, `created_by`) VALUES
(1, 1, 'Bikramshila', 'Central Primary Root Directory for all Infrastructure & Engineering Documents', NULL, 0, 1),
(2, 1, 'RAHEE', 'Rahee Infratech Limited Branch Directory', 1, 0, 1),
(3, 2, 'IRCON', 'Ircon International Limited Branch Directory', 1, 0, 1);

-- 6. Users (Official Team Specification & Individual Passwords)
INSERT INTO `users` (`id`, `organization_id`, `name`, `email`, `password_hash`, `role_id`, `designation`, `document_capability`, `status`) VALUES
(1, NULL, 'Global System Administrator', 'superadmin@enterprise-dms.com', '$2b$10$2g.9P1NbatANOLQ9kDtAeuAmF3fuu0XUi7sdlVAEHjjas/MmvtWZ.', 1, 'Super Admin', 'Viewer', 'ACTIVE'),
(11, NULL, 'Rajib Ghosh', 'rajib.g@rahee.com', '$2b$10$miF9TMy0rbVTwltjqVwy2eDooyZjNRb9VkvwihwMhm91RFuL3.moO', 1, 'Super Admin', 'Viewer', 'ACTIVE'),
(5, 1, 'Rahul Dey', 'rahul.d@rahee.com', '$2b$10$74/3B9jH7Ljb5MyMC9y9i.oWe.bTAK8CbhxasGhC1fWZINj7WmfY2', 2, 'Admin', 'Upload', 'ACTIVE'),
(6, 1, 'Kiran Sankar Chowdhury', 'kiransankar.c@rahee.com', '$2b$10$YUeLbm7J9vvZQm0icnfWCeWDoDwg.ER/3IXm2wKeJOc8rxs5WPi4G', 6, 'Manager', 'Viewer', 'ACTIVE'),
(7, 1, 'Mukesh Kumar Prasad', 'mukesh.p@rahee.com', '$2b$10$WD5fujW/vF1F36X24acepuAVN5jH7XURmtQz1k4yfMxs3NBjzoxCa', 6, 'Manager', 'Viewer', 'ACTIVE'),
(8, 1, 'Pintu Bhukta', 'pintu.b@rahee.com', '$2b$10$PrY8Aq/e69aCUpH4E4ssiO1Iu9e1sgVFZyIwfipw15Z9sV/rFB5sm', 6, 'Manager', 'Viewer', 'ACTIVE'),
(9, 1, 'Somnath Mondal', 's.mondal@rahee.com', '$2b$10$n3EnDfZgKomPdzf5LET8zef//dW9gcKv1i0Rn6KMMt6rfBh6.JLGG', 7, 'Execution Control', 'Upload', 'ACTIVE'),
(12, 1, 'Ayush Khaitan', 'ayush.k@rahee.com', '$2b$10$r7zOR25tGGc9imxBxCZLRu/lDbvWW54UMNjG8IcXB7chuDEKJtT3O', 6, 'Manager', 'Viewer', 'ACTIVE'),
(13, 1, 'Manoj Ghosh', 'manoj.g@rahee.com', '$2b$10$WMdqcmy3pbPlRkoiJH3NTe88kMv3e8pbraN.nF6sONhr6KDljMXhG', 6, 'Manager', 'Viewer', 'ACTIVE'),
(14, 1, 'Arunabha Pyne', 'arunabha.p@rahee.com', '$2b$10$KCLAUyV.l1K0qx2TQI1z7OC8tTN/DPFQtEnaetOZEQFm5FEHZLBYG', 6, 'Manager', 'Viewer', 'ACTIVE'),
(16, 1, 'Manish Kumar Patra', 'manish.p@rahee.com', '$2b$10$kpxW547CmLN3ZP4/kwVS8.d/P5rW25A1GgLI7XKeCKrwazbrELUya', 6, 'Viewer', 'Viewer', 'ACTIVE'),
(10, 2, 'Om Jha', 'om.jha@ircon.org', '$2b$10$zbNoJ0iJBpg/QoRgVvTbCeVI.MaztS19trMRGCMRcJ1mJkmrHWnde', 8, 'Admin', 'Upload', 'ACTIVE'),
(2, 2, 'Shardu Kumar Rastogi', 'shardu.rastogi@ircon.org', '$2b$10$cRyqTNedO3HJzwYtnLRspu7nKrwzkE/Nm1LnKzENyDWtf.ipkNNZq', 6, 'Execution Control', 'Viewer', 'ACTIVE'),
(3, 2, 'Chandra Bijay Singh', 'chandra.singh@ircon.org', '$2b$10$l7xFG0Ts8P3ouyaa7qEfeOKicRaEJ9p5XKzkukKyymX9Mb42H.r6K', 6, 'Review', 'Viewer', 'ACTIVE');

SET FOREIGN_KEY_CHECKS = 1;
