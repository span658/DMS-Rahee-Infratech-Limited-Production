# 🛡️ Enterprise DMS - Master User Responsibilities & RBAC Matrix
**System Architecture & Workflow Specification Document**  
*Scope: Rahee Infratech Limited (Company 1) & Ircon International Limited (Company 2)*

---

## 1. ⚙️ System Permissions & Access Control (RBAC)

The Enterprise Document Management System (DMS) enforces strict Role-Based Access Control (RBAC) mapped at the database level:

| Permission Code | Permission Name | Description & Granted Capabilities |
| :--- | :--- | :--- |
| `upload` | **Document Upload** | Allows uploading initial document files (`.pdf`, `.docx`, `.xlsx`, `.pptx`, `.png`, `.jpg`). Strictly reserved for designated Uploaders. |
| `view` | **Document Directory** | Allows searching, filtering, and viewing document metadata in the repository. |
| `preview` | **Document Preview** | Allows opening and previewing documents in-browser without downloading. |
| `edit` | **Revision Update** | Allows uploading revised file versions (`V2.0`, `V3.0`). Reserved strictly for the original document uploader. |
| `download` | **Document Download** | Allows downloading original document binary files to local storage. |
| `approve_reject` | **Review & Approve** | Allows inspecting documents, entering required changes in description box, and submitting intermediate stage approval or rejection. |
| `final_approve` | **Final Approval** | Grants authority to publish pending documents into `FINAL_APPROVED` state and lock files (`is_locked = 1`). |
| `manage_users` | **User Management** | Grants access to create users, edit profiles, assign roles, and toggle user status (`/users` portal). |
| `view_audit_logs` | **Security Audit Logs** | Access to system-wide audit logs tracking document uploads, reviews, approvals, and user changes. |
| `view_reports` | **Reports & Analytics** | Access to storage breakdown, departmental document counts, and workflow performance metrics. |

---

## 2. 🏢 Company 1: Rahee Infratech Limited Workflow & Responsibilities

### 🔹 User Responsibilities & Login Credentials
| User Name | Role | Email | Password | Primary Responsibilities | Assigned Permissions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Om Jha** | `DOCUMENT_UPLOADER` | `om.jha@rahee.com` | `Om#Jha2026` | **Primary Uploader & Revision Editor**. Uploads initial document (`V1`). Edits metadata and submits revised versions (`V2`) upon rejection feedback. | `upload`, `view`, `preview`, `edit`, `download` |
| **Rahul Dey** | `RAHEE_ADMIN_REVIEWER` | `rahul.d@rahee.com` | `R@hul#Dey2026` | **Company 1 Admin & Reviewer 1**. Previews & downloads submitted documents. If all ok, enters *"All are ok"* and approves (routes to Reviewer 2). If updates needed, types change instructions and rejects (alerts Om Jha). | `view`, `preview`, `edit`, `download`, `approve_reject`, `view_audit_logs`, `view_reports` |
| **Rajib Ghosh** | `RAHEE_EXEC_ADMIN` | `rajib.g@rahee.com` | `R@jib#Ghosh2026` | **Executive System Governor (Cross-Company)**. Full user management (`manage_users` / `/users` portal across Company 1 & 2), document review, audit logs, and system oversight. | `upload`, `view`, `preview`, `edit`, `download`, `approve_reject`, `manage_users`, `view_audit_logs`, `view_reports` |
| **Kiran Sankar Chowdhury** | `STEP2_REVIEWER` | `kiransankar.c@rahee.com` | `K1ran#Sankar2026` | **Step 2 Technical Reviewer**. Inspects document + Reviewer 1 comments. If all ok, enters *"All are ok"* and approves (routes to Final Approver). If updates needed, types feedback and rejects. | `view`, `preview`, `edit`, `download`, `approve_reject`, `view_audit_logs`, `view_reports` |
| **Manoj Ghosh** | `FINAL_APPROVER` | `manoj.g@rahee.com` | `M@noj#Ghosh2026` | **Step 3 Final Approver**. Receives alert **only** after Reviewer 1 & Reviewer 2 both approve with *"All are ok"*. Executes Final Approval ➔ publishes document as `FINAL_APPROVED` and locks file. | `view`, `preview`, `download`, `final_approve` |
| **Pintu Bhukta** | `MANAGER_OVERSIGHT` | `pintu.b@rahee.com` | `P1ntu#Bhukta2026` | **Manager Oversight**. Views, previews, downloads files, and inspects reports. Receives upload & final approval notifications. | `view`, `preview`, `download`, `view_audit_logs`, `view_reports` |
| **Mukesh Kumar Prasad** | `MANAGER_OVERSIGHT` | `mukesh.p@rahee.com` | `M@kesh#Prasad2026` | **Manager Oversight**. Views, previews, downloads files, and inspects reports. Receives upload & final approval notifications. | `view`, `preview`, `download`, `view_audit_logs`, `view_reports` |
| **Somenath Mondal** | `MANAGER_OVERSIGHT` | `s.mondal@rahee.com` | `S@menath#Mondal2026` | **Manager Oversight**. Views, previews, downloads files, and inspects reports. Receives upload & final approval notifications. | `view`, `preview`, `download`, `view_audit_logs`, `view_reports` |
| **Ayush Khaitan** | `MANAGER_OVERSIGHT` | `ayush.k@rahee.com` | `Ayu$h#Khaitan2026` | **Manager Oversight**. Views, previews, downloads files, inspects reports. Excluded from initial upload pop-up notifications. | `view`, `preview`, `download`, `view_audit_logs`, `view_reports` |
| **Arunabha Pyne** | `MANAGER_OVERSIGHT` | `arunabha.p@rahee.com` | `Arun#Pyne2026` | **Manager Oversight**. Views, previews, downloads files, inspects reports. Excluded from initial upload pop-up notifications. | `view`, `preview`, `download`, `view_audit_logs`, `view_reports` |

