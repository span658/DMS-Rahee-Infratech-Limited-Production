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
  `allow_final_download` INT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. ROLES (RBAC Groups)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. PERMISSIONS (Granular Security Keys)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  INDEX `idx_users_org` (`organization_id`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  INDEX `idx_folders_org` (`organization_id`),
  INDEX `idx_folders_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. FOLDER_PERMISSIONS (Access Control for Folders & Subfolders)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `folder_permissions`;
CREATE TABLE `folder_permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `folder_id` INT NOT NULL,
  `role_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `permission_level` VARCHAR(50) NOT NULL DEFAULT 'FULL_CONTROL',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. DOCUMENTS (Central Document Records)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL,
  `folder_id` INT DEFAULT NULL,
  `uploaded_by` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100) DEFAULT 'General',
  `document_type` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW_1',
  `current_version_id` INT DEFAULT NULL,
  `current_version_number` VARCHAR(20) DEFAULT 'V1',
  `is_locked` INT DEFAULT 0,
  `is_archived` INT DEFAULT 0,
  `approval_cycle` INT DEFAULT 1,
  `parent_document_id` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`),
  INDEX `idx_documents_org` (`organization_id`),
  INDEX `idx_documents_folder` (`folder_id`),
  INDEX `idx_documents_status` (`status`),
  INDEX `idx_documents_type` (`document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. DOCUMENT_VERSIONS (Version Control & File Asset Storage)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `document_versions`;
CREATE TABLE `document_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `organization_id` INT NOT NULL,
  `version_number` VARCHAR(50) NOT NULL,
  `version_index` DOUBLE NOT NULL DEFAULT 1.0,
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
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`),
  INDEX `idx_versions_doc` (`document_id`),
  INDEX `idx_versions_storage` (`storage_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. DOCUMENT_REVIEWS (Multi-Stage Workflow Audit Trails)
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
  FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`),
  INDEX `idx_reviews_doc` (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. NOTIFICATIONS (In-App Stakeholder Alerts)
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
  `is_read` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_notifications_recipient` (`recipient_id`),
  INDEX `idx_notifications_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. AUDIT_LOGS (Immutable System Activity Logs)
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
  `ip_address` VARCHAR(100) DEFAULT NULL,
  `user_agent` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_doc` (`document_id`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. EMAIL_LOGS (Outbox Delivery Activity Tracking)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MASTER DATA SEEDING (100% Complete & Official Specifications)
-- ============================================================================

-- 1. Organizations
INSERT INTO `organizations` (`id`, `name`, `code`, `status`, `allow_final_download`) VALUES
(1, 'Rahee Infratech Limited', 'RAHEE', 'ACTIVE', 1),
(2, 'Ircon International Limited', 'IRCON', 'ACTIVE', 1);

-- 2. Roles (5 Active System Roles)
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'SUPER_ADMIN', 'Global Super Administrator dedicated to User Creation, Governance & Archival Control'),
(2, 'RAHEE_ADMIN', 'Rahee Company Admin (Rahul Dey) - Folder Management & Document Upload'),
(6, 'MANAGER_OVERSIGHT', 'Departmental Manager Oversight, Cross-Company Viewer, Reports & Audit Logs'),
(7, 'DOCUMENT_UPLOADER', 'Document Uploader & Execution Control (Somnath Mondal)'),
(8, 'IRCON_ADMIN', 'Ircon Company Admin (Om Jha) - Folder Management & Document Upload');

-- 3. Permissions
INSERT INTO `permissions` (`id`, `code`, `description`) VALUES
(1, 'upload', 'Upload documents under authorized branch directory'),
(2, 'view', 'Search and view document listings across companies'),
(3, 'preview', 'Preview document file and CAD models in-browser'),
(4, 'edit', 'Edit metadata and upload revised versions'),
(5, 'download', 'Download original binary files to local storage'),
(6, 'manage_users', 'Create, manage, and assign user accounts (Super Admin only)'),
(7, 'view_audit_logs', 'View immutable security audit trail logs'),
(8, 'view_reports', 'Access storage analytics, metrics, and workflow reports'),
(9, 'manage_folders', 'Create subfolders and manage branch permissions');

-- 4. Role Permissions Mapping
-- Super Admin (Rajib Ghosh): Viewer & Governance Authority (View, Preview, Download, Manage Users, Audit Logs, Reports, Manage Folders - Upload Disabled)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 2), (1, 3), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9);

-- Rahee Admin (Rahul Dey): Upload, View, Preview, Edit, Download, Audit Logs, Reports, Manage Folders
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 7), (2, 8), (2, 9);

-- Ircon Admin (Om Jha): Upload, View, Preview, Edit, Download, Audit Logs, Reports, Manage Folders
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(8, 1), (8, 2), (8, 3), (8, 4), (8, 5), (8, 7), (8, 8), (8, 9);

-- Document Uploader (Somnath Mondal): Upload, View, Preview, Edit, Download, Audit Logs, Reports
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(7, 1), (7, 2), (7, 3), (7, 4), (7, 5), (7, 7), (7, 8);

