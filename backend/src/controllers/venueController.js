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

function getRequiredPositiveInteger(body, fieldName) {
  const value = Number(body?.[fieldName]);

  if (!Number.isInteger(value) || value <= 0) {
    throw createHttpError(400, `${fieldName} harus lebih dari 0`);
  }

  return value;
}

function getVenuePayload(body) {
  return {
    address: getRequiredString(body, "address"),
    capacity: getRequiredPositiveInteger(body, "capacity"),
    city: getRequiredString(body, "city"),
    name: getRequiredString(body, "name"),
    province: getOptionalString(body, "province"),
  };
}

function handleVenueDatabaseError(error, next) {
  if (error.code === "23503") {
    next(createHttpError(400, "Venue masih digunakan oleh acara"));
    return;
  }

  if (error.code === "23514") {
    next(createHttpError(400, "Data venue tidak valid"));
    return;
  }

  next(error);
}

export async function getVenues(_request, response, next) {
  try {
    const result = await query(
      `
        SELECT id, name, address, city, province, capacity, created_at, updated_at
        FROM venues
        ORDER BY name ASC
      `,
    );

    sendSuccess(response, 200, "Daftar venue berhasil dimuat", {
      venues: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function createVenue(request, response, next) {
  try {
    const venue = getVenuePayload(request.body);
    const result = await query(
      `
        INSERT INTO venues (name, address, city, province, capacity)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, address, city, province, capacity, created_at, updated_at
      `,
      [venue.name, venue.address, venue.city, venue.province, venue.capacity],
    );

    sendSuccess(response, 201, "Venue berhasil dibuat", {
      venue: result.rows[0],
    });
  } catch (error) {
    handleVenueDatabaseError(error, next);
  }
}

export async function updateVenue(request, response, next) {
  try {
    const venueId = requireUuid(request.params.id, "venue id");

    const venue = getVenuePayload(request.body);
    const result = await query(
      `
        UPDATE venues
        SET
          name = $1,
          address = $2,
          city = $3,
          province = $4,
          capacity = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING id, name, address, city, province, capacity, created_at, updated_at
      `,
      [venue.name, venue.address, venue.city, venue.province, venue.capacity, venueId],
    );

    if (result.rowCount === 0) {
      throw createHttpError(404, "Venue tidak ditemukan");
    }

    sendSuccess(response, 200, "Venue berhasil diperbarui", {
      venue: result.rows[0],
    });
  } catch (error) {
    handleVenueDatabaseError(error, next);
  }
}

export async function deleteVenue(request, response, next) {
  try {
    const venueId = requireUuid(request.params.id, "venue id");

    const result = await query(
      `
        DELETE FROM venues
        WHERE id = $1
        RETURNING id, name, address, city, province, capacity, created_at, updated_at
      `,
      [venueId],
    );

    if (result.rowCount === 0) {
      throw createHttpError(404, "Venue tidak ditemukan");
    }

    sendSuccess(response, 200, "Venue berhasil dihapus", {
      venue: result.rows[0],
    });
  } catch (error) {
    handleVenueDatabaseError(error, next);
  }
}
