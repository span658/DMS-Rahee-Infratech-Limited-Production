/**
 * Centralized Enterprise Document Management System (DMS)
 * Master Feature Configuration File
 * 
 * NOTE FOR FUTURE RE-ACTIVATION:
 * None of the legacy features (Multi-Stage Approval Workflow, 7-Day Archival Policy,
 * Strict Multi-Tenant Isolation, Incremental Versioning) have been deleted from code.
 * They are preserved 100% intact in the codebase and controlled via the master toggles below.
 */

module.exports = {
  // 1. Workflow Approval Review Process
  // Set false: Bypasses multi-stage review. Uploaded documents immediately receive 'FINAL_APPROVED' status.
  // Set true:  Re-activates full review pipeline (PENDING_REVIEW_1 -> PENDING_REVIEW_2 -> FINAL_APPROVED).
  WORKFLOW_REVIEW_ENABLED: false,

  // 2. Multi-Tenant Data Isolation
  // Set false: Bypasses tenant isolation for view queries. Enables universal cross-visibility for Rahee & Ircon users across BKS folder structure.
  // Set true:  Strictly isolates documents and folders per organization (Company 1 vs Company 2).
  MULTI_TENANT_ISOLATION_ENABLED: false,

  // 3. 7-Day Unapproved Document Archival Policy
  // Set false: Disables background scanner and 7-day archival checks. Documents remain permanently active.
  // Set true:  Enables 24/7 background hourly scanner to archive unapproved documents after 7 days.
  ARCHIVAL_POLICY_ENABLED: false,

  // 4. Operational Folder Exemption Tag
  // Set false: Hides Operational Folder indicators and UI badges.
  // Set true:  Enables Operational Folder creation and archival exemption logic.
  OPERATIONAL_FOLDER_ENABLED: false,

  // 5. Static Versioning Mechanism (V1.0)
  // Set true:  All document uploads assign tag 'General Version V1.0' (no incremental V1.1 / V2.0).
  // Set false: Enables incremental major/minor version updates (V1.1, V1.2, V2.0...).
  STATIC_VERSION_V1_ONLY: true,

  // 6. Strict No-Deletion Permission Rule
  // Set true:  Strictly restricts file and folder deletion permission to Super Admin ONLY.
  // Set false: Allows regular Admins and Uploaders to delete their files/folders.
  ONLY_SUPER_ADMIN_CAN_DELETE: true,

  // 7. BKS Directory Hierarchy Mode
  // Set true:  Enforces primary 'BKS' main folder with 'IRCON' and 'RAHEE' subfolders.
  BKS_FOLDER_MODE: true,

  // 8. Admin Folder Creation Permission (Configurable)
  // Set true:  Allows Company Admins (Rahee Admin & Ircon Admin) and Super Admin to create subfolders under BKS.
  // Set false: Restricts folder creation to Super Admin ONLY.
  ADMIN_FOLDER_CREATION_ENABLED: true
};
