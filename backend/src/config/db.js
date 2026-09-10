const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

let dbDriver = 'sqlite'; // 'mysql' or 'sqlite'
let sqliteDb = null;
let mysqlPool = null;

// Initialize Database connection and tables
async function initDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root';
  const dbName = process.env.DB_NAME || 'enterprise_dms';

  let mysqlConnected = false;

  try {
    // Try connecting to MySQL first
    const rootConnection = await mysql.createConnection({ host, port, user, password });
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await rootConnection.end();

    mysqlPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });

    // Test query
    const [rows] = await mysqlPool.query('SELECT 1 + 1 AS result');
    if (rows) {
      dbDriver = 'mysql';
      mysqlConnected = true;
      console.log('Successfully connected to MySQL database engine:', dbName);
    }
  } catch (err) {
    console.warn('MySQL connection skipped or failed (' + err.message + '). Falling back to embedded SQLite database engine.');
  }

  if (!mysqlConnected) {
    dbDriver = 'sqlite';
    const dbDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'enterprise_dms.sqlite');
    sqliteDb = new sqlite3.Database(dbPath);
    console.log('Successfully initialized SQLite database engine at:', dbPath);
  }

  await createTables();
  await seedInitialData();
}

// Universal Query Helper
async function query(sql, params = []) {
  if (dbDriver === 'mysql') {
    // Format SQL query parameters for MySQL
    const [results] = await mysqlPool.query(sql, params);
    return results;
  } else {
    // Format SQL for SQLite (replace `id AUTO_INCREMENT` logic if needed, SQLite uses standard SQL)
    return new Promise((resolve, reject) => {
      // Normalize MySQL AUTO_INCREMENT & DATETIME types for SQLite compatibility
      let normalizedSql = sql
        .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
        .replace(/ENGINE=InnoDB/gi, '')
        .replace(/DATETIME/gi, 'TEXT')
        .replace(/TINYINT/gi, 'INTEGER');

      const isSelect = normalizedSql.trim().toUpperCase().startsWith('SELECT') || normalizedSql.trim().toUpperCase().startsWith('PRAGMA');

      if (isSelect) {
        sqliteDb.all(normalizedSql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      } else {
        sqliteDb.run(normalizedSql, params, function (err) {
          if (err) return reject(err);
          resolve({ insertId: this.lastID, affectedRows: this.changes });
        });
      }
    });
  }
}

async function createTables() {
  // Organizations
  await query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY ${dbDriver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Roles
  await query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY ${dbDriver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Permissions
  await query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY ${dbDriver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      code VARCHAR(100) NOT NULL UNIQUE,
      description TEXT
    );
  `);

  // Role Permissions
  await query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id)
    );
  `);

  // Users
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY ${dbDriver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      organization_id INTEGER,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role_id INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      failed_login_attempts INTEGER DEFAULT 0,
      lockout_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Documents
  await query(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY ${dbDriver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      organization_id INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) DEFAULT 'General',
      document_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW_1',
      current_version_id INTEGER,
      current_version_number VARCHAR(20) DEFAULT 'V1',
      is_locked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration helper for existing DB instances
  try { await query('ALTER TABLE organizations ADD COLUMN allow_final_download INTEGER DEFAULT 1'); } catch (e) {}
  try { await query('ALTER TABLE documents ADD COLUMN approval_cycle INTEGER DEFAULT 1'); } catch (e) {}
  try { await query('ALTER TABLE documents ADD COLUMN parent_document_id INTEGER'); } catch (e) {}

  // Document Versions
  await query(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id INTEGER PRIMARY KEY ${dbDriver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      document_id INTEGER NOT NULL,
      organization_id INTEGER NOT NULL,
      version_number VARCHAR(50) NOT NULL,
      version_index REAL NOT NULL,
      original_filename VARCHAR(255) NOT NULL,
      storage_key VARCHAR(255) NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_hash VARCHAR(100) NOT NULL,
      uploaded_by INTEGER NOT NULL,
      change_description TEXT,
      review_status VARCHAR(50) DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Document Reviews
  await query(`
    CREATE TABLE IF NOT EXISTS document_reviews (
      id INTEGER PRIMARY KEY ${dbDriver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      document_id INTEGER NOT NULL,
      document_version_id INTEGER NOT NULL,
      organization_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      reviewer_role VARCHAR(50) NOT NULL,
      action VARCHAR(50) NOT NULL,
      comments TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Notifications
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY ${dbDriver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      organization_id INTEGER,
      recipient_id INTEGER NOT NULL,
      sender_id INTEGER,
      document_id INTEGER,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Email Outbox / Activity Logs
  await query(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY ${dbDriver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      recipient_email VARCHAR(255) NOT NULL,
      recipient_name VARCHAR(255),
      subject VARCHAR(255) NOT NULL,
      body_html TEXT NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      document_title VARCHAR(255),
      status VARCHAR(50) DEFAULT 'SENT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Audit Logs
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY ${dbDriver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      organization_id INTEGER,
      user_id INTEGER,
      user_email VARCHAR(255),
      user_name VARCHAR(255),
      action VARCHAR(100) NOT NULL,
      document_id INTEGER,
      version VARCHAR(50),
      comment TEXT,
      ip_address VARCHAR(100),
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Folders Table (Supports Parent-Child Sub-Folder Hierarchy)
  await query(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY ${dbDriver === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      organization_id INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      parent_id INTEGER DEFAULT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add parent_id to folders
  try {
    await query('ALTER TABLE folders ADD COLUMN parent_id INTEGER');
  } catch (e) {
    // Column already exists
  }

  // Migration: Add folder_id to documents
  try {
    await query('ALTER TABLE documents ADD COLUMN folder_id INTEGER');
  } catch (e) {
    // Column already exists
  }

  // Migration: Add manage_folders permission (Permission ID 11)
  try {
    const existingPerm = await query('SELECT * FROM permissions WHERE code = ?', ['manage_folders']);
    if (!existingPerm || existingPerm.length === 0) {
      await query('INSERT INTO permissions (id, code, description) VALUES (11, ?, ?)', [
        'manage_folders',
        'Allows creating and managing tenant document folders'
      ]);
      // Assign EXCLUSIVELY to Company Admins: Roles 1 (Super Admin), 2 (Rahee Admin Reviewer - Rahul Dey), 3 (Rahee Exec Admin - Rajib Ghosh), 8 (Ircon Admin Reviewer - Shardu Rastogi)
      for (const roleId of [1, 2, 3, 8]) {
        try {
          await query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, 11)', [roleId]);
        } catch (rpErr) {}
      }

      // Ensure Roles 6 & 7 (Document Uploader - Om Jha) are strictly removed from manage_folders
      try {
        await query('DELETE FROM role_permissions WHERE role_id IN (6, 7) AND permission_id = 11');
      } catch (e) {}
    } else {
      // Ensure Roles 6 & 7 (Document Uploader - Om Jha) are strictly removed from manage_folders
      try {
        await query('DELETE FROM role_permissions WHERE role_id IN (6, 7) AND permission_id = 11');
      } catch (e) {}
    }
  } catch (e) {
    console.warn('Folder permissions migration check warning:', e.message);
  }
}

async function seedInitialData() {
  // Check if organizations exist
  const orgs = await query('SELECT COUNT(*) as cnt FROM organizations');
  const count = orgs[0] ? (orgs[0].cnt || orgs[0]['COUNT(*)']) : 0;
  if (count > 0) {
    console.log('Database tables already seeded.');
    return;
  }

  console.log('Seeding initial system roles, permissions, organizations, and user accounts...');

  // 1. System Roles matching Master Requirements Matrix
  const roles = [
    { id: 1, name: 'SUPER_ADMIN', description: 'System Super Administrator with full permissions' },
    { id: 2, name: 'RAHEE_ADMIN_REVIEWER', description: 'Company 1 Admin & Step 1 Reviewer' },
    { id: 3, name: 'RAHEE_EXEC_ADMIN', description: 'Company 1 Executive Admin & User Manager' },
    { id: 4, name: 'STEP2_REVIEWER', description: 'Step 2 Workflow Reviewer' },
    { id: 5, name: 'FINAL_APPROVER', description: 'Step 3 Final Document Approver' },
    { id: 6, name: 'MANAGER_OVERSIGHT', description: 'Departmental Manager Oversight & Reports' },
    { id: 7, name: 'DOCUMENT_UPLOADER', description: 'Document Uploader & Revision Submitter' },
    { id: 8, name: 'IRCON_ADMIN_REVIEWER', description: 'Company 2 Admin & Step 1 Reviewer' }
  ];

  for (const r of roles) {
    await query('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)', [r.id, r.name, r.description]);
  }

  // 2. Permission Keys
  const permissions = [
    { id: 1, code: 'upload', description: 'Allows uploading new Microsoft Word, PDF, Excel, PPTX, and Image files' },
    { id: 2, code: 'view', description: 'Access to document search, metadata, and directory listings' },
    { id: 3, code: 'preview', description: 'Allows opening and previewing documents in browser streams' },
    { id: 4, code: 'edit', description: 'Allows updating document metadata and uploading revised versions' },
    { id: 5, code: 'download', description: 'Allows downloading original binary files to local disk' },
    { id: 6, code: 'approve_reject', description: 'Allows intermediate step approvals or rejections in workflow' },
    { id: 7, code: 'final_approve', description: 'Grants Step 3 Final Approver status to publish documents into APPROVED state' },
    { id: 8, code: 'manage_users', description: 'Grants ability to create/edit user accounts and assign permissions' },
    { id: 9, code: 'view_audit_logs', description: 'Access to system-wide security audit trail logs' },
    { id: 10, code: 'view_reports', description: 'Access to storage breakdown, employee metrics, and workflow reports' }
  ];

  for (const p of permissions) {
    await query('INSERT INTO permissions (id, code, description) VALUES (?, ?, ?)', [p.id, p.code, p.description]);
  }

  // Role Permissions Mapping helper
  const addRolePermissions = async (roleId, permIds) => {
    for (const pid of permIds) {
      await query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, pid]);
    }
  };

  // 1: SUPER_ADMIN (All: 1..10)
  await addRolePermissions(1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  // 2: RAHEE_ADMIN_REVIEWER (Rahul Dey: view, preview, edit, download, approve_reject, view_audit_logs, view_reports)
  await addRolePermissions(2, [2, 3, 4, 5, 6, 9, 10]);
  // 3: RAHEE_EXEC_ADMIN (Rajib Ghosh: upload, view, preview, edit, download, approve_reject, manage_users, view_audit_logs, view_reports)
  await addRolePermissions(3, [1, 2, 3, 4, 5, 6, 8, 9, 10]);
  // 4: STEP2_REVIEWER (Kiran Sankar Chowdhury: view, preview, edit, download, approve_reject, view_audit_logs, view_reports)
  await addRolePermissions(4, [2, 3, 4, 5, 6, 9, 10]);
  // 5: FINAL_APPROVER (Manoj Ghosh: view, preview, download, final_approve)
  await addRolePermissions(5, [2, 3, 5, 7]);
  // 6: MANAGER_OVERSIGHT (Mukesh Prasad, Pintu Bhukta, Somenath Mondal, Ayush Khaitan, Arunabha Pyne: view, preview, edit, download, view_audit_logs, view_reports)
  await addRolePermissions(6, [2, 3, 4, 5, 9, 10]);
  // 7: DOCUMENT_UPLOADER (Om Jha, Chandra Bijay Singh: upload, view, preview, edit, download)
  await addRolePermissions(7, [1, 2, 3, 4, 5]);
  // 8: IRCON_ADMIN_REVIEWER (Shardu Kumar Rastogi: view, preview, download, approve_reject, view_audit_logs, view_reports)
  await addRolePermissions(8, [2, 3, 5, 6, 9, 10]);

  // 3. Organizations
  await query('INSERT INTO organizations (id, name, code, status) VALUES (?, ?, ?, ?)', [
    1, 'Rahee Infratech Limited', 'RAHEE', 'ACTIVE'
  ]);
  await query('INSERT INTO organizations (id, name, code, status) VALUES (?, ?, ?, ?)', [
    2, 'Ircon International Limited', 'IRCON', 'ACTIVE'
  ]);

  // 4. Pre-hash Master User Passwords using bcrypt (salt rounds: 10)
  const hashedUsers = [
    // Super Admin (System Level)
    {
      id: 1,
      organization_id: null,
      name: 'Global System Administrator',
      email: 'superadmin@enterprise-dms.com',
      password_hash: await bcrypt.hash('SuperAdmin@123Sec', 10),
      role_id: 1
    },
    // Company 1: Rahee Infratech Limited Users
    {
      id: 5,
      organization_id: 1,
      name: 'Rahul Dey',
      email: 'rahul.d@rahee.com',
      password_hash: await bcrypt.hash('R@hul#Dey2026', 10),
      role_id: 2 // RAHEE_ADMIN_REVIEWER: upload, view, preview, edit, download, approve_reject, view_audit_logs, view_reports
    },
    {
      id: 11,
      organization_id: null, // Executive Super Admin: Cross-Company Control for both Company 1 & Company 2
      name: 'Rajib Ghosh',
      email: 'rajib.g@rahee.com',
      password_hash: await bcrypt.hash('R@jib#Ghosh2026', 10),
      role_id: 1 // SUPER_ADMIN: Full system control across Company 1 (Rahee) & Company 2 (Ircon)
    },
    {
      id: 6,
      organization_id: 1,
      name: 'Kiran Sankar Chowdhury',
      email: 'kiransankar.c@rahee.com',
      password_hash: await bcrypt.hash('K1ran#Sankar2026', 10),
      role_id: 4 // STEP2_REVIEWER: view, preview, edit, download, approve_reject, view_audit_logs, view_reports
    },
    {
      id: 13,
      organization_id: 1,
      name: 'Manoj Ghosh',
      email: 'manoj.g@rahee.com',
      password_hash: await bcrypt.hash('M@noj#Ghosh2026', 10),
      role_id: 5 // FINAL_APPROVER: view, preview, download, final_approve
    },
    {
      id: 7,
      organization_id: 1,
      name: 'Mukesh Kumar Prasad',
      email: 'mukesh.p@rahee.com',
      password_hash: await bcrypt.hash('M@kesh#Prasad2026', 10),
      role_id: 6 // MANAGER_OVERSIGHT: view, preview, download, view_audit_logs, view_reports
    },
    {
      id: 8,
      organization_id: 1,
      name: 'Pintu Bhukta',
      email: 'pintu.b@rahee.com',
      password_hash: await bcrypt.hash('P1ntu#Bhukta2026', 10),
      role_id: 6 // MANAGER_OVERSIGHT: view, preview, download, view_audit_logs, view_reports
    },
    {
      id: 9,
      organization_id: 1,
      name: 'Somenath Mondal',
      email: 's.mondal@rahee.com',
      password_hash: await bcrypt.hash('S@menath#Mondal2026', 10),
      role_id: 6 // MANAGER_OVERSIGHT: view, preview, download, view_audit_logs, view_reports
    },
    {
      id: 12,
      organization_id: 1,
      name: 'Ayush Khaitan',
      email: 'ayush.k@rahee.com',
      password_hash: await bcrypt.hash('Ayu$h#Khaitan2026', 10),
      role_id: 6 // MANAGER_OVERSIGHT: view, preview, download, view_audit_logs, view_reports
    },
    {
      id: 14,
      organization_id: 1,
      name: 'Arunabha Pyne',
      email: 'arunabha.p@rahee.com',
      password_hash: await bcrypt.hash('Arun#Pyne2026', 10),
      role_id: 6 // MANAGER_OVERSIGHT: view, preview, download, view_audit_logs, view_reports
    },
    {
      id: 10,
      organization_id: 1,
      name: 'Om Jha',
      email: 'om.jha@rahee.com',
      password_hash: await bcrypt.hash('Om#Jha2026', 10),
      role_id: 7 // DOCUMENT_UPLOADER: upload, view, preview, edit, download
    },
    // Company 2: Ircon International Limited Users
    {
      id: 2,
      organization_id: 2,
      name: 'Shardu Kumar Rastogi',
      email: 'shardu.rastogi@ircon.org',
      password_hash: await bcrypt.hash('Sh@rdu#Rastogi2026', 10),
      role_id: 8 // IRCON_ADMIN_REVIEWER: view, preview, download, approve_reject, view_audit_logs, view_reports
    },
    {
      id: 3,
      organization_id: 2,
      name: 'Chandra Bijay Singh',
      email: 'chandra.singh@ircon.org',
      password_hash: await bcrypt.hash('Ch@ndra#Singh2026', 10),
      role_id: 7 // DOCUMENT_UPLOADER: upload, view, preview, edit, download
    }
  ];

  for (const u of hashedUsers) {
    await query(
      'INSERT INTO users (id, organization_id, name, email, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [u.id, u.organization_id, u.name, u.email, u.password_hash, u.role_id, 'ACTIVE']
    );
  }

  // Create initial Sample Seed Documents for Company 1 & Company 2
  const seedDocs = [
    {
      id: 1,
      organization_id: 1,
      uploaded_by: 10, // Om Jha
      title: 'Rahee Infrastructure Technical Design Proposal 2026',
      description: 'Technical design specifications and project timeline proposal for Rahee Infratech Limited.',
      category: 'Technical',
      document_type: 'PDF',
      status: 'PENDING_REVIEW_1',
      version_number: 'V1',
      original_filename: 'Rahee_Design_Proposal_2026.pdf'
    },
    {
      id: 2,
      organization_id: 2,
      uploaded_by: 3, // Chandra Bijay Singh
      title: 'Ircon Track Alignment & Engineering Specification 2026',
      description: 'Engineering and safety guidelines for Ircon International Limited railway projects.',
      category: 'Engineering',
      document_type: 'PDF',
      status: 'PENDING_REVIEW_1',
      version_number: 'V1',
      original_filename: 'Ircon_Track_Specification_2026.pdf'
    }
  ];

  for (const doc of seedDocs) {
    const existingDoc = await query('SELECT id FROM documents WHERE id = ?', [doc.id]);
    if (!existingDoc || existingDoc.length === 0) {
      await query(
        `INSERT INTO documents (id, organization_id, uploaded_by, title, description, category, document_type, status, current_version_number, is_locked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [doc.id, doc.organization_id, doc.uploaded_by, doc.title, doc.description, doc.category, doc.document_type, doc.status, doc.version_number]
      );

      const verRes = await query(
        `INSERT INTO document_versions (document_id, organization_id, version_number, version_index, original_filename, storage_key, file_size, mime_type, file_hash, uploaded_by, change_description, review_status)
         VALUES (?, ?, ?, 1.0, ?, 'sample_test.pdf', 1024, 'application/pdf', 'samplehash123456789', ?, 'Initial document submission', ?)`,
        [doc.id, doc.organization_id, doc.version_number, doc.original_filename, doc.uploaded_by, doc.status]
      );

      const verId = verRes.insertId || doc.id;
      await query('UPDATE documents SET current_version_id = ? WHERE id = ?', [verId, doc.id]);
    }
  }

  console.log('Seeding completed successfully!');
}

module.exports = {
  initDatabase,
  query,
  getDriver: () => dbDriver
};
