const db = require('../config/db');
const { sendWorkflowEmail, generateEmailTemplate } = require('../config/email');

let io = null;

function setSocketIO(socketServer) {
  io = socketServer;
}

async function sendNotification({ recipientId, senderId, documentId, title, message, type, organizationId, emailDetails }) {
  try {
    // 1. Save In-App Notification in DB
    const res = await db.query(
      `INSERT INTO notifications (organization_id, recipient_id, sender_id, document_id, title, message, type, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [organizationId || null, recipientId, senderId || null, documentId || null, title, message, type]
    );

    const notificationId = res.insertId;

    // 2. Real-Time Socket.IO Notification Delivery
    if (io) {
      io.to(`user_${recipientId}`).emit('new_notification', {
        id: notificationId,
        title,
        message,
        type,
        documentId,
        is_read: 0,
        created_at: new Date().toISOString()
      });
    }

    // 3. Send Email Notification to Recipient
    if (emailDetails) {
      const recipientUsers = await db.query('SELECT name, email FROM users WHERE id = ?', [recipientId]);
      const recipient = recipientUsers[0];

      if (recipient && recipient.email) {
        const bodyHtml = generateEmailTemplate({
          recipientName: recipient.name,
          title,
          headline: title,
          message: message,
          documentTitle: emailDetails.documentTitle || 'Document',
          documentVersion: emailDetails.documentVersion || 'V1',
          badgeColor: type.includes('REJECT') ? '#ef4444' : (type.includes('APPROVED') || type.includes('FINAL') ? '#10b981' : '#3b82f6')
        });

        await sendWorkflowEmail({
          toEmail: recipient.email,
          toName: recipient.name,
          subject: `${title} - ${emailDetails.documentTitle || ''}`,
          eventType: type,
          documentTitle: emailDetails.documentTitle,
          bodyHtml,
          socketIo: io
        });
      }
    }

    return notificationId;
  } catch (err) {
    console.error('Failed to dispatch notification:', err.message);
  }
}

module.exports = {
  setSocketIO,
  sendNotification
};
