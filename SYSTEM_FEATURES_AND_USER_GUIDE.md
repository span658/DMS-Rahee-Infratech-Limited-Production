# 📘 Enterprise Document Management System (EDMS)
## Comprehensive Feature Guide & Master System Specifications

---

## 1. System Health & Infrastructure Architecture

> [!IMPORTANT]
> **Status: 100% OPERATIONAL & VERIFIED**
> - **Database Engine**: MySQL 8.0+ on `127.0.0.1:3306` (`enterprise_dms`) with High-Resilience Connection Pooling (`connectionLimit: 30`, `maxIdle: 10`, `enableKeepAlive: true`, `connectTimeout: 20000`).
> - **Zero-Crash & Self-Healing**: Automated query retry on transient drops (`ECONNRESET`, `ETIMEDOUT`, deadlock) and 45s heartbeat pings.
> - **Storage & Upload Engine**: **Unlimited File Storage Capacity** with 500MB payload support for large CAD blueprints and multi-page engineering files.
> - **Dynamic Network & IP Support**: Automatically adapts to `localhost`, `127.0.0.1`, LAN IP (`192.168.X.X`), or custom domains without host mismatch or CORS errors.
> - **Frontend Web Application**: React 19 + Vite 8 compiled cleanly with **0 errors** on `http://localhost:5173`.
> - **Backend REST & WebSocket API**: Active on `http://localhost:5000` (Status: `200 UP`).

---

## 2. Core Enterprise Specifications & Features

### Feature 1: Universal Cross-Company Preview & Download
* **Central Directory**: Both **Rahee Infratech Limited** (Company 1) and **Ircon International Limited** (Company 2) operate inside the central **Bikramshila** root repository.
* **Open Cross-Company Visibility**: All 14 authenticated users across both companies have full rights to search, view, preview, and download documents across both `RAHEE` and `IRCON` branches.

---

### Feature 2: Document Types & Smart Auto-Detection Dropdown
* **Supported Categories in Upload Form**:
  - `-- Select Document Type --` (Default placeholder)
  - 📄 **PDF Document** (`.pdf`)
  - 📐 **CAD Drawing / 3D Model** (`.dwg`, `.dxf`, `.stl`, `.obj`, `.step`, `.stp`, `.iges`)
  - 📊 **Microsoft PowerPoint / PPT** (`.ppt`, `.pptx`)
  - 🖼️ **Image** (`.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`)
  - 📝 **Microsoft Word** (`.doc`, `.docx`)
  - 📊 **Microsoft Excel** (`.xls`, `.xlsx`)
* **Smart Auto-Detection**: Dragging and dropping or selecting a file automatically detects the extension, sets the matching dropdown type, and populates the document title.
* **Malware Guard**: Executable extensions (`.exe`, `.bat`, `.cmd`, `.sh`, `.vbs`, `.msi`, `.dll`) are strictly prohibited.

---

### Feature 3: Targeted Upload Notification Matrix
* **Rahee Document Upload**: Sends alerts to `rahul.d`, `kiransankar.c`, `mukesh.p`, `pintu.b`, and `s.mondal` (Excludes: `ayush.k`, `manoj.g`, `arunabha.p`, `manish.p`).
* **Ircon Document Upload**: Sends alerts strictly to Ircon stakeholders (`om.jha`, `shardu.rastogi`, `chandra.singh`).

---

