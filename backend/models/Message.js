const pool = require('../db/pool');

function rowToPopulatedMessage(row) {
  return {
    _id: String(row.id),
    sender: {
      _id: row.sender_id,
      fullName: row.sender_full_name,
      photo: row.sender_photo,
    },
    receiver: {
      _id: row.receiver_id,
      fullName: row.receiver_full_name,
      photo: row.receiver_photo,
    },
    content: row.content,
    read: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

async function createMessage({ senderId, receiverId, content }) {
  const [result] = await pool.execute(
    `INSERT INTO messages (sender_id, receiver_id, content, is_read)
     VALUES (:senderId, :receiverId, :content, 0)`,
    { senderId, receiverId, content }
  );

  return result.insertId;
}

async function getMessagesForUserPopulated(userId) {
  const [rows] = await pool.execute(
    `SELECT
        m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
        su.full_name AS sender_full_name,
        su.profile_photo AS sender_photo,
        ru.full_name AS receiver_full_name,
        ru.profile_photo AS receiver_photo
     FROM messages m
     JOIN users su ON su.id = m.sender_id
     JOIN users ru ON ru.id = m.receiver_id
     WHERE m.sender_id = :userId OR m.receiver_id = :userId
     ORDER BY m.created_at DESC`,
    { userId }
  );
  return rows.map(rowToPopulatedMessage);
}

async function getConversationPopulated(userAId, userBId) {
  const [rows] = await pool.execute(
    `SELECT
        m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
        su.full_name AS sender_full_name,
        su.profile_photo AS sender_photo,
        ru.full_name AS receiver_full_name,
        ru.profile_photo AS receiver_photo
     FROM messages m
     JOIN users su ON su.id = m.sender_id
     JOIN users ru ON ru.id = m.receiver_id
     WHERE (m.sender_id = :userAId AND m.receiver_id = :userBId)
        OR (m.sender_id = :userBId AND m.receiver_id = :userAId)
     ORDER BY m.created_at ASC`,
    { userAId, userBId }
  );
  return rows.map(rowToPopulatedMessage);
}

async function markConversationRead({ senderId, receiverId }) {
  await pool.execute(
    `UPDATE messages
     SET is_read = 1
     WHERE sender_id = :senderId AND receiver_id = :receiverId AND is_read = 0`,
    { senderId, receiverId }
  );
}

async function countUnread(receiverId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS unreadCount
     FROM messages
     WHERE receiver_id = :receiverId AND is_read = 0`,
    { receiverId }
  );
  return Number(rows[0]?.unreadCount || 0);
}

async function getMessageByIdPopulated(messageId) {
  const [rows] = await pool.execute(
    `SELECT
        m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
        su.full_name AS sender_full_name,
        su.profile_photo AS sender_photo,
        ru.full_name AS receiver_full_name,
        ru.profile_photo AS receiver_photo
     FROM messages m
     JOIN users su ON su.id = m.sender_id
     JOIN users ru ON ru.id = m.receiver_id
     WHERE m.id = :messageId
     LIMIT 1`,
    { messageId }
  );
  return rows[0] ? rowToPopulatedMessage(rows[0]) : null;
}

module.exports = {
  createMessage,
  getMessagesForUserPopulated,
  getConversationPopulated,
  markConversationRead,
  countUnread,
  getMessageByIdPopulated,
};
