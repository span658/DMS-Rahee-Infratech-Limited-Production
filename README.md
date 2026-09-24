# 🛡️ Enterprise Document Management System (EDMS) - Master Specification & Documentation

> **High-Security Multi-Tenant Document Governance & Engineering CAD Management Platform**  
> Tailored for **Rahee Infratech Limited** (Company 1), **Ircon International Limited** (Company 2), and the centralized **Bikramshila Infrastructure Project Repository**.

---

## 📑 Table of Contents
1. [System Architecture & Technology Stack](#1-system-architecture--technology-stack)
2. [Bikramshila Central Directory & Folder Hierarchy](#2-bikramshila-central-directory--folder-hierarchy)
3. [Master User Registry, Designations & Capabilities Matrix](#3-master-user-registry-designations--capabilities-matrix)
4. [Granular Role-Based Access Control (RBAC) Matrix](#4-granular-role-based-access-control-rbac-matrix)
5. [Document Upload Notification Routing Engine](#5-document-upload-notification-routing-engine)
6. [Cross-Company Universal Preview & Direct Download Policy](#6-cross-company-universal-preview--direct-download-policy)
7. [Document Types & Smart Auto-Detection Dropdown](#7-document-types--smart-auto-detection-dropdown)
8. [Unlimited Storage & High-Throughput Performance](#8-unlimited-storage--high-throughput-performance)
9. [Security Governance & Document Deletion Protection](#9-security-governance--document-deletion-protection)
10. [Document Archival & 1-Click Restoration Policy](#10-document-archival--1-click-restoration-policy)
11. [Supported Document Formats & In-Browser Viewers](#11-supported-document-formats--in-browser-viewers)
12. [Live Analytics & Interactive Reporting Engine](#12-live-analytics--interactive-reporting-engine)
13. [Database Resilience & Zero-Crash Architecture](#13-database-resilience--zero-crash-architecture)
14. [Installation & Startup Guide](#14-installation--startup-guide)
15. [Complete REST API Reference](#15-complete-rest-api-reference)

---

## 1. System Architecture & Technology Stack

The Enterprise Document Management System (EDMS) is a centralized, high-throughput platform engineered to securely manage mission-critical infrastructure blueprints, engineering CAD drawings, contracts, and workflow documents.

```text
Enterprises Document Management System/
├── backend/
│   ├── src/
│   │   ├── config/              # MySQL2 connection pool (30 pool limit, heartbeat), Multer streaming storage, JWT, Email
│   │   ├── controllers/         # Document, Folder, User, Report, Audit, Notification
│   │   ├── middleware/          # JWT Authentication, RBAC permission validator, Multer error handler
│   │   ├── routes/              # Express 5 REST API routes
│   │   ├── services/            # Notification dispatcher, Audit logging, Archival daemon
│   │   └── app.js               # Express application with generous 500MB payload limits
│   ├── uploads/                 # Secure disk filesystem for documents & CAD drawings (Unlimited capacity)
│   ├── schema.sql               # MySQL master database schema & seed
│   └── server.js                # HTTP + Socket.IO server & auto-port recovery
│
├── frontend/
│   ├── src/
│   │   ├── components/          # DocumentPreviewModal (CAD/Office/PDF), Navbar, Sidebar
│   │   ├── context/             # AuthContext, NotificationContext
│   │   ├── pages/               # Dashboard, Documents, Upload, Detail, Users, Reports, AuditLogs
│   │   ├── services/            # Dynamic api.js host resolver (supports localhost, LAN IP, domains)
│   │   └── routes/              # Protected routing & RBAC navigation
│   └── package.json             # Frontend dependencies
```

### **Core Stack Components**
* **Frontend**: React 19, Vite 8, Tailwind CSS, Lucide Icons, Recharts, Socket.IO Client.
* **Backend**: Node.js, Express 5, MySQL2 (`mysql2/promise`), Socket.IO 4, Multer, Helmet, BcryptJS, JSONWebToken, Mammoth, SheetJS (`xlsx`), JSZip.
* **Database Engine**: MySQL 8.0+ with High-Resilience Connection Pooling (`connectionLimit: 30`, `maxIdle: 10`, `waitForConnections: true`, `enableKeepAlive: true`, `connectTimeout: 20000`).
* **High-Throughput Performance**: Rate limiting removed (`max: unlimited`) and generous 500MB payload support for seamless large file processing.

---

## 2. Central Bikramshila Directory & Folder Hierarchy

All documents, blueprints, and folders are structured under the primary **Bikramshila** root repository, governed by Super Admin (**Rajib Ghosh**):

```text
📁 Bikramshila (Primary Central Root Directory - Folder ID: 1)
│
├── 📂 RAHEE (Company Branch - Folder ID: 2 | Rahee Infratech Limited)
│   ├── 📁 Engineering & Drawings (Subfolder)
│   │   └── 📁 Project (Nested Subfolder)
│   └── 📁 Quality Assurance (Operational Subfolder)
│
└── 📂 IRCON (Company Branch - Folder ID: 3 | Ircon International Limited)
    ├── 📁 Physics (Subfolder)
    │   └── 📁 Project 1 (Nested Subfolder)
    │       └── 📁 Project 2 (Deep Nested Subfolder)
    └── 📁 Track Specifications & Inspection Reports
```

### **Directory Governance Rules**
1. **Central Root Governance (Rajib Ghosh / Super Admin)**: Has complete oversight of the central **`Bikramshila`** root repository and both branches.
2. **Rahee Branch**: Authorized uploaders (`Rahul Dey`, `Somnath Mondal`) upload documents under `Bikramshila/RAHEE` and its subfolders.
3. **Ircon Branch**: Authorized uploaders (`Om Jha`) upload documents under `Bikramshila/IRCON` and its subfolders.
4. **Universal Traversal**: All authenticated users from both organizations have full directory search, preview, and download access across the entire `Bikramshila` tree.

---

## 3. Master User Registry, Designations & Capabilities Matrix

The system includes 14 designated stakeholder accounts:

### 🏢 **Rahee Infratech Limited (`RAHEE`)**
| Sl | User Name | Email ID | Designation | Document Capability | Official Password |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **1** | **Rahul Dey** | `rahul.d@rahee.com` | **Admin** | 📤 **Upload** | `R@hul#Dey2026` |
| **2** | **Somnath Mondal** | `s.mondal@rahee.com` | **Execution Control** | 📤 **Upload** | `S@menath#Mondal2026` |
| **3** | **Kiran Sankar Chowdhury** | `kiransankar.c@rahee.com` | **Manager** | 👁️ **Viewer** | `K1ran#Sankar2026` |
| **4** | **Mukesh Kumar Prasad** | `mukesh.p@rahee.com` | **Manager** | 👁️ **Viewer** | `M@kesh#Prasad2026` |
| **5** | **Pintu Bhukta** | `pintu.b@rahee.com` | **Manager** | 👁️ **Viewer** | `P1ntu#Bhukta2026` |
| **6** | **Ayush Khaitan** | `ayush.k@rahee.com` | **Manager** | 👁️ **Viewer** | `Ayu$h#Khaitan2026` |
| **7** | **Manoj Ghosh** | `manoj.g@rahee.com` | **Manager** | 👁️ **Viewer** | `M@noj#Ghosh2026` |
| **8** | **Arunabha Pyne** | `arunabha.p@rahee.com` | **Manager** | 👁️ **Viewer** | `Arun#Pyne2026` |
| **9** | **Manish Kumar Patra** | `manish.p@rahee.com` | **Viewer** | 👁️ **Viewer** | `M@nish#Patra2026` |

### 🏢 **Ircon International Limited (`IRCON`)**
| Sl | User Name | Email ID | Designation | Document Capability | Official Password |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **1** | **Om Jha** | `om.jha@ircon.org` | **Admin** | 📤 **Upload** | `Om#Jha2026` |
| **2** | **Shardu Kumar Rastogi** | `shardu.rastogi@ircon.org` | **Execution Control** | 👁️ **Viewer** | `Sh@rdu#Rastogi2026` |
| **3** | **Chandra Bijay Singh** | `chandra.singh@ircon.org` | **Review** | 👁️ **Viewer** | `Ch@ndra#Singh2026` |

### 🌐 **Super Administrator Governance Accounts**
| Sl | User Name | Email ID | Designation | Document Capability | Official Password | Governance Privileges |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **1** | **Rajib Ghosh** | `rajib.g@rahee.com` | **Super Admin** | 👁️ **Viewer** | `R@jib#Ghosh2026` | User Creation & Management, Archival Policy, Document Restoration, Permanent Deletion |
| **2** | **Global System Admin** | `superadmin@enterprise-dms.com` | **Super Admin** | 👁️ **Viewer** | `SuperAdmin@123Sec` | Master Governance & System Configuration |

---

## 4. Granular Role-Based Access Control (RBAC) Matrix

| User Account | Designation | Upload | View | Preview | Download | Edit Metadata | Manage Folders | Manage Users | View Reports | Audit Logs | Delete Document |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Rajib Ghosh** / **Global Admin** | `Super Admin` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **(Super Admin Only)** |
| **Rahul Dey** (Rahee) | `Admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Somnath Mondal** (Rahee) | `Execution Control` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Kiran Sankar Chowdhury** (Rahee) | `Manager` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Mukesh Kumar Prasad** (Rahee) | `Manager` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Pintu Bhukta** (Rahee) | `Manager` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Ayush Khaitan** (Rahee) | `Manager` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Manoj Ghosh** (Rahee) | `Manager` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Arunabha Pyne** (Rahee) | `Manager` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Manish Kumar Patra** (Rahee) | `Viewer` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Om Jha** (Ircon) | `Admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Shardu Kumar Rastogi** (Ircon) | `Execution Control` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Chandra Bijay Singh** (Ircon) | `Review` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## 5. Document Upload Notification Routing Engine

When a document is uploaded, real-time in-app notifications and email logs are dispatched to designated stakeholders based on company rules:

### **Rahee Document Uploads:**
* ✅ **Receives Notifications**: `Rahul Dey`, `Kiran Sankar Chowdhury`, `Mukesh Kumar Prasad`, `Pintu Bhukta`, `Somnath Mondal`.
* ❌ **Notifications Suppressed**: `Manish Kumar Patra`, `Ayush Khaitan`, `Manoj Ghosh`, `Arunabha Pyne`.

### **Ircon Document Uploads:**
* ✅ **Receives Notifications**: `Om Jha`, `Shardu Kumar Rastogi`, `Chandra Bijay Singh`.

---

## 6. Cross-Company Universal Preview & Direct Download Policy

* **Universal Visibility**: All authenticated users from **Rahee Infratech** and **Ircon International** can search, open, preview, and download documents across both organizations in the central repository.
* **Streamed Binary Delivery**: High-capacity documents and large CAD models stream directly from the disk filesystem (`backend/uploads/`) with zero memory leakage.

---

## 7. Document Types & Smart Auto-Detection Dropdown

The upload form contains a clear dropdown with the following options:
* `-- Select Document Type --` (Placeholder)
* 📄 **PDF Document** (`.pdf`)
* 📐 **CAD Drawing / 3D Model** (`.dwg`, `.dxf`, `.stl`, `.obj`, `.step`, `.stp`, `.iges`)
* 📊 **Microsoft PowerPoint / PPT** (`.ppt`, `.pptx`)
* 🖼️ **Image** (`.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`)
* 📝 **Microsoft Word** (`.doc`, `.docx`)
* 📊 **Microsoft Excel** (`.xls`, `.xlsx`)

* **Smart Automatic Detection**: Selecting or dropping any file automatically detects its format, selects the right type in the dropdown, and cleans up the document title.

---

## 8. Unlimited Storage & High-Throughput Performance

* **Zero Artificial Limits**: Files are stored directly on disk without artificial size caps.
* **Generous Body Parser**: Express body parsers configured with `500mb` limits.
* **Anti-Malware Security**: Prohibits dangerous executable formats (`.exe`, `.bat`, `.cmd`, `.sh`, `.vbs`, `.msi`, `.dll`).

---

## 9. Security Governance & Document Deletion Protection

* **Super Admin Deletion Lock**:
  * Only **Rajib Ghosh** and the **Global System Administrator** have the authority to delete documents from the repository.
  * For all other users, requests to `DELETE /api/documents/:id` return **`HTTP 403 Forbidden`**.
* **Immutable Security Audit Trail**: Every deletion event logs the document ID, title, deleting user, timestamp, and IP address to `audit_logs`.

---

## 10. Document Archival & 1-Click Restoration Policy

* **Manual Document Archival (`POST /api/documents/:id/archive`)**: Super Admin can archive inactive documents.
* **1-Click Document Restoration (`POST /api/documents/:id/restore`)**: Super Admin can restore any archived document back into active status in the Bikramshila folder hierarchy.

---

## 11. Supported Document Formats & In-Browser Viewers

| Category | Supported File Extensions | Rendering Technology |
| :--- | :--- | :--- |
| **PDF Documents** | `.pdf` | Native PDF canvas with multi-page navigation and zoom |
| **Microsoft Word** | `.docx`, `.doc` | `Mammoth` HTML rendering engine |
| **Microsoft Excel** | `.xlsx`, `.xls` | `SheetJS` interactive multi-sheet data grid |
| **Microsoft PowerPoint** | `.pptx`, `.ppt` | `JSZip` slide extraction carousel |
| **CAD & 3D Blueprints** | `.dwg`, `.dxf`, `.stl`, `.obj`, `.step`, `.stp`, `.iges` | 2D/3D Blueprint Visualizer with pan, zoom, and 3D orbit controls |
| **Images** | `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg` | High-definition image preview |

---

## 12. Live Analytics & Interactive Reporting Engine

Located at `/reports` and `/dashboard`:
1. **Document Types Breakdown (Interactive Pie Chart)**: Live distribution of PDF, Word, Excel, PowerPoint, CAD, and Image files.
2. **Company Document Distribution (Bar Chart)**: Compares document counts under **Rahee Infratech** vs **Ircon International**.
3. **Workflow Status Breakdown**: Tracks documents across review states.
4. **Auto-Refresh Engine**: Polls every 5 seconds when the browser tab is active, with an on-demand manual refresh button.

---

## 13. Database Resilience & Zero-Crash Architecture

* **MySQL Connection Pool**: 30 connections with keep-alive packets and 20s timeout.
* **Self-Healing Auto-Retry**: Transient connection drops automatically retry up to 2 times without failing requests.
* **45-Second Heartbeat**: Background pings ensure database connections remain warm and prevent timeout drops.
* **Dynamic Host Resolution**: Frontend adapts to localhost, LAN IP, or domains automatically.

---

## 14. Installation & Startup Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher.
* **MySQL Server**: v8.0 or higher.

### 1. Backend Service
```powershell
cd backend
npm install
npm start
```
* **API Base URL**: `http://localhost:5000`
* **Health Check**: `http://localhost:5000/api/health`

### 2. Frontend Web Application
```powershell
cd frontend
npm install
npm run dev
```
* **Web UI**: `http://localhost:5173`

---

## 15. Complete REST API Reference

| Category | Method | Endpoint | Description | Access Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `POST` | `/api/auth/login` | Authenticate user & issue JWT tokens | Public |
| **Authentication** | `GET` | `/api/auth/me` | Retrieve active user profile & permissions | Authenticated |
| **Documents** | `GET` | `/api/documents` | Fetch all documents (filterable by folder) | All Users (`view`) |
| **Documents** | `POST` | `/api/documents` | Upload new document or drawing | Authorized Uploaders (`upload`) |
| **Documents** | `GET` | `/api/documents/:id/preview` | Stream file for in-browser viewing | All Users (`preview`) |
| **Documents** | `GET` | `/api/documents/:id/download` | Download original binary file | All Users (`download`) |
| **Documents** | `POST` | `/api/documents/:id/archive` | Move active document to archive | Super Admin |
| **Documents** | `POST` | `/api/documents/:id/restore` | Restore archived document to active tree | Super Admin |
| **Documents** | `DELETE` | `/api/documents/:id` | Permanently delete document | Super Admin |
| **Folders** | `GET` | `/api/folders` | Fetch Bikramshila directory tree | All Users |
| **Folders** | `POST` | `/api/folders` | Create subfolder under authorized branch | Admins / Super Admin |
| **Users** | `GET` | `/api/users` | List all system users & designations | All Users |
| **Users** | `POST` | `/api/users` | Create new user account | Super Admin (`manage_users`) |
| **Reports** | `GET` | `/api/reports/dashboard` | Real-time analytics & chart data | All Users (`view_reports`) |
| **Audit Logs** | `GET` | `/api/audit-logs` | Retrieve immutable system audit trail | All Users (`view_audit_logs`) |
