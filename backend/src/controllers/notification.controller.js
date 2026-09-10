const db = require('../config/db');

async function getNotifications(req, res) {
  try {
    const notifications = await db.query(
      `SELECT n.*, u.name as sender_name 
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.recipient_id = ?
       ORDER BY n.id DESC
       LIMIT 100`,
      [req.user.id]
    );

    const unreadCountRes = await db.query(
      "SELECT COUNT(*) as cnt FROM notifications WHERE recipient_id = ? AND (is_read = 0 OR is_read = '0' OR is_read IS FALSE)",
      [req.user.id]
    );
    const rawCnt = unreadCountRes[0] ? (unreadCountRes[0].cnt !== undefined ? unreadCountRes[0].cnt : unreadCountRes[0]['COUNT(*)']) : 0;
    const unreadCount = parseInt(rawCnt || 0, 10);

    return res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?', [id, req.user.id]);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function markAllAsRead(req, res) {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?', [req.user.id]);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Fetch Email Logs (Outbox Activity)
async function getEmailLogs(req, res) {
  try {
    let sql = 'SELECT * FROM email_logs';
    let params = [];

    if (!req.user.is_super_admin) {
      sql += ' WHERE recipient_email = ?';
      params.push(req.user.email);
    }

    sql += ' ORDER BY id DESC LIMIT 100';

    const emailLogs = await db.query(sql, params);
    return res.json({ success: true, emailLogs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getEmailLogs
};