---

## 3. 🏢 Company 2: Ircon International Limited Workflow & Responsibilities

### 🔹 User Responsibilities & Login Credentials
| User Name | Role | Email | Password | Primary Responsibilities | Assigned Permissions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Chandra Bijay Singh** | `DOCUMENT_UPLOADER` | `chandra.singh@ircon.org` | `Ch@ndra#Singh2026` | **Primary Uploader & Revision Editor (Company 2)**. Uploads initial document (`V1`). Receives pop-up notifications on approval/rejection. If rejected, edits and re-uploads revised version (`V2`). | `upload`, `view`, `preview`, `edit`, `download` |
| **Shardu Kumar Rastogi** | `IRCON_ADMIN_REVIEWER` | `shardu.rastogi@ircon.org` | `Sh@rdu#Rastogi2026` | **Company 2 Admin & Reviewer 1**. Views, previews, and downloads documents. If all ok, enters *"All ok"* / *"All are ok"* in description box and approves ➔ **Directly finalizes status to `FINAL_APPROVED` and locks file (`is_locked = 1`)**. If updates needed, types change comments in description box and rejects (alerts Chandra). | `view`, `preview`, `download`, `approve_reject`, `view_audit_logs`, `view_reports` |

---

## 4. 👑 Global System Administrator Scope & Restrictions

| Role / Account | Email | Password | Capabilities & Scope | Strict Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **Global Super Administrator** | `superadmin@enterprise-dms.com` | `SuperAdmin@123Sec` | Cross-tenant **User Management** (`/users` portal: add users, edit accounts, set roles, toggle active status) & System Governance across Company 1 & Company 2. Receives system audit notifications. | **STRICTLY RESTRICTED FROM UPLOADING OR EDITING DOCUMENTS**. Super Admin cannot upload initial files (`V1`) or submit file revisions (`V2`). Document upload and revision editing are reserved strictly for designated Uploaders. |

---

## 5. 🔄 Workflow Notification Routing & Exclusion Matrix

