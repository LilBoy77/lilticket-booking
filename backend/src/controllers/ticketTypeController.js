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

function getRequiredString(body, fieldName, message = `${fieldName} wajib diisi`) {
  const value = body?.[fieldName];

  if (typeof value !== "string" || value.trim() === "") {
    throw createHttpError(400, message);
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

function getRequiredNonNegativeNumber(body, fieldName) {
  if (body?.[fieldName] === undefined || body?.[fieldName] === null || String(body[fieldName]).trim() === "") {
    throw createHttpError(400, "Harga tiket wajib diisi");
  }

  const value = Number(body?.[fieldName]);

  if (!Number.isFinite(value)) {
    throw createHttpError(400, "Harga tiket wajib berupa angka");
  }

  if (value < 0) {
    throw createHttpError(400, "Harga tiket tidak boleh negatif");
  }

  return value;
}

function getRequiredPositiveInteger(body, fieldName) {
  if (body?.[fieldName] === undefined || body?.[fieldName] === null || String(body[fieldName]).trim() === "") {
    throw createHttpError(400, "Kuota tiket wajib diisi");
  }

  const value = Number(body?.[fieldName]);

  if (!Number.isInteger(value) || value <= 0) {
    throw createHttpError(400, "Kuota tiket harus lebih dari 0");
  }

  return value;
}

function getOptionalDateString(body, fieldName, label = fieldName) {
  const value = getOptionalString(body, fieldName);

  if (value === null) {
    return null;
  }

  if (Number.isNaN(Date.parse(value))) {
    throw createHttpError(400, `${label} harus berupa tanggal yang valid`);
  }

  return value;
}

const TICKET_TYPE_USED_MESSAGE = "Jenis tiket tidak dapat dihapus karena sudah digunakan pada pesanan.";

function createTicketTypeUsedError() {
  const error = createHttpError(409, TICKET_TYPE_USED_MESSAGE);
  error.responseBody = {
    message: TICKET_TYPE_USED_MESSAGE,
  };
  return error;
}

async function getTicketTypePayload(body) {
  const eventId = requireUuid(getRequiredString(body, "event_id", "Acara wajib dipilih"), "Acara");
  const name = getRequiredString(body, "name", "Nama jenis tiket wajib diisi");
  const quota = getRequiredPositiveInteger(body, "quota");
  const saleStartAt = getOptionalDateString(body, "sale_start_at", "Tanggal mulai penjualan tiket");
  const saleEndAt = getOptionalDateString(body, "sale_end_at", "Tanggal akhir penjualan tiket");

  if (name.length < 2) {
    throw createHttpError(400, "Nama jenis tiket minimal 2 karakter");
  }

  if (saleStartAt && saleEndAt && new Date(saleEndAt) <= new Date(saleStartAt)) {
    throw createHttpError(400, "Tanggal akhir penjualan harus lebih besar dari tanggal mulai penjualan");
  }

  const eventResult = await query(
    `
      SELECT id, start_at
      FROM events
      WHERE id = $1
      LIMIT 1
    `,
    [eventId],
  );
  const event = eventResult.rows[0];

  if (!event) {
    throw createHttpError(404, "Acara tidak ditemukan");
  }

  if (saleStartAt && event.start_at && new Date(saleStartAt) > new Date(event.start_at)) {
    throw createHttpError(400, "Tanggal mulai penjualan tidak boleh setelah tanggal mulai acara");
  }

  if (saleEndAt && event.start_at && new Date(saleEndAt) > new Date(event.start_at)) {
    throw createHttpError(400, "Tanggal akhir penjualan tidak boleh melewati tanggal mulai acara");
  }

  if (body?.sold_quantity !== undefined && Number(body.sold_quantity) > quota) {
    throw createHttpError(400, "Jumlah tiket terjual tidak boleh lebih besar dari kuota");
  }

  return {
    description: getOptionalString(body, "description"),
    event_id: eventId,
    name,
    price: getRequiredNonNegativeNumber(body, "price"),
    quota,
    sale_end_at: saleEndAt,
    sale_start_at: saleStartAt,
  };
}

function handleTicketTypeDatabaseError(error, next) {
  if (error.code === "23503") {
    if (error.constraint === "booking_items_ticket_type_id_fk") {
      next(createTicketTypeUsedError());
      return;
    }

    next(createHttpError(400, "Acara tidak valid"));
    return;
  }

  if (error.code === "23514") {
    next(createHttpError(400, "Data jenis tiket tidak valid"));
    return;
  }

  next(error);
}

function mapTicketType(row) {
  return {
    created_at: row.created_at,
    description: row.description,
    event: row.event_id
      ? {
          id: row.event_id,
          title: row.event_title,
        }
      : undefined,
    event_id: row.event_id,
    id: row.id,
    name: row.name,
    price: row.price,
    quota: row.quota,
    sale_end_at: row.sale_end_at,
    sale_start_at: row.sale_start_at,
    sold_quantity: row.sold_quantity,
    updated_at: row.updated_at,
  };
}

const TICKET_TYPE_SELECT = `
  SELECT
    tt.id,
    tt.event_id,
    tt.name,
    tt.description,
    tt.price,
    tt.quota,
    tt.sold_quantity,
    tt.sale_start_at,
    tt.sale_end_at,
    tt.created_at,
    tt.updated_at,
    e.title AS event_title
  FROM ticket_types tt
  JOIN events e ON e.id = tt.event_id
`;

export async function getTicketTypes(_request, response, next) {
  try {
    const result = await query(
      `
        ${TICKET_TYPE_SELECT}
        ORDER BY e.start_at DESC, tt.name ASC
      `,
    );

    sendSuccess(response, 200, "Daftar jenis tiket berhasil dimuat", {
      ticket_types: result.rows.map(mapTicketType),
    });
  } catch (error) {
    next(error);
  }
}

export async function getTicketTypesByEvent(request, response, next) {
  try {
    const eventId = requireUuid(request.params.eventId, "ID acara");

    const result = await query(
      `
        ${TICKET_TYPE_SELECT}
        WHERE tt.event_id = $1
        ORDER BY tt.price ASC, tt.name ASC
      `,
      [eventId],
    );

    sendSuccess(response, 200, "Daftar jenis tiket acara berhasil dimuat", {
      ticket_types: result.rows.map(mapTicketType),
    });
  } catch (error) {
    next(error);
  }
}

export async function createTicketType(request, response, next) {
  try {
    const ticketType = await getTicketTypePayload(request.body);
    const result = await query(
      `
        INSERT INTO ticket_types (
          event_id,
          name,
          description,
          price,
          quota,
          sale_start_at,
          sale_end_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        ticketType.event_id,
        ticketType.name,
        ticketType.description,
        ticketType.price,
        ticketType.quota,
        ticketType.sale_start_at,
        ticketType.sale_end_at,
      ],
    );
    const createdResult = await query(
      `
        ${TICKET_TYPE_SELECT}
        WHERE tt.id = $1
      `,
      [result.rows[0].id],
    );

    sendSuccess(response, 201, "Jenis tiket berhasil dibuat", {
      ticket_type: mapTicketType(createdResult.rows[0]),
    });
  } catch (error) {
    handleTicketTypeDatabaseError(error, next);
  }
}

export async function updateTicketType(request, response, next) {
  try {
    const ticketTypeId = requireUuid(request.params.id, "ID jenis tiket");

    const ticketType = await getTicketTypePayload(request.body);
    const currentResult = await query(
      `
        SELECT id, sold_quantity
        FROM ticket_types
        WHERE id = $1
        LIMIT 1
      `,
      [ticketTypeId],
    );

    if (currentResult.rowCount === 0) {
      throw createHttpError(404, "Jenis tiket tidak ditemukan");
    }

    if (Number(currentResult.rows[0].sold_quantity) > ticketType.quota) {
      throw createHttpError(400, "Jumlah tiket terjual tidak boleh lebih besar dari kuota");
    }

    const result = await query(
      `
        UPDATE ticket_types
        SET
          event_id = $1,
          name = $2,
          description = $3,
          price = $4,
          quota = $5,
          sale_start_at = $6,
          sale_end_at = $7,
          updated_at = NOW()
        WHERE id = $8
        RETURNING id
      `,
      [
        ticketType.event_id,
        ticketType.name,
        ticketType.description,
        ticketType.price,
        ticketType.quota,
        ticketType.sale_start_at,
        ticketType.sale_end_at,
        ticketTypeId,
      ],
    );

    if (result.rowCount === 0) {
      throw createHttpError(404, "Jenis tiket tidak ditemukan");
    }

    const updatedResult = await query(
      `
        ${TICKET_TYPE_SELECT}
        WHERE tt.id = $1
      `,
      [ticketTypeId],
    );

    sendSuccess(response, 200, "Jenis tiket berhasil diperbarui", {
      ticket_type: mapTicketType(updatedResult.rows[0]),
    });
  } catch (error) {
    handleTicketTypeDatabaseError(error, next);
  }
}

export async function deleteTicketType(request, response, next) {
  try {
    const ticketTypeId = requireUuid(request.params.id, "ID jenis tiket");

    const usedResult = await query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM booking_items
          WHERE ticket_type_id = $1
        ) AS is_used
      `,
      [ticketTypeId],
    );

    if (usedResult.rows[0]?.is_used) {
      throw createTicketTypeUsedError();
    }

    const result = await query(
      `
        DELETE FROM ticket_types
        WHERE id = $1
        RETURNING id, event_id, name, description, price, quota, sold_quantity, sale_start_at, sale_end_at, created_at, updated_at
      `,
      [ticketTypeId],
    );

    if (result.rowCount === 0) {
      throw createHttpError(404, "Jenis tiket tidak ditemukan");
    }

    sendSuccess(response, 200, "Jenis tiket berhasil dihapus", {
      ticket_type: mapTicketType(result.rows[0]),
    });
  } catch (error) {
    handleTicketTypeDatabaseError(error, next);
  }
}
