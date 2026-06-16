import {
  findUserById,
  loginUser,
  registerCustomer,
  sanitizeUser,
} from "../services/authService.js";
import { getAuthCookieOptions, getClearAuthCookieOptions } from "../utils/cookie.js";
import { createHttpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";
import { isValidEmail, optionalString } from "../utils/validation.js";

const PASSWORD_MIN_LENGTH = 6;

function createUserToken(user) {
  return signToken({
    email: user.email,
    id: user.id,
    role: user.role,
  });
}

function requireAuthString(body, fieldName, message) {
  const value = body?.[fieldName];

  if (typeof value !== "string" || value.trim() === "") {
    throw createHttpError(400, message);
  }

  return value.trim();
}

function nextSafeAuthError(error, next) {
  if (error.statusCode) {
    next(error);
    return;
  }

  next(createHttpError(500, "Terjadi kesalahan pada autentikasi"));
}

export async function register(request, response, next) {
  try {
    const fullName = requireAuthString(request.body, "full_name", "Nama wajib diisi");
    const email = requireAuthString(request.body, "email", "Email wajib diisi").toLowerCase();
    const password = requireAuthString(request.body, "password", "Password wajib diisi");
    const phoneNumber = optionalString(request.body, "phone_number");

    if (fullName.length < 3) {
      throw createHttpError(400, "Nama minimal 3 karakter");
    }

    if (!isValidEmail(email)) {
      throw createHttpError(400, "Format email tidak valid");
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      throw createHttpError(400, `Password minimal ${PASSWORD_MIN_LENGTH} karakter`);
    }

    if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
      throw createHttpError(400, "Nomor telepon hanya boleh berisi angka");
    }

    if (phoneNumber && phoneNumber.length < 10) {
      throw createHttpError(400, "Nomor telepon minimal 10 digit");
    }

    const user = await registerCustomer({
      email,
      fullName,
      password,
      phoneNumber,
    });

    response.status(201).json({
      data: {
        user: sanitizeUser(user),
      },
      message: "Pendaftaran berhasil",
      status: "success",
    });
  } catch (error) {
    nextSafeAuthError(error, next);
  }
}

export async function login(request, response, next) {
  try {
    const email = requireAuthString(request.body, "email", "Email wajib diisi").toLowerCase();
    const password = requireAuthString(request.body, "password", "Password wajib diisi");

    if (!isValidEmail(email)) {
      throw createHttpError(400, "Format email tidak valid");
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      throw createHttpError(401, "Email atau password salah");
    }

    const user = await loginUser({ email, password });
    const token = createUserToken(user);

    response.cookie("token", token, getAuthCookieOptions());

    response.status(200).json({
      data: {
        user: sanitizeUser(user),
      },
      message: "Masuk berhasil",
      status: "success",
    });
  } catch (error) {
    nextSafeAuthError(error, next);
  }
}

export function logout(_request, response) {
  response.clearCookie("token", getClearAuthCookieOptions());

  response.status(200).json({
    message: "Keluar berhasil",
    status: "success",
  });
}

export async function me(request, response, next) {
  try {
    const user = await findUserById(request.user.id);

    if (!user) {
      throw createHttpError(401, "Pengguna tidak ditemukan");
    }

    response.status(200).json({
      data: {
        user: sanitizeUser(user),
      },
      status: "success",
    });
  } catch (error) {
    next(error);
  }
}
