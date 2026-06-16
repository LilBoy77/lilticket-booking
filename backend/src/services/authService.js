import bcrypt from "bcrypt";
import { query } from "../config/database.js";
import { createHttpError } from "../utils/httpError.js";

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function toSafeUser(user) {
  if (!user) {
    return null;
  }

  return {
    created_at: user.created_at,
    email: user.email,
    full_name: user.full_name,
    id: user.id,
    phone_number: user.phone_number,
    role: user.role,
    updated_at: user.updated_at,
  };
}

export async function findUserByEmail(email) {
  const result = await query(
    `
      SELECT id, full_name, email, password_hash, phone_number, role, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await query(
    `
      SELECT id, full_name, email, phone_number, role, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] || null;
}

export async function registerCustomer({ email, fullName, password, phoneNumber }) {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw createHttpError(409, "Email sudah terdaftar");
  }

  const passwordHash = await hashPassword(password);

  try {
    const result = await query(
      `
        INSERT INTO users (full_name, email, password_hash, phone_number, role)
        VALUES ($1, $2, $3, $4, 'CUSTOMER')
        RETURNING id, full_name, email, phone_number, role, created_at, updated_at
      `,
      [fullName, email, passwordHash, phoneNumber || null],
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw createHttpError(409, "Email sudah terdaftar");
    }

    throw error;
  }
}

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw createHttpError(401, "Email atau password salah");
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw createHttpError(401, "Email atau password salah");
  }

  return toSafeUser(user);
}

export function sanitizeUser(user) {
  return toSafeUser(user);
}
