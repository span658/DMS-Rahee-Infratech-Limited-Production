-- ============================================================================
-- Enterprise Document Management System (EDMS) - Master Database Schema & Seed
-- Target Engine: MySQL 5.7+ / 8.0+
-- Scope: Rahee Infratech Limited (Company 1) & Ircon International Limited (Company 2)
-- Policy: Bikramshila Directory Hierarchy & Bikramshila Manual Document Archival Policy
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Clean Reset: Drop Existing Database & Tables for Re-execution
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
-- 6. FOLDERS (Bikramshila Directory Hierarchy)
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
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 7. DOCUMENTS
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
  `status` VARCHAR(50) NOT NULL DEFAULT 'FINAL_APPROVED',
  `current_version_id` INT DEFAULT NULL,
  `current_version_number` VARCHAR(50) DEFAULT 'General Version V1',
  `is_locked` TINYINT DEFAULT 0,
  `folder_id` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 8. DOCUMENT_VERSIONS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `document_versions`;
CREATE TABLE `document_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `organization_id` INT NOT NULL,
  `version_number` VARCHAR(50) NOT NULL DEFAULT 'General Version V1',
  `version_index` DOUBLE NOT NULL DEFAULT 1.0,
  `original_filename` VARCHAR(255) NOT NULL,
  `storage_key` VARCHAR(255) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `file_hash` VARCHAR(100) NOT NULL,
  `uploaded_by` INT NOT NULL,
  `change_description` TEXT,
  `review_status` VARCHAR(50) DEFAULT 'FINAL_APPROVED',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 9. DOCUMENT_REVIEWS
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
-- 10. NOTIFICATIONS
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
-- 11. EMAIL_LOGS (Outbox & Live Email Monitor Log)
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
-- 12. AUDIT_LOGS (Append-Only Security Audit Trail)
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
-- 13. FOLDER_PERMISSIONS (Access Control Rules for Folders)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `folder_permissions`;
CREATE TABLE `folder_permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `folder_id` INT NOT NULL,
  `role_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `permission_level` VARCHAR(50) NOT NULL DEFAULT 'FULL_CONTROL',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- SEED DATA INSERTION
-- ============================================================================

-- 1. Insert System Organizations
INSERT INTO `organizations` (`id`, `name`, `code`, `status`) VALUES
(1, 'Rahee Infratech Limited', 'RAHEE', 'ACTIVE'),
(2, 'Ircon International Limited', 'IRCON', 'ACTIVE');

-- 2. Insert System Roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'SUPER_ADMIN', 'Global Super Administrator dedicated to User Creation & Governance'),
(2, 'RAHEE_ADMIN_REVIEWER', 'Company 1 Admin (Rahul Dey)'),
(3, 'RAHEE_EXEC_ADMIN', 'Company 1 Executive Admin'),
(4, 'STEP2_REVIEWER', 'Workflow Reviewer'),
(5, 'FINAL_APPROVER', 'Final Approver'),
(6, 'MANAGER_OVERSIGHT', 'Departmental Manager Oversight & Reports'),
(7, 'DOCUMENT_UPLOADER', 'Document Uploader & Execution Control'),
(8, 'IRCON_ADMIN_REVIEWER', 'Company 2 Admin (Om Jha)');

-- 3. Insert System Permission Keys (RBAC)
INSERT INTO `permissions` (`id`, `code`, `description`) VALUES
(1, 'upload', 'Allows uploading new Microsoft Word, PDF, Excel, PPTX, Images, and Auto CAD files'),
(2, 'view', 'Access to document search, metadata, and directory listings'),
(3, 'preview', 'Allows opening and previewing documents in browser streams'),
(4, 'edit', 'Allows updating document metadata'),
(5, 'download', 'Allows downloading original binary files to local disk'),
(6, 'approve_reject', 'Workflow review permission'),
(7, 'final_approve', 'Final approval permission'),
(8, 'manage_users', 'Grants ability to create/edit user accounts and assign permissions'),
(9, 'view_audit_logs', 'Access to system-wide security audit trail logs'),
(10, 'view_reports', 'Access to storage breakdown, employee metrics, and reports'),
(11, 'manage_folders', 'Allows creating and managing tenant document folders');

-- 4. Insert Role-Permissions Mappings
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 8), (1, 9), (1, 10), (1, 11), -- SUPER_ADMIN (Rajib Ghosh)
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 9), (2, 10), (2, 11),         -- RAHEE Admin (Rahul Dey)
(7, 1), (7, 2), (7, 3), (7, 4), (7, 5), (7, 9), (7, 10),                  -- Execution Control / Uploader (Somnath Mondal)
(6, 2), (6, 3), (6, 5), (6, 9), (6, 10),                                 -- Manager Oversight / Viewers
(8, 1), (8, 2), (8, 3), (8, 4), (8, 5), (8, 9), (8, 10), (8, 11);         -- IRCON Admin (Om Jha)

-- 5. Insert Master Users with Bcrypt Hashed Passwords (Salt Factor 10)
-- Credentials & Roles:
-- Rajib Ghosh: rajib.g@rahee.com / R@jib#Ghosh2026 (ID 11, Super-Admin - Exclusive File/Folder Deletion, Archival & Restoration; Folder Creation under Bikramshila Root Allowed; File Upload Restricted)
-- Rahul Dey: rahul.d@rahee.com / R@hul#Dey2026 (ID 5, Rahee Admin - Folder Creation & File Upload under Bikramshila/RAHEE & subfolders Allowed; Deletion, Archival & Restoration Restricted)
-- Somnath Mondal: s.mondal@rahee.com / S@menath#Mondal2026 (ID 9, Execution Control Uploader - Role ID 7, File Upload under Bikramshila/RAHEE & subfolders Allowed; Deletion, Archival & Restoration Restricted)
-- Om Jha: om.jha@ircon.org / Om#Jha2026 (ID 10, Ircon Admin - Folder Creation & File Upload under Bikramshila/IRCON & subfolders Allowed; Deletion, Archival & Restoration Restricted)
-- Shardu Kumar Rastogi: shardu.rastogi@ircon.org / Sh@rdu#Rastogi2026 (ID 2, Execution Control Viewer - Role ID 6, Upload Strictly Blocked, Universal View/Download/Notifications Allowed)
-- Chandra Bijay Singh: chandra.singh@ircon.org / Ch@ndra#Singh2026 (ID 3, Review / Viewer)
-- Kiran Sankar Chowdhury: kiransankar.c@rahee.com / K1ran#Sankar2026 (ID 6, Manager Oversight)
-- Mukesh Kumar Prasad: mukesh.p@rahee.com / M@kesh#Prasad2026 (ID 7, Manager Oversight)
-- Pintu Bhukta: pintu.b@rahee.com / P1ntu#Bhukta2026 (ID 8, Manager Oversight)
-- 4 Notification-Excluded View-Only Users (Universal View & Download Access Repository-Wide, Excluded from Automated Email & In-App Notifications):
-- Manish Kumar Patra: manish.p@rahee.com / M@nish#Patra2026 (ID 16, Viewer)
-- Ayush Khaitan: ayush.k@rahee.com / Ayu$h#Khaitan2026 (ID 12, Manager Oversight)
-- Manoj Ghosh: manoj.g@rahee.com / M@noj#Ghosh2026 (ID 13, Manager Oversight)
-- Arunabha Pyne: arunabha.p@rahee.com / Arun#Pyne2026 (ID 14, Manager Oversight)

INSERT INTO `users` (`id`, `organization_id`, `name`, `email`, `password_hash`, `role_id`, `status`) VALUES
(1, NULL, 'Global System Administrator', 'superadmin@enterprise-dms.com', '$2b$10$mQ.6gKbL9zEP9g8g3qClMewHwdZ2WQ8TG3bPaCRhkvzQUUs.q38Zm', 1, 'ACTIVE'),
(11, NULL, 'Rajib Ghosh', 'rajib.g@rahee.com', '$2b$10$Xlqr3YDXrSWJNbuV6O6BouCYxhJztbqDad05VkSUU4XACEExP8TSC', 1, 'ACTIVE'),
(5, 1, 'Rahul Dey', 'rahul.d@rahee.com', '$2b$10$l5qSA3Td4EttufhTtrevluCc9lTiWGDIMeuYLyhIfqdkXkN3tV7iW', 2, 'ACTIVE'),
(10, 2, 'Om Jha', 'om.jha@ircon.org', '$2b$10$S4CXCLBYv6SNeyJEUNovbujSXDjMctYW3r69yoBq3schQXc2ToBdu', 8, 'ACTIVE'),
(9, 1, 'Somnath Mondal', 's.mondal@rahee.com', '$2b$10$EWQkVdrsipoRrtzQvnWT1.vl3xhGKH8ZGWSAqUJv868Z724/B69jS', 7, 'ACTIVE'),
(2, 2, 'Shardu Kumar Rastogi', 'shardu.rastogi@ircon.org', '$2b$10$b/B65d9xcy475WikvxsRFurwCUq57C8Jsjl40Ng0anU5CJjVNOYsG', 6, 'ACTIVE'),
(3, 2, 'Chandra Bijay Singh', 'chandra.singh@ircon.org', '$2b$10$G1HlihXF1CBfy.AocWjl2.C8SiAsGav1SZI05.OgRjIP5Bve1yf4e', 6, 'ACTIVE'),
(6, 1, 'Kiran Sankar Chowdhury', 'kiransankar.c@rahee.com', '$2b$10$qsU5jeTv3fQJDWNchuvUp.kt8dLVjm0wjMxnZEIOO1Lv1Q06akvH.', 6, 'ACTIVE'),
(7, 1, 'Mukesh Kumar Prasad', 'mukesh.p@rahee.com', '$2b$10$nDXXMDd8ycKHh2o/9TvkMejxpq6S1H0rHR8PaWtsjfbIpcjTVHSPS', 6, 'ACTIVE'),
(8, 1, 'Pintu Bhukta', 'pintu.b@rahee.com', '$2b$10$jHyQenniWGW05Qy3/I3z6eWmrUUuEcJ8vgEtZkD0jp4ja5qA5C43O', 6, 'ACTIVE'),
(16, 1, 'Manish Kumar Patra', 'manish.p@rahee.com', '$2b$10$uy2cP1HufGFspzyjOtDDNu8ORf0bvUaGuHFPi8XJJBun.vwKjL7vO', 6, 'ACTIVE'),
(12, 1, 'Ayush Khaitan', 'ayush.k@rahee.com', '$2b$10$HuNw.Pu/mfMC3q7z9rMb2.b6e1J2giH9o4pnaIJv7CROT24RkbzMS', 6, 'ACTIVE'),
(13, 1, 'Manoj Ghosh', 'manoj.g@rahee.com', '$2b$10$JNn93Q5ZkAff.f/lqLKRGOv9ilLwXaC7ryaSLFxBtGYe08vvxxHpK', 6, 'ACTIVE'),
(14, 1, 'Arunabha Pyne', 'arunabha.p@rahee.com', '$2b$10$OtxsRqrZAL3omOfQnivdGeqoK4m/07es0uytlZWiSbYeFecaiuX7G', 6, 'ACTIVE');

-- 6. Insert Bikramshila Directory Hierarchy Folders
INSERT INTO `folders` (`id`, `organization_id`, `name`, `description`, `parent_id`, `is_operational`, `created_by`) VALUES
(4, 1, 'Bikramshila', 'Main Bikramshila Root Project Folder', NULL, 0, 11),
(5, 2, 'IRCON', 'Ircon International Dedicated Sub-Folder', 4, 0, 10),
(6, 1, 'RAHEE', 'Rahee Infratech Dedicated Sub-Folder', 4, 0, 5);

-- 7. Insert System Audit Log Initialization Entry
INSERT INTO `audit_logs` (`organization_id`, `user_id`, `user_email`, `user_name`, `action`, `comment`, `ip_address`) VALUES
(NULL, 11, 'rajib.g@rahee.com', 'Rajib Ghosh', 'SYSTEM_INITIALIZATION', 'Enterprise DMS database schema initialized with Bikramshila Directory Hierarchy & Bikramshila Manual Archival Policy.', '127.0.0.1');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END OF SCHEMA FILE
-- ============================================================================
