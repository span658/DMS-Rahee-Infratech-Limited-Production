const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { logAudit } = require('../services/audit.service');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutes

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email ID and Password are required.' });
    }

    // 1. Find user by email
    const users = await db.query(
      `SELECT u.*, r.name as role_name, o.name as organization_name, o.code as organization_code
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    const user = users[0];

    if (!user) {
      await logAudit({
        user_email: email,
        action: 'LOGIN_FAILED',
        comment: 'Login attempt failed: Email address not registered.',
        req
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials provided.' });
    }

    // 2. Account Lockout Check
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      await logAudit({
        organization_id: user.organization_id,
        user_id: user.id,
        user_email: user.email,
        action: 'LOGIN_FAILED',
        comment: 'Login attempted on locked out account.',
        req
      });
      return res.status(429).json({
        success: false,
        message: 'Account is temporarily locked out due to multiple failed login attempts. Please try again later.'
      });
    }

    // 3. Status Check
    if (user.status !== 'ACTIVE') {
      await logAudit({
        organization_id: user.organization_id,
        user_id: user.id,
        user_email: user.email,
        action: 'LOGIN_FAILED',
        comment: 'Login attempted on disabled account.',
        req
      });
      return res.status(403).json({ success: false, message: 'Your account is disabled. Please contact system administrator.' });
    }

    // 4. Password Verification
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockoutDate = null;

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        lockoutDate = new Date(Date.now() + LOCKOUT_TIME_MS).toISOString().slice(0, 19).replace('T', ' ');
      }

      await db.query(
        `UPDATE users SET failed_login_attempts = ?, lockout_until = ? WHERE id = ?`,
        [attempts, lockoutDate, user.id]
      );

      await logAudit({
        organization_id: user.organization_id,
        user_id: user.id,
        user_email: user.email,
        action: 'LOGIN_FAILED',
        comment: `Invalid password. Failed attempt ${attempts}/${MAX_FAILED_ATTEMPTS}.`,
        req
      });

      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 5. Reset failed attempts on success
    await db.query(
      `UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = ?`,
      [user.id]
    );

    // 6. Fetch permissions
    const permissions = await db.query(
      `SELECT p.code 
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ?`,
      [user.role_id]
    );

    const permissionCodes = permissions.map(p => p.code);

    // 7. Create Tokens
    const tokenPayload = {
      userId: user.id,
      organizationId: user.organization_id,
      roleId: user.role_id,
      roleName: user.role_name,
      isSuperAdmin: user.role_name === 'SUPER_ADMIN' || user.organization_id === null
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 8. Record Successful Login Audit
    await logAudit({
      organization_id: user.organization_id,
      user_id: user.id,
      user_email: user.email,
      user_name: user.name,
      action: 'LOGIN_SUCCESS',
      comment: `User authenticated successfully (${user.organization_name || 'Super Admin'}).`,
      req
    });

    // 9. Response payload (Never return password)
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
        organization_id: user.organization_id,
        organization_name: user.organization_name,
        organization_code: user.organization_code,
        is_super_admin: user.role_name === 'SUPER_ADMIN',
        permissions: permissionCodes
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const accessToken = generateAccessToken({
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      roleId: decoded.roleId,
      roleName: decoded.roleName,
      isSuperAdmin: decoded.isSuperAdmin
    });

    return res.json({ success: true, accessToken });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
}

async function me(req, res) {
  return res.json({
    success: true,
    user: req.user
  });
}

async function logout(req, res) {
  if (req.user) {
    await logAudit({
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      user_email: req.user.email,
      action: 'LOGOUT',
      comment: 'User logged out of system.',
      req
    });
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
}

module.exports = {
  login,
  refresh,
  me,
  logout
};
