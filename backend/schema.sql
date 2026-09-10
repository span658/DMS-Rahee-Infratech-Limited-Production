-- ============================================================================
-- Company Document Management System (DMS) - Production Database Schema & Seed
-- Target Engine: MySQL 5.7+ / 8.0+ / SQLite 3.x
-- Scope: Rahee Infratech Limited (Company 1) & Ircon International Limited (Company 2)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Clean Reset: Drop Existing Database & Tables for Re-execution in MySQL Workbench

DROP DATABASE IF EXISTS `enterprise_dms`;
CREATE DATABASE `enterprise_dms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `enterprise_dms`;

-- ----------------------------------------------------------------------------
-- 1. ORGANIZATIONS (Multi-Tenant Scope)
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
-- 2. ROLES
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 3. PERMISSIONS (RBAC Keys)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  
  `description` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 4. ROLE_PERMISSIONS (Permission Mapping Table)
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
-- 5. USERS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `failed_login_attempts` INT DEFAULT 0,
  `lockout_until` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 6. DOCUMENTS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL,
  `uploaded_by` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100) DEFAULT 'General',
  `document_type` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW_1',
  `current_version_id` INT DEFAULT NULL,
  `current_version_number` VARCHAR(20) DEFAULT 'V1',
  `is_locked` TINYINT DEFAULT 0,
  `folder_id` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 7. DOCUMENT_VERSIONS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `document_versions`;
CREATE TABLE `document_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `organization_id` INT NOT NULL,
  `version_number` VARCHAR(50) NOT NULL,
  `version_index` DOUBLE NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `storage_key` VARCHAR(255) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `file_hash` VARCHAR(100) NOT NULL,
  `uploaded_by` INT NOT NULL,
  `change_description` TEXT,
  `review_status` VARCHAR(50) DEFAULT 'PENDING',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 8. DOCUMENT_REVIEWS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `document_reviews`;
CREATE TABLE `document_reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `document_version_id` INT NOT NULL,
  `organization_id` INT NOT NULL,
  `reviewer_id` INT NOT NULL,
  `reviewer_role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `comments` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`document_version_id`) REFERENCES `document_versions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 9. NOTIFICATIONS
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
  FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 10. EMAIL_LOGS (Outbox & Live Email Monitor Log)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `email_logs`;
CREATE TABLE `email_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `recipient_email` VARCHAR(255) NOT NULL,
  `recipient_name` VARCHAR(255) DEFAULT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_html` TEXT NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `document_title` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'SENT',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 11. AUDIT_LOGS (Append-Only Security Audit Trail)
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
  `comment` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(100) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 12. FOLDERS (Tenant Document Organization Directories)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `folders`;
CREATE TABLE `folders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `parent_id` INT DEFAULT NULL,
  `created_by` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- SEED DATA INSERTION
-- ============================================================================

-- 1. Insert System Roles matching Master User Matrix Requirements
-- NOTIFICATION MATRIX RULES:
-- - Document Uploader (Om Jha): Receives ALL notifications (Upload, Stage 1/2 Approvals/Rejections, Final Approval)
-- - Stage 1 Reviewer (Rahul Dey): Receives Stage 1 Review alerts, Stage 2 Rejections, Final Approvals
-- - Stage 2 Reviewer (Kiran Sankar Chowdhury): Receives Stage 1 Approvals, Stage 2 Review alerts, Stage 2 Rejections
-- - Final Approver (Manoj Ghosh): Receives notification ONLY when BOTH Reviewer 1 & Reviewer 2 approve with comments (FINAL_APPROVAL_PENDING)
-- - Departmental Managers (Mukesh Prasad, Pintu Bhukta, Somenath Mondal): Receive ONLY initial NEW_DOCUMENT_UPLOADED notifications
-- - Excluded Managers (Ayush Khaitan, Arunabha Pyne): Receive 0 notifications across all workflow stages
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'SUPER_ADMIN', 'Global Super Administrator dedicated to User Management & Governance (Restricted from Document Upload / Revision Editing)'),
(2, 'RAHEE_ADMIN_REVIEWER', 'Company 1 Admin & Step 1 Reviewer (Rahul Dey)'),
(3, 'RAHEE_EXEC_ADMIN', 'Company 1 Executive Admin & User Manager (Rajib Ghosh)'),
(4, 'STEP2_REVIEWER', 'Step 2 Workflow Reviewer (Kiran Sankar Chowdhury)'),
(5, 'FINAL_APPROVER', 'Step 3 Final Document Approver (Manoj Ghosh)'),
(6, 'MANAGER_OVERSIGHT', 'Departmental Manager Oversight & Reports (Mukesh Prasad, Pintu Bhukta, Somenath Mondal, Ayush Khaitan, Arunabha Pyne)'),
(7, 'DOCUMENT_UPLOADER', 'Document Uploader & Revision Submitter (Om Jha)'),
(8, 'IRCON_ADMIN_REVIEWER', 'Company 2 Admin & Step 1 Reviewer (Shardu Kumar Rastogi)');