-- Manager / Oversight / Viewers (Kiran, Mukesh, Pintu, Ayush, Manoj, Arunabha, Manish, Shardu, Chandra):
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(6, 2), (6, 3), (6, 4), (6, 5), (6, 7), (6, 8);

-- 5. Bikramshila Central Directory Hierarchy
INSERT INTO `folders` (`id`, `organization_id`, `name`, `description`, `parent_id`, `is_operational`, `created_by`) VALUES
(1, 1, 'Bikramshila', 'Central Primary Root Directory', NULL, 0, 11),
(2, 1, 'RAHEE', 'Rahee Infratech Limited Branch Directory', 1, 0, 11),
(3, 2, 'IRCON', 'Ircon International Limited Branch Directory', 1, 0, 11);

-- 6. Master Users (Official Team Credentials & 100% Exact Verified Bcrypt Hashes)
INSERT INTO `users` (`id`, `organization_id`, `name`, `email`, `password_hash`, `role_id`, `designation`, `document_capability`, `status`) VALUES
(11, NULL, 'Rajib Ghosh', 'rajib.g@rahee.com', '$2b$10$0g1hcC/k/e6nWT853VE85OSMOfF7ekh9OJAU8G8xItoghDpVw1iPO', 1, 'Super Admin', 'Viewer', 'ACTIVE'),
(5, 1, 'Rahul Dey', 'rahul.d@rahee.com', '$2b$10$tEOcSgHlm0m/flB54ZDWbOo8vEo2OfX5K1Gai6gsdBMYdFJsa.l5K', 2, 'Admin', 'Upload', 'ACTIVE'),
(9, 1, 'Somnath Mondal', 's.mondal@rahee.com', '$2b$10$IccDR6Gr/g59U1085DCAkeCvW90I35OxkbEwpsci.ZGl2MLdXuH3G', 7, 'Execution Control', 'Upload', 'ACTIVE'),
(6, 1, 'Kiran Sankar Chowdhury', 'kiransankar.c@rahee.com', '$2b$10$unxWi5eXFKeq48Bn8Wex/.UpNgSWRfINvlTodUkFmgj3chchke1sq', 6, 'Manager', 'Viewer', 'ACTIVE'),
(7, 1, 'Mukesh Kumar Prasad', 'mukesh.p@rahee.com', '$2b$10$bO/jiVvRH8s1XrYPeW5QeO4/S2ihyF7ocNCkTos0GuVPdjE2.OHVO', 6, 'Manager', 'Viewer', 'ACTIVE'),
(8, 1, 'Pintu Bhukta', 'pintu.b@rahee.com', '$2b$10$bK7vBgBkDkugrMBAGPMmcOTqLljVv2CeTVyMWEnvYObujEOt44.s2', 6, 'Manager', 'Viewer', 'ACTIVE'),
(12, 1, 'Ayush Khaitan', 'ayush.k@rahee.com', '$2b$10$AZYPHc9Db0A57pK3huvPqu8BQ79e.D.jq8Xo3B7q7wGQiA27sKuOC', 6, 'Manager', 'Viewer', 'ACTIVE'),
(13, 1, 'Manoj Ghosh', 'manoj.g@rahee.com', '$2b$10$OELTlcf4/rOfz8PuG14mie/wczEQS79l/CAozE.9Y4LypoaLOXaVC', 6, 'Manager', 'Viewer', 'ACTIVE'),
(14, 1, 'Arunabha Pyne', 'arunabha.p@rahee.com', '$2b$10$yZcm8FVrZb.PNShZmLnOquulDVUst2jDotRckJ9twH092frkFEktS', 6, 'Manager', 'Viewer', 'ACTIVE'),
(16, 1, 'Manish Kumar Patra', 'manish.p@rahee.com', '$2b$10$RVh5Bj8SbivtIkbOX.KnV.4sI.yvLzGUm7Ft/luRGBwKLD8eSoH7q', 6, 'Viewer', 'Viewer', 'ACTIVE'),
(10, 2, 'Om Jha', 'om.jha@ircon.org', '$2b$10$hUfzN0uz2d3/W.UgMNARDuILFAASovTlGnJuOrRyIdCzR0O35JTjG', 8, 'Admin', 'Upload', 'ACTIVE'),
(2, 2, 'Shardu Kumar Rastogi', 'shardu.rastogi@ircon.org', '$2b$10$.si/ADIKk0BMW0Cu4dk0KOd7CEdeIGgSHCohbOawwAs5uQEui/Jz6', 6, 'Execution Control', 'Viewer', 'ACTIVE'),
(3, 2, 'Chandra Bijay Singh', 'chandra.singh@ircon.org', '$2b$10$.CPgQckRto0.9r.QPBPSr.abTWZRl1beVr6sYVRDWbhHhK6Kg6wfu', 6, 'Review', 'Viewer', 'ACTIVE');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- End of Schema & Seed
-- ============================================================================
