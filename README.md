# 🛡️ Enterprise Document Management System (DMS)

A secure, multi-tenant Enterprise Document Management System built with **React.js**, **Node.js / Express.js**, **MySQL / SQLite**, **Socket.IO**, and **JWT Authentication**.

---

## 🔑 Key Features

1. **Strict Multi-Tenant Data Isolation**
   - Organization-scoped data access enforced via `organization_id`.
   - Cross-organization access attempts yield **403 Forbidden**.
   - Built specifically for **Rahee Infratech Limited** (Company 1) and **Ircon International Limited** (Company 2).

2. **Multi-Stage Document Workflow Engine**
   - **Upload Stage**: Employee uploads document -> Status `PENDING_REVIEW_1`.
   - **Stage 1 Reviewer / Admin**: Approves (moves to Stage 2) or Rejects with required changes comment.
   - **Document Revision**: Uploader submits revised versions (`V1.1`, `V1.2`) preserving full version history.
   - **Stage 2 Reviewer / Manager**: Reviews Stage 1 history, approves (moves to Final Approval) or rejects.
   - **Step 3 Final Approver**: Executes final authorization (`final_approve`) -> Status `APPROVED`, locking the document.

3. **Role-Based Access Control (RBAC)**
   - Granular permission keys (`upload`, `view`, `preview`, `edit`, `download`, `approve_reject`, `final_approve`, `manage_users`, `view_audit_logs`, `view_reports`).

4. **In-App & Live Email Notification Outbox**
   - Real-time Socket.IO notification push.
   - Email log outbox (`email_logs`) tracking all system notification emails.
   - Dedicated Email Activity Monitor interface (`/emails`) for live HTML email inspection.

5. **Security & Audit Trail**
   - Password hashing using `bcryptjs` (salt factor 10).
   - Append-only security audit trail recording logins, uploads, downloads, views, reviews, and admin actions.
   - Executable file uploads (`.exe`, `.bat`, `.sh`, etc.) strictly blocked.

---

## ⚙️ System Permission Keys & Definitions

| Permission Key | Human Name | Description & Capabilities Granted |
| :--- | :--- | :--- |
| `upload` | **Document Upload** | Allows uploading new Microsoft Word, PDF, Excel, PowerPoint, and Image files (up to 100 MB). |
| `view` | **Document Directory** | Access to document search, metadata, and directory listings. |
| `preview` | **Document Preview** | Allows opening and previewing documents in full browser tabs (`_blank`) or direct browser streams. |
| `edit` | **Version Update** | Allows updating document metadata and uploading new file versions (`v1.1`, `v2.0`). |
| `download` | **Document Download** | Allows downloading original binary files directly to local disk. |
| `approve_reject` | **Review & Approve** | Allows reviewing documents and granting intermediate step approvals or rejections in workflow chains. |
| `final_approve` | **Final Approval** | Grants Step 3 Final Approver status to publish documents into officially `APPROVED` state. |
| `manage_users` | **User Management** | Grants ability to create new accounts, edit profiles, toggle login access, and assign permissions. |
| `view_audit_logs`| **Audit Trail** | Access to system-wide security audit trail logs (`UPLOAD`, `APPROVE`, `CREATE_USER`, `LOGIN`). |
| `view_reports` | **Reports Access** | Access to storage breakdown, employee document metrics, and workflow status reports. |

---

## 👥 Pre-Seeded Master Users & Professional Credentials Matrix

### **Company 1: Rahee Infratech Limited (`RAHEE`)**

