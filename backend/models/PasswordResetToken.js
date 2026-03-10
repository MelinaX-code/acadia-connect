const crypto = require('crypto');
const pool = require('../db/pool');

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

async function createForUser(userId, rawToken, expiresAt) {
  const tokenHash = sha256Hex(rawToken);

  await pool.execute(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (:userId, :tokenHash, :expiresAt)`,
    {
      userId,
      tokenHash,
      expiresAt,
    }
  );

  return { tokenHash };
}

async function consume(rawToken) {
  const tokenHash = sha256Hex(rawToken);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = :tokenHash
         AND used_at IS NULL
         AND expires_at > UTC_TIMESTAMP()
       LIMIT 1`,
      { tokenHash }
    );

    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return null;
    }

    const [result] = await conn.execute(
      `UPDATE password_reset_tokens
       SET used_at = UTC_TIMESTAMP()
       WHERE id = :id AND used_at IS NULL`,
      { id: row.id }
    );

    if (!result || result.affectedRows !== 1) {
      await conn.rollback();
      return null;
    }

    await conn.commit();
    return { userId: row.user_id };
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      // ignore
    }
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  createForUser,
  consume,
  sha256Hex,
};
