import { verifyToken } from "../utils/jwt.js";

function sendRequestError(response, statusCode, message) {
  return response.status(statusCode).json({
    error: "Request Error",
    message,
    status: "error",
  });
}

export function authMiddleware(request, response, next) {
  const token = request.cookies?.token;

  if (!token) {
    return sendRequestError(response, 401, "Silakan masuk terlebih dahulu");
  }

  try {
    request.user = verifyToken(token);
    return next();
  } catch (error) {
    if (error.message === "JWT_SECRET is not configured") {
      return response.status(500).json({
        error: "Request Error",
        message: "Konfigurasi autentikasi belum lengkap",
        status: "error",
      });
    }

    return sendRequestError(response, 401, "Sesi tidak valid atau sudah kedaluwarsa");
  }
}

export function adminMiddleware(request, response, next) {
  if (request.user?.role !== "ADMIN") {
    return response.status(403).json({
      error: "Request Error",
      message: "Akses admin diperlukan",
      status: "error",
    });
  }

  return next();
}

export const authenticate = authMiddleware;
