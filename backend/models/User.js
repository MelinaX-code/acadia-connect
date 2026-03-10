const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { parseJsonArray, stringifyJsonArray } = require('../utils/json');

function rowToPublicUser(row) {
  if (!row) return null;

  const computedFullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();

  const profile = {
    bio: row.profile_bio ?? undefined,
    hobbies: parseJsonArray(row.profile_hobbies_json),
    interests: parseJsonArray(row.profile_interests_json),
    year: row.profile_year ?? undefined,
    country: row.profile_country ?? undefined,
    languages: parseJsonArray(row.profile_languages_json),
    photo: row.profile_photo ?? undefined,
  };

  return {
    _id: row.id,
    fullName: computedFullName,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    email: row.email,
    role: row.role,
    gender: row.gender ?? undefined,
    department: row.department ?? undefined,
    isAdmin: Boolean(row.is_admin),
    profile,
    // Some frontend views expect `user.photo` (messages UI)
    photo: profile.photo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT * FROM users WHERE email = :email LIMIT 1`,
    { email: String(email).toLowerCase() }
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE id = :id LIMIT 1`, { id });
  return rows[0] || null;
}

async function listAll() {
  const [rows] = await pool.execute(`SELECT * FROM users ORDER BY created_at DESC`);
  return rows;
}

async function listAllExcept(userId) {
  const [rows] = await pool.execute(
    `SELECT * FROM users WHERE id <> :userId ORDER BY created_at DESC`,
    { userId }
  );
  return rows;
}

async function createUser({
  firstName,
  lastName,
  email,
  password,
  role,
  gender,
  country,
  department,
  photo,
  bio,
  hobbies,
  interests,
  year,
  languages,
  isAdmin = false,
}) {
  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const safeCountry = String(country || 'Canada').trim() || 'Canada';
  const safeDepartment = department ? String(department).trim() : null;
  const safeGender = gender ? String(gender).trim() : null;

  const safeBio = bio !== undefined && bio !== null && String(bio).trim() !== '' ? String(bio).trim() : null;
  const hobbiesJson = hobbies !== undefined ? stringifyJsonArray(hobbies) : stringifyJsonArray([]);
  const interestsJson = interests !== undefined ? stringifyJsonArray(interests) : stringifyJsonArray([]);
  const languagesJson = languages !== undefined ? stringifyJsonArray(languages) : stringifyJsonArray([]);
  const safeYear = year !== undefined && year !== null && String(year).trim() !== '' ? String(year).trim() : null;

  await pool.execute(
    `INSERT INTO users (
      id, first_name, last_name, full_name, email, password_hash, role, gender, department, is_admin,
      profile_bio, profile_hobbies_json, profile_interests_json,
      profile_year, profile_country, profile_languages_json, profile_photo
    ) VALUES (
      :id, :firstName, :lastName, :fullName, :email, :passwordHash, :role, :gender, :department, :isAdmin,
      :bio, :hobbiesJson, :interestsJson,
      :year, :country, :languagesJson, :photo
    )`,
    {
      id,
      firstName,
      lastName,
      fullName,
      email: String(email).toLowerCase(),
      passwordHash,
      role,
      gender: safeGender,
      department: safeDepartment,
      country: safeCountry,
      photo: photo ? String(photo) : null,
      bio: safeBio,
      hobbiesJson,
      interestsJson,
      year: safeYear,
      languagesJson,
      isAdmin: isAdmin ? 1 : 0,
    }
  );

  return findById(id);
}

async function comparePassword(userRow, candidatePassword) {
  return bcrypt.compare(candidatePassword, userRow.password_hash);
}

async function updateProfile(userId, profilePatch) {
  const fields = [];
  const params = { userId };

  const mapping = {
    bio: 'profile_bio',
    year: 'profile_year',
    country: 'profile_country',
    photo: 'profile_photo',
    department: 'department',
  };

  for (const [key, column] of Object.entries(mapping)) {
    if (Object.prototype.hasOwnProperty.call(profilePatch, key)) {
      fields.push(`${column} = :${key}`);
      params[key] = profilePatch[key] ?? null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(profilePatch, 'hobbies')) {
    fields.push(`profile_hobbies_json = :hobbiesJson`);
    params.hobbiesJson = stringifyJsonArray(profilePatch.hobbies);
  }

  if (Object.prototype.hasOwnProperty.call(profilePatch, 'interests')) {
    fields.push(`profile_interests_json = :interestsJson`);
    params.interestsJson = stringifyJsonArray(profilePatch.interests);
  }

  if (Object.prototype.hasOwnProperty.call(profilePatch, 'languages')) {
    fields.push(`profile_languages_json = :languagesJson`);
    params.languagesJson = stringifyJsonArray(profilePatch.languages);
  }

  if (fields.length === 0) {
    return findById(userId);
  }

  await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = :userId`, params);
  return findById(userId);
}

async function adminUpdateUser(userId, patch) {
  const fields = [];
  const params = { userId };

  const hasFirstName = patch.firstName !== undefined && patch.firstName !== null && String(patch.firstName).trim() !== '';
  const hasLastName = patch.lastName !== undefined && patch.lastName !== null && String(patch.lastName).trim() !== '';

  if (hasFirstName) {
    fields.push(`first_name = :firstName`);
    params.firstName = String(patch.firstName).trim();
  }

  if (hasLastName) {
    fields.push(`last_name = :lastName`);
    params.lastName = String(patch.lastName).trim();
  }

  // full_name is always derived from first_name + last_name
  if (hasFirstName || hasLastName) {
    const existing = await findById(userId);
    if (!existing) return null;
    const mergedFirst = hasFirstName ? params.firstName : (existing.first_name ?? '');
    const mergedLast = hasLastName ? params.lastName : (existing.last_name ?? '');
    const mergedFull = [mergedFirst, mergedLast].filter(Boolean).join(' ').trim();
    if (mergedFull) {
      fields.push(`full_name = :fullName`);
      params.fullName = mergedFull;
    }
  }

  if (patch.gender !== undefined) {
    const g = String(patch.gender).trim();
    params.gender = g || null;
    fields.push(`gender = :gender`);
  }

  if (patch.department !== undefined) {
    const d = String(patch.department).trim();
    params.department = d || null;
    fields.push(`department = :department`);
  }

  if (patch.country !== undefined) {
    const c = String(patch.country).trim();
    params.country = c || null;
    fields.push(`profile_country = :country`);
  }

  if (patch.email) {
    fields.push(`email = :email`);
    params.email = String(patch.email).toLowerCase();
  }

  if (patch.role) {
    fields.push(`role = :role`);
    params.role = patch.role;
  }

  if (patch.isAdmin !== undefined) {
    fields.push(`is_admin = :isAdmin`);
    params.isAdmin = patch.isAdmin ? 1 : 0;
  }

  if (patch.password) {
    const passwordHash = await bcrypt.hash(patch.password, 10);
    fields.push(`password_hash = :passwordHash`);
    params.passwordHash = passwordHash;
  }

  if (fields.length === 0) {
    return findById(userId);
  }

  await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = :userId`, params);
  return findById(userId);
}

async function deleteUser(userId) {
  const existing = await findById(userId);
  if (!existing) return null;
  await pool.execute(`DELETE FROM users WHERE id = :userId`, { userId });
  return existing;
}

module.exports = {
  rowToPublicUser,
  findByEmail,
  findById,
  listAll,
  listAllExcept,
  createUser,
  comparePassword,
  updateProfile,
  adminUpdateUser,
  deleteUser,
};