| ID | Full Name | Username / Email | Standard Professional Password | Role | Responsibilities | Permissions Summary |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **5** | Rahul Dey | `rahul.d@rahee.com` | `R@hul#Dey2026!Sec` | Admin | Company Admin, Step 1 Approver, Reports & Audit Logs | `upload`, `view`, `preview`, `download`, `approve_reject`, `view_audit_logs`, `view_reports` |
| **11** | Rajib Ghosh | `rajib.g@rahee.com` | `R@jib#Ghosh2026!Gov` | Admin | Executive Admin (**Cross-Company Control for Both Companies**), User Add & Manage | `upload`, `view`, `preview`, `edit`, `download`, `approve_reject`, `manage_users`, `view_audit_logs`, `view_reports` |
| **6** | Kiran Sankar Chowdhury | `kiransankar.c@rahee.com` | `K1ran#Sankar2026!Rev` | Manager | Step 2 Workflow Reviewer, Intermediate Approvals | `view`, `preview`, `download`, `approve_reject`, `view_audit_logs`, `view_reports` |
| **13** | Manoj Ghosh | `manoj.g@rahee.com` | `M@noj#Ghosh2026!Appr` | Manager | **Step 3 Final Document Approver** | `view`, `preview`, `download`, `final_approve` |
| **7** | Mukesh Kumar Prasad | `mukesh.p@rahee.com` | `M@kesh#Prasad2026!Mgr` | Manager | Departmental Manager Oversight & Reports | `view`, `preview`, `download`, `view_audit_logs`, `view_reports` |
| **8** | Pintu Bhukta | `pintu.b@rahee.com` | `P1ntu#Bhukta2026!Mgr` | Manager | Departmental Manager Oversight & Reports | `view`, `preview`, `download`, `view_audit_logs`, `view_reports` |
| **9** | Somenath Mondal | `s.mondal@rahee.com` | `S@menath#Mondal2026!Mgr` | Manager | Departmental Manager Oversight & Reports | `view`, `preview`, `download`, `view_audit_logs`, `view_reports` |
| **12** | Ayush Khaitan | `ayush.k@rahee.com` | `Ayu$h#Khaitan2026!Mgr` | Manager | Departmental Manager Oversight & Reports | `view`, `preview`, `download`, `view_audit_logs`, `view_reports` |
| **14** | Arunabha Pyne | `arunabha.p@rahee.com` | `Arun#Pyne2026!Mgr` | Manager | Departmental Manager Oversight & Reports | `view`, `preview`, `download`, `view_audit_logs`, `view_reports` |
| **10** | Om Jha | `om.jha@rahee.com` | `Om#Jha2026!Upld` | Employee | Primary Document Uploader & Revision Submitter | `upload`, `view`, `preview`, `edit`, `download` |

---

### **Company 2: Ircon International Limited (`IRCON`)**

| ID | Full Name | Username / Email | Standard Professional Password | Role | Responsibilities | Permissions Summary |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **2** | Shardu Kumar Rastogi | `shardu.rastogi@ircon.org` | `Sh@rdu#Rastogi2026!Admin` | Admin | Company 2 Admin, Step 1 Reviewer & Approver | `view`, `preview`, `download`, `approve_reject`, `view_audit_logs`, `view_reports` |
| **3** | Chandra Bijay Singh | `chandra.singh@ircon.org` | `Ch@ndra#Singh2026!Mgr` | Manager | Company 2 Primary Document Uploader | `upload`, `view`, `preview`, `edit`, `download` |

---

### **Global Super Administrator**

| ID | Full Name | Username / Email | Standard Professional Password | Role | Scope |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | Global System Administrator | `superadmin@enterprise-dms.com` | `SuperAdmin@123Sec!` | Super Admin | System-wide cross-organization governance |

---

## 🚀 Quick Start Guide

### 1. Backend Server Setup
```bash
cd backend
npm install
npm run start
```
*The Express & Socket.IO server will start on `http://localhost:5000`.*
*The database automatically creates and seeds tables (`enterprise_dms.sqlite` or MySQL).*

### 2. Frontend Application Setup
```bash
cd frontend
npm install
npm run dev
```
*The Vite development server will start on `http://localhost:5173`.*

---

## 📂 Key Documentation & Schema Files

- **User Responsibilities Specification**: [`USER_RESPONSIBILITIES.md`](USER_RESPONSIBILITIES.md)
- **Database SQL Schema & Seed File**: [`schema.sql`](schema.sql)
- **Backend Seeder Script**: [`backend/src/config/db.js`](backend/src/config/db.js)
