import { query } from "../config/database.js";

export function getHealth(_request, response) {
  response.status(200).json({
    message: "LilTicket API is healthy",
    status: "ok",
  });
}

export async function getDatabaseHealth(_request, response, next) {
  try {
    const result = await query("SELECT NOW()");

    response.status(200).json({
      databaseTime: result.rows[0].now,
      message: "Database connection is healthy",
      status: "ok",
    });
  } catch (error) {
    next(error);
  }
}