-- 2. Insert System Permission Keys (RBAC)
INSERT INTO `permissions` (`id`, `code`, `description`) VALUES
(1, 'upload', 'Allows uploading new Microsoft Word, PDF, Excel, PPTX, and Image files'),
(2, 'view', 'Access to document search, metadata, and directory listings'),
(3, 'preview', 'Allows opening and previewing documents in browser streams'),
(4, 'edit', 'Allows updating document metadata and uploading revised versions'),
(5, 'download', 'Allows downloading original binary files to local disk'),
(6, 'approve_reject', 'Allows intermediate step approvals or rejections in workflow'),
(7, 'final_approve', 'Grants Step 3 Final Approver status to publish documents into APPROVED state'),
(8, 'manage_users', 'Grants ability to create/edit user accounts and assign permissions'),
(9, 'view_audit_logs', 'Access to system-wide security audit trail logs'),
(10, 'view_reports', 'Access to storage breakdown, employee metrics, and workflow reports'),
(11, 'manage_folders', 'Allows creating and managing tenant document folders');

-- 3. Insert Role-Permissions Mappings
-- Role 1 (SUPER_ADMIN): User Management, Governance, View, Preview, Download, Audit Logs, Reports, Folder Management
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 2), (1, 3), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11),

-- Role 2 (RAHEE_ADMIN_REVIEWER - Rahul Dey): view, preview, edit, download, approve_reject, view_audit_logs, view_reports, manage_folders
(2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 9), (2, 10), (2, 11),

-- Role 3 (RAHEE_EXEC_ADMIN - Rajib Ghosh): upload, view, preview, edit, download, approve_reject, manage_users, view_audit_logs, view_reports, manage_folders
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 8), (3, 9), (3, 10), (3, 11),

-- Role 4 (STEP2_REVIEWER - Kiran Sankar Chowdhury): view, preview, edit, download, approve_reject, view_audit_logs, view_reports
(4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 9), (4, 10),

-- Role 5 (FINAL_APPROVER - Manoj Ghosh): view, preview, download, approve_reject, final_approve
(5, 2), (5, 3), (5, 5), (5, 6), (5, 7),

-- Role 6 (MANAGER_OVERSIGHT - Mukesh Prasad, Pintu Bhukta, Somenath Mondal, Ayush Khaitan, Arunabha Pyne): view, preview, edit, download, view_audit_logs, view_reports
(6, 2), (6, 3), (6, 4), (6, 5), (6, 9), (6, 10),

-- Role 7 (DOCUMENT_UPLOADER - Om Jha, Chandra Bijay Singh): upload, view, preview, edit, download (STRICTLY EXCLUDED from manage_folders)
(7, 1), (7, 2), (7, 3), (7, 4), (7, 5),

-- Role 8 (IRCON_ADMIN_REVIEWER - Shardu Kumar Rastogi): view, preview, download, approve_reject, view_audit_logs, view_reports, manage_folders
(8, 2), (8, 3), (8, 5), (8, 6), (8, 9), (8, 10), (8, 11);

-- 4. Insert Organizations
INSERT INTO `organizations` (`id`, `name`, `code`, `status`) VALUES
(1, 'Rahee Infratech Limited', 'RAHEE', 'ACTIVE'),
(2, 'Ircon International Limited', 'IRCON', 'ACTIVE');

-- 5. Insert Master Users with Bcrypt Hashed Standard Professional Passwords
-- Passwords Hashed with bcrypt (Salt factor 10):
-- Rahul Dey: R@hul#Dey2026 (ID 5, Role 2)
-- Rajib Ghosh: R@jib#Ghosh2026 (ID 11, Role 3)
-- Kiran Sankar Chowdhury: K1ran#Sankar2026 (ID 6, Role 4)
-- Manoj Ghosh: M@noj#Ghosh2026 (ID 13, Role 5)
-- Mukesh Kumar Prasad: M@kesh#Prasad2026 (ID 7, Role 6)
-- Pintu Bhukta: P1ntu#Bhukta2026 (ID 8, Role 6)
-- Somenath Mondal: S@menath#Mondal2026 (ID 9, Role 6)
-- Ayush Khaitan: Ayu$h#Khaitan2026 (ID 12, Role 6)
-- Arunabha Pyne: Arun#Pyne2026 (ID 14, Role 6)
-- Om Jha: Om#Jha2026 (ID 10, Role 7: upload, view, preview, edit, download)
-- Shardu Kumar Rastogi: Sh@rdu#Rastogi2026 (ID 2, Role 8)
-- Chandra Bijay Singh: Ch@ndra#Singh2026 (ID 3, Role 7: upload, view, preview, edit, download)