### Feature 4: High-Definition In-Browser Document Viewers
* **PDF Documents (`.pdf`)**: Native multi-page canvas with smooth pagination and zooming.
* **Microsoft Word (`.doc`, `.docx`)**: `Mammoth` HTML rendering engine with table and format preservation.
* **Microsoft Excel (`.xls`, `.xlsx`)**: `SheetJS` responsive multi-sheet data grid with tab switching.
* **Microsoft PowerPoint (`.ppt`, `.pptx`)**: `JSZip` XML slide extraction and carousel view.
* **CAD Drawings & 3D Blueprints (`.dwg`, `.dxf`, `.stl`, `.obj`, `.step`, `.stp`, `.iges`)**: 2D/3D Blueprint Canvas Visualizer with pan, zoom, and 3D orbit rotation.
* **Images (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`)**: High-definition image display.

---

### Feature 5: Bikramshila Central Folder Governance
* **Hierarchical Nesting**: Multi-level subfolders supported up to Level 4+ depth.
* **Live Document Counter Badges**: Displays cumulative document counts for every folder and its subdirectories.
* **Super Admin View (Rajib Ghosh)**: Full control across the root `Bikramshila` folder and both company branches (`RAHEE` and `IRCON`).
* **Company Branch Admins**: Rahul Dey manages folders under `RAHEE`, Om Jha manages folders under `IRCON`.

---

### Feature 6: Exclusive Super Admin User Management & Lifecycle Control
* **Exclusive Authority**: Only Super Admins (`Rajib Ghosh` & `superadmin@enterprise-dms.com`) can create, archive, restore, or permanently delete user accounts.
* **Document Deletion & Restoration**: Super Admin can restore archived documents back into active status or permanently delete them with full audit logging.

---

## 3. Official Master User Registry & Credentials

| Company | User Name | Email | System Role | Designation | Capability | Official Password |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **Global** | **Global Admin** | `superadmin@enterprise-dms.com` | `SUPER_ADMIN` | Super Admin | 👁️ Full Governance | `SuperAdmin@123Sec` |
| **Global / Rahee** | **Rajib Ghosh** | `rajib.g@rahee.com` | `SUPER_ADMIN` | Super Admin | 👁️ Full Governance | `R@jib#Ghosh2026` |
| **Rahee** | **Rahul Dey** | `rahul.d@rahee.com` | `RAHEE_ADMIN` | Admin | 📤 **Upload** | `R@hul#Dey2026` |
| **Rahee** | **Somnath Mondal** | `s.mondal@rahee.com` | `DOCUMENT_UPLOADER` | Execution Control | 📤 **Upload** | `S@menath#Mondal2026` |
| **Rahee** | **Kiran Sankar Chowdhury** | `kiransankar.c@rahee.com` | `MANAGER_OVERSIGHT` | Manager | 👁️ Viewer | `K1ran#Sankar2026` |
| **Rahee** | **Mukesh Kumar Prasad** | `mukesh.p@rahee.com` | `MANAGER_OVERSIGHT` | Manager | 👁️ Viewer | `M@kesh#Prasad2026` |
| **Rahee** | **Pintu Bhukta** | `pintu.b@rahee.com` | `MANAGER_OVERSIGHT` | Manager | 👁️ Viewer | `P1ntu#Bhukta2026` |
| **Rahee** | **Ayush Khaitan** | `ayush.k@rahee.com` | `MANAGER_OVERSIGHT` | Manager | 👁️ Viewer | `Ayu$h#Khaitan2026` |
| **Rahee** | **Manoj Ghosh** | `manoj.g@rahee.com` | `MANAGER_OVERSIGHT` | Manager | 👁️ Viewer | `M@noj#Ghosh2026` |
| **Rahee** | **Arunabha Pyne** | `arunabha.p@rahee.com` | `MANAGER_OVERSIGHT` | Manager | 👁️ Viewer | `Arun#Pyne2026` |
| **Rahee** | **Manish Kumar Patra** | `manish.p@rahee.com` | `MANAGER_OVERSIGHT` | Viewer | 👁️ Viewer | `M@nish#Patra2026` |
| **Ircon** | **Om Jha** | `om.jha@ircon.org` | `IRCON_ADMIN` | Admin | 📤 **Upload** | `Om#Jha2026` |
| **Ircon** | **Shardu Kumar Rastogi** | `shardu.rastogi@ircon.org` | `MANAGER_OVERSIGHT` | Execution Control | 👁️ Viewer | `Sh@rdu#Rastogi2026` |
| **Ircon** | **Chandra Bijay Singh** | `chandra.singh@ircon.org` | `MANAGER_OVERSIGHT` | Review | 👁️ Viewer | `Ch@ndra#Singh2026` |
