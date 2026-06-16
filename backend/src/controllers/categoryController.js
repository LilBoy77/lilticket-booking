import { query } from "../config/database.js";
import { createHttpError } from "../utils/httpError.js";
import { requireUuid } from "../utils/validation.js";

function sendSuccess(response, statusCode, message, data) {
  response.status(statusCode).json({
    data,
    message,
    status: "success",
  });
}

function getRequiredString(body, fieldName) {
  const value = body?.[fieldName];

  if (typeof value !== "string" || value.trim() === "") {
    throw createHttpError(400, `${fieldName} wajib diisi`);
  }

  return value.trim();
}

function getOptionalString(body, fieldName) {
  const value = body?.[fieldName];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw createHttpError(400, `${fieldName} harus berupa teks`);
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

function handleCategoryDatabaseError(error, next) {
  if (error.code === "23505") {
    next(createHttpError(400, "Nama kategori sudah digunakan"));
    return;
  }

  if (error.code === "23503") {
    next(createHttpError(400, "Kategori masih digunakan oleh acara"));
    return;
  }

  next(error);
}

export async function getCategories(_request, response, next) {
  try {
    const result = await query(
      `
        SELECT id, name, description, created_at, updated_at
        FROM categories
        ORDER BY name ASC
      `,
    );

    sendSuccess(response, 200, "Daftar kategori berhasil dimuat", {
      categories: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(request, response, next) {
  try {
    const name = getRequiredString(request.body, "name");
    const description = getOptionalString(request.body, "description");
    const result = await query(
      `
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at, updated_at
      `,
      [name, description],
    );

    sendSuccess(response, 201, "Kategori berhasil dibuat", {
      category: result.rows[0],
    });
  } catch (error) {
    handleCategoryDatabaseError(error, next);
  }
}

export async function updateCategory(request, response, next) {
  try {
    const categoryId = requireUuid(request.params.id, "category id");

    const name = getRequiredString(request.body, "name");
    const description = getOptionalString(request.body, "description");
    const result = await query(
      `
        UPDATE categories
        SET name = $1, description = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, name, description, created_at, updated_at
      `,
      [name, description, categoryId],
    );

    if (result.rowCount === 0) {
      throw createHttpError(404, "Kategori tidak ditemukan");
    }

    sendSuccess(response, 200, "Kategori berhasil diperbarui", {
      category: result.rows[0],
    });
  } catch (error) {
    handleCategoryDatabaseError(error, next);
  }
}

export async function deleteCategory(request, response, next) {
  try {
    const categoryId = requireUuid(request.params.id, "category id");

    const result = await query(
      `
        DELETE FROM categories
        WHERE id = $1
        RETURNING id, name, description, created_at, updated_at
      `,
      [categoryId],
    );

    if (result.rowCount === 0) {
      throw createHttpError(404, "Kategori tidak ditemukan");
    }

    sendSuccess(response, 200, "Kategori berhasil dihapus", {
      category: result.rows[0],
    });
  } catch (error) {
    handleCategoryDatabaseError(error, next);
  }
}
