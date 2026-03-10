const pool = require('../db/pool');

function rowToPopulatedGroupMessage(row) {
  return {
    _id: String(row.id),
    groupId: String(row.group_id),
    sender: {
      _id: row.sender_id,
      fullName: row.sender_full_name,
      photo: row.sender_photo,
    },
    content: row.content,
    createdAt: row.created_at,
  };
}

async function createGroupMessage({ groupId, senderId, content }) {
  const [result] = await pool.execute(
    `INSERT INTO group_messages (group_id, sender_id, content)
     VALUES (:groupId, :senderId, :content)`,
    { groupId: Number(groupId), senderId, content }
  );

  return Number(result.insertId);
}

async function listGroupMessagesPopulated(groupId) {
  const [rows] = await pool.execute(
    `SELECT
        gm.id,
        gm.group_id,
        gm.sender_id,
        gm.content,
        gm.created_at,
        u.full_name AS sender_full_name,
        u.profile_photo AS sender_photo
     FROM group_messages gm
     JOIN users u ON u.id = gm.sender_id
     WHERE gm.group_id = :groupId
     ORDER BY gm.created_at ASC`,
    { groupId: Number(groupId) }
  );

  return rows.map(rowToPopulatedGroupMessage);
}

async function getGroupMessageByIdPopulated(messageId) {
  const [rows] = await pool.execute(
    `SELECT
        gm.id,
        gm.group_id,
        gm.sender_id,
        gm.content,
        gm.created_at,
        u.full_name AS sender_full_name,
        u.profile_photo AS sender_photo
     FROM group_messages gm
     JOIN users u ON u.id = gm.sender_id
     WHERE gm.id = :messageId
     LIMIT 1`,
    { messageId: Number(messageId) }
  );

  return rows[0] ? rowToPopulatedGroupMessage(rows[0]) : null;
}

module.exports = {
  createGroupMessage,
  listGroupMessagesPopulated,
  getGroupMessageByIdPopulated,
};