| Event / Trigger | Company Scope | Real-Time Pop-Up Notification Recipients | Excluded Users | Workflow Action & System Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Initial Upload (`V1`)** | **Company 1** (*Rahee*) | **Reviewer 1** (Rahul Dey, Rajib Ghosh), **Reviewer 2** (Kiran Sankar Chowdhury), **Managers** (Pintu Bhukta, Mukesh Kumar Prasad, Somenath Mondal), **Uploader** (Om Jha), **Super Admin** | Ayush Khaitan, Manoj Ghosh, Arunabha Pyne | Status set to `PENDING_REVIEW_1`. Reviewer 1 inspects, previews, downloads. |
| **Initial Upload (`V1`)** | **Company 2** (*Ircon*) | **Reviewer 1** (Shardu Kumar Rastogi), **Uploader** (Chandra Bijay Singh), **Super Admin** | Company 1 Users | Status set to `PENDING_REVIEW_1`. Shardu inspects, previews, downloads. |
| **Stage 1 Approval** | **Company 1** | **Reviewer 2** (Kiran Sankar Chowdhury), **Super Admin** | - | Reviewer 1 enters *"All are ok"*. Status moves to `PENDING_REVIEW_2`. |
| **Stage 1 Rejection** | **Company 1** | **Reviewer 2**, **Uploader** (Om Jha), **Super Admin** | Ayush, Manoj, Arunabha | Reviewer 1 types required updates in description box & rejects. Status set to `REJECTED`. |
| **Stage 2 Approval** | **Company 1** | **Final Approver** (Manoj Ghosh), **Uploader** (Om Jha), **Reviewer 1**, **Super Admin** | - | Reviewer 2 enters *"All are ok"*. Status moves to `FINAL_APPROVAL_PENDING`. |
| **Stage 2 Rejection** | **Company 1** | **Uploader** (Om Jha), **Reviewer 1**, **Super Admin** | Ayush, Manoj, Arunabha | Reviewer 2 types required updates in description box & rejects. Status set to `REJECTED`. |
| **Single-Stage Approval** | **Company 2** | **Uploader** (Chandra Bijay Singh), **Super Admin** | Company 1 Users | Shardu enters *"All are ok"*. **Status directly becomes `FINAL_APPROVED` and file is locked (`is_locked = 1`)**. |
| **Single-Stage Rejection**| **Company 2** | **Uploader** (Chandra Bijay Singh), **Super Admin** | Company 1 Users | Shardu types required updates in description box & rejects. Status set to `REJECTED`. |
| **Revision Re-Upload (`V2`)** | **Company 1** | **Reviewer 1**, **Reviewer 2**, **Managers** (Pintu, Mukesh, Somenath), **Uploader** (Om Jha), **Super Admin** | Ayush, Manoj, Arunabha | Om Jha attaches updated file (`V2`). Review cycle restarts (`PENDING_REVIEW_1`). |
| **Revision Re-Upload (`V2`)** | **Company 2** | **Reviewer 1** (Shardu Kumar Rastogi), **Uploader** (Chandra Bijay Singh), **Super Admin** | Company 1 Users | Chandra Bijay Singh attaches updated file (`V2`). Review cycle restarts (`PENDING_REVIEW_1`). |
| **Final Approval** | **Company 1** | **Uploader** (Om Jha), **Reviewer 1**, **Reviewer 2**, **Managers**, **Super Admin** | - | Manoj Ghosh clicks Final Approve. Status updates to `FINAL_APPROVED` and locks file (`V1 FINAL`). |

---

## 6. 🔒 Multi-Tenant Data & Notification Isolation Rules

1. **Zero Data Leakage**: All queries for documents, versions, and notifications strictly scope data by `organization_id`.
2. **Notification Isolation**: Users in Company 1 (*Rahee Infratech*) never receive pop-ups, emails, or notifications regarding Company 2 (*Ircon International*) documents.
3. **Uploader Revision Protection**: Only the original document uploader (`uploaded_by === user.id`) can edit metadata or upload a new file version. Other users and Super Admin cannot overwrite or submit revisions for files they did not upload.