INSERT INTO `users` (`id`, `organization_id`, `name`, `email`, `password_hash`, `role_id`, `status`) VALUES
(1, NULL, 'Global System Administrator', 'superadmin@enterprise-dms.com', '$2b$10$FF4BA6QYhBaNi6LjkrEQdevYpsd1wRpkyb4lmVPqFhJDWCTfiO4a.', 1, 'ACTIVE'),
(5, 1, 'Rahul Dey', 'rahul.d@rahee.com', '$2b$10$q9PiUOS1l57C9k7Jb4SLPuJAXyRDg47JlGhf8wvd4RhzHP/AmGYSu', 2, 'ACTIVE'),
(11, NULL, 'Rajib Ghosh', 'rajib.g@rahee.com', '$2b$10$mYS9NUXnarjW178pXbCk8Om6fQCmQPgaaCSAJGx8MzVkDu3CWKEeq', 1, 'ACTIVE'),
(6, 1, 'Kiran Sankar Chowdhury', 'kiransankar.c@rahee.com', '$2b$10$ENdoIKss08l.Mez1TSTt0OXhCC88lmGSPjcuSIVWyf5EyArJw.Dam', 4, 'ACTIVE'),
(13, 1, 'Manoj Ghosh', 'manoj.g@rahee.com', '$2b$10$d/Q0AO3V.1.wli8B/JN1vuCtaUcOO/bvi1Jax8k9JdUpUDRG6kDQm', 5, 'ACTIVE'),
(7, 1, 'Mukesh Kumar Prasad', 'mukesh.p@rahee.com', '$2b$10$rL/e5CIaNpwkoGxQVw3mg.TF53GS4PsyZKtIlcfbkiAF0Iyx0KCqC', 6, 'ACTIVE'),
(8, 1, 'Pintu Bhukta', 'pintu.b@rahee.com', '$2b$10$zKXB0./MaOCO0cfsGJnrI.w/oYCdCFLvVsU9JEIXgSDzUuIMcvlDa', 6, 'ACTIVE'),
(9, 1, 'Somenath Mondal', 's.mondal@rahee.com', '$2b$10$tCLIPGZggpfmu0mUNzeL2eUQXoUeDAL3mk7hL2Hea7HXNXsRnXcE6', 6, 'ACTIVE'),
(12, 1, 'Ayush Khaitan', 'ayush.k@rahee.com', '$2b$10$9ZkI/yMjvgzt.RoB/Ylv1.cY6ch0sdwjXN59ZaCdaB/sFqmU2e.I6', 6, 'ACTIVE'),
(14, 1, 'Arunabha Pyne', 'arunabha.p@rahee.com', '$2b$10$/mmbLP5vfnhmpdjWMLRMUORH3LiXklJEXzLlU1Sgs4eghSWUaG2Ny', 6, 'ACTIVE'),
(10, 1, 'Om Jha', 'om.jha@rahee.com', '$2b$10$UVp8VUnrsQmtOLJ35FQiJeaQJK.XPHZs6ZfqdcRCE8yAp09uak2Qe', 7, 'ACTIVE'),
(2, 2, 'Shardu Kumar Rastogi', 'shardu.rastogi@ircon.org', '$2b$10$E06H1hNYHFpNscLtHDFm6u5Xa3/PfOilfDUf4wTgWaXdKnMtQPZnO', 8, 'ACTIVE'),
(3, 2, 'Chandra Bijay Singh', 'chandra.singh@ircon.org', '$2b$10$EopJDrDaS1q6AcFnKtuVL.bTKltEbpihoN36sVqxH5lQPpnDU05X.', 7, 'ACTIVE');

-- 6. Insert System Audit Log Initialization Entry
INSERT INTO `audit_logs` (`organization_id`, `user_id`, `user_email`, `user_name`, `action`, `comment`, `ip_address`) VALUES
(NULL, 1, 'superadmin@enterprise-dms.com', 'Global System Administrator', 'SYSTEM_INITIALIZATION', 'Enterprise DMS database schema initialized with Master RBAC specifications.', '127.0.0.1');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END OF SCHEMA FILE
-- ============================================================================
