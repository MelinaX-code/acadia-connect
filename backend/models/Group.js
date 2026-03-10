const pool = require('../db/pool');

function rowToGroup(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at,
    memberCount: row.member_count !== undefined ? Number(row.member_count) : undefined,
  };
}

async function findById(groupId) {
  const [rows] = await pool.execute(
    `SELECT id, name, created_by, created_at
     FROM chat_groups
     WHERE id = :groupId
     LIMIT 1`,
    { groupId: Number(groupId) }
  );
  return rows[0] || null;
}

async function findByName(name) {
  const normalized = String(name || '').trim();
  if (!normalized) return null;

  const [rows] = await pool.execute(
    `SELECT id, name, created_by, created_at
     FROM chat_groups
     WHERE LOWER(name) = LOWER(:name)
     LIMIT 1`,
    { name: normalized }
  );
  return rows[0] || null;
}

async function createGroup({ name, createdBy }) {
  const groupName = String(name || '').trim();
  if (!groupName) {
    throw new Error('Group name is required');
  }

  const [result] = await pool.execute(
    `INSERT INTO chat_groups (name, created_by)
     VALUES (:name, :createdBy)`,
    { name: groupName, createdBy }
  );

  return Number(result.insertId);
}

async function addMember({ groupId, userId }) {
  await pool.execute(
    `INSERT INTO chat_group_members (group_id, user_id)
     VALUES (:groupId, :userId)
     ON DUPLICATE KEY UPDATE joined_at = joined_at`,
    { groupId: Number(groupId), userId }
  );
}

async function isMember({ groupId, userId }) {
  const [rows] = await pool.execute(
    `SELECT 1 AS ok
     FROM chat_group_members
     WHERE group_id = :groupId AND user_id = :userId
     LIMIT 1`,
    { groupId: Number(groupId), userId }
  );
  return Boolean(rows[0]?.ok);
}

async function listForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT
        g.id,
        g.name,
        g.created_by,
        g.created_at,
        (SELECT COUNT(*) FROM chat_group_members m2 WHERE m2.group_id = g.id) AS member_count
     FROM chat_groups g
     JOIN chat_group_members m ON m.group_id = g.id
     WHERE m.user_id = :userId
     ORDER BY g.created_at DESC`,
    { userId }
  );

  return rows;
}

module.exports = {
  rowToGroup,
  findById,
  findByName,
  createGroup,
  addMember,
  isMember,
  listForUser,
};
