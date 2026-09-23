# 📘 Enterprise Document Management System (EDMS)
## Comprehensive Feature Guide & System Specifications

---

## 1. System Health & Architecture Status

> [!IMPORTANT]
> **Status: 100% OPERATIONAL & VERIFIED**
> - **Database Engine**: MySQL 8.0+ with Connection Pooling (`connectionLimit: 10`, `waitForConnections: true`).
> - **High-Throughput Performance**: Rate limiting removed (`max: unlimited`) for unlimited concurrent requests and fast syncing.
> - **Frontend Web App**: React 19 + Vite 8 compiled cleanly with **0 errors**.
> - **Backend REST API**: Active on `http://localhost:5000` (Status: `200 UP`).

---

## 2. Core Enterprise Features

### Feature 1: Universal Cross-Company Preview & Download (Both Companies)
* **Unified Environment**: Both **Rahee Infratech Limited** and **Ircon International Limited** operate inside the central **Bikramshila** repository.
* **Seamless Access**: Every authenticated user from both companies can search, view, preview, and download documents across both `RAHEE` and `IRCON` branches.

---

### Feature 2: High-Definition In-Browser Viewers for All File Types
* **PDF Documents (`.pdf`)**: Native multi-page canvas with smooth pagination and zooming.
* **Microsoft Word (`.doc`, `.docx`)**: `Mammoth` HTML rendering engine with table and format preservation.
* **Microsoft Excel (`.xls`, `.xlsx`)**: `SheetJS` responsive multi-sheet data grid with tab switching.
* **Microsoft PowerPoint (`.ppt`, `.pptx`)**: `JSZip` XML slide extraction and carousel view.
* **CAD Drawings & 3D Blueprints (`.dwg`, `.dxf`, `.stl`, `.obj`, `.step`, `.stp`, `.iges`)**: 2D/3D Blueprint Canvas Visualizer with pan, zoom, and 3D orbit rotation.
* **Images (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`)**: High-definition image display.

---

### Feature 3: Central Bikramshila Folder Governance & Main Branches
* **Super Admin View (Rajib Ghosh)**: Sees the central **`Bikramshila`** root folder and both company branches (**`RAHEE`** and **`IRCON`**).
* **Rahee Users View**: Direct root starts at **`RAHEE`** main branch with all subfolders.
* **Ircon Users View**: Direct root starts at **`IRCON`** main branch with all subfolders.
* **Operational Folders**: Admins can mark folders as `Operational` (`is_operational = 1`) to protect critical safety guidelines and manuals from automated archival.

---

### Feature 4: Granular Upload & Deletion Safeguards
* **Restricted Document Upload**:
  * **Rahee**: Restricted to **Rahul Dey** and **Somnath Mondal**.
  * **Ircon**: Restricted to **Om Jha**.
* **Super Admin Deletion Protection**:
  * Document deletion is strictly locked to Super Admin (`Rajib Ghosh` / `Global Admin`). Requests from unauthorized users return `HTTP 403 Forbidden`.
* **1-Click Document Restoration**:
  * Super Admin can restore archived documents back into active status with real-time stakeholder alerts.

---

### Feature 5: Real-Time Analytics & Live Reporting
* **Interactive Charts**: File format distribution (Pie Chart), Company repository comparison (Bar Chart), and Workflow status breakdown.
* **5-Second Auto-Refresh**: Background polling refreshes live statistics automatically when the tab is visible.

---

## 3. Master User Registry Reference

| Company | User Name | Email | Designation | Document Capability | Default Password |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Governance** | **Rajib Ghosh** | `rajib.g@rahee.com` | `Super Admin` | 👁️ Viewer | `Password@123` |
| **Governance** | **Global Admin** | `superadmin@enterprise-dms.com` | `Super Admin` | 👁️ Viewer | `Password@123` |
| **Rahee** | **Rahul Dey** | `rahul.d@rahee.com` | `Admin` | 📤 **Upload** | `Password@123` |
| **Rahee** | **Somnath Mondal** | `s.mondal@rahee.com` | `Execution Control` | 📤 **Upload** | `Password@123` |
| **Rahee** | **Kiran Sankar Chowdhury**| `kiransankar.c@rahee.com`| `Manager` | 👁️ Viewer | `Password@123` |
| **Rahee** | **Mukesh Kumar Prasad** | `mukesh.p@rahee.com` | `Manager` | 👁️ Viewer | `Password@123` |
| **Rahee** | **Pintu Bhukta** | `pintu.b@rahee.com` | `Manager` | 👁️ Viewer | `Password@123` |
| **Rahee** | **Ayush Khaitan** | `ayush.k@rahee.com` | `Manager` | 👁️ Viewer | `Password@123` |
| **Rahee** | **Manoj Ghosh** | `manoj.g@rahee.com` | `Manager` | 👁️ Viewer | `Password@123` |
| **Rahee** | **Arunabha Pyne** | `arunabha.p@rahee.com` | `Manager` | 👁️ Viewer | `Password@123` |
| **Rahee** | **Manish Kumar Patra** | `manish.p@rahee.com` | `Viewer` | 👁️ Viewer | `Password@123` |
| **Ircon** | **Om Jha** | `om.jha@ircon.org` | `Admin` | 📤 **Upload** | `Password@123` |
| **Ircon** | **Shardu Kumar Rastogi** | `shardu.rastogi@ircon.org` | `Execution Control` | 👁️ Viewer | `Password@123` |
| **Ircon** | **Chandra Bijay Singh** | `chandra.singh@ircon.org` | `Review` | 👁️ Viewer | `Password@123` |
