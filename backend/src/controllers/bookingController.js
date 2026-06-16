import crypto from "crypto";
import pool from "../config/database.js";
import { createHttpError } from "../utils/httpError.js";
import { requireUuid, validateEnum, validatePagination } from "../utils/validation.js";

const BOOKING_STATUSES = ["WAITING_PAYMENT", "CONFIRMED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "EXPIRED"];

function sendSuccess(response, statusCode, message, data) {
  response.status(statusCode).json({
    data,
    message,
    status: "success",
  });
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, "Item tiket wajib dipilih");
  }

  const itemMap = new Map();

  for (const item of items) {
    const ticketTypeId = requireUuid(item?.ticket_type_id, "ticket_type_id");

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw createHttpError(400, "Jumlah tiket harus lebih dari 0");
    }

    const currentQuantity = itemMap.get(ticketTypeId) || 0;
    itemMap.set(ticketTypeId, currentQuantity + item.quantity);
  }

  return [...itemMap.entries()].map(([ticketTypeId, quantity]) => ({
    quantity,
    ticket_type_id: ticketTypeId,
  }));
}

function generateBookingCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `LTK-${date}-${random}`;
}

function mapEvent(row) {
  return {
    poster_url: row.event_poster_url,
    end_at: row.event_end_at,
    id: row.event_id,
    start_at: row.event_start_at,
    status: row.event_status,
    title: row.event_title,
    venue: {
      address: row.venue_address,
      city: row.venue_city,
      id: row.venue_id,
      name: row.venue_name,
      province: row.venue_province,
    },
  };
}

function mapPayment(row) {
  if (!row.payment_id) {
    return null;
  }

  return {
    amount: row.payment_amount,
    created_at: row.payment_created_at,
    expired_at: row.payment_expired_at,
    id: row.payment_id,
    paid_at: row.payment_paid_at,
    payment_method: row.payment_method,
    payment_reference: row.payment_reference,
    status: row.payment_status,
    updated_at: row.payment_updated_at,
  };
}

function mapBookingSummary(row) {
  const bookingId = row.booking_id || row.id;
  const bookingStatus = row.booking_status || row.status;
  const paymentStatus = row.payment_status || row.payment?.status || null;

  return {
    booking_id: bookingId,
    booking_code: row.booking_code,
    booking_status: bookingStatus,
    cancelled_at: row.cancelled_at,
    confirmed_at: row.confirmed_at,
    created_at: row.created_at,
    event: mapEvent(row),
    event_id: row.event_id,
    event_title: row.event_title,
    expires_at: row.expires_at,
    id: bookingId,
    payment: mapPayment(row),
    payment_status: paymentStatus,
    status: bookingStatus,
    total_amount: row.total_amount,
    updated_at: row.updated_at,
    venue_city: row.venue_city,
    venue_name: row.venue_name,
  };
}

function mapAdminBookingSummary(row) {
  return {
    ...mapBookingSummary(row),
    user: {
      email: row.user_email,
      full_name: row.user_full_name,
      id: row.user_id,
      phone_number: row.user_phone_number,
      role: row.user_role,
    },
  };
}

async function getBookingDetail(client, bookingId) {
  const bookingResult = await client.query(
    `
      SELECT
        b.id,
        b.user_id,
        b.event_id,
        b.booking_code,
        b.status,
        b.total_amount,
        b.expires_at,
        b.confirmed_at,
        b.cancelled_at,
        b.created_at,
        b.updated_at,
        e.title AS event_title,
        e.poster_url AS event_poster_url,
        e.start_at AS event_start_at,
        e.end_at AS event_end_at,
        e.status AS event_status,
        v.id AS venue_id,
        v.name AS venue_name,
        v.address AS venue_address,
        v.city AS venue_city,
        v.province AS venue_province,
        p.id AS payment_id,
        p.payment_method,
        p.payment_reference,
        p.amount AS payment_amount,
        p.status AS payment_status,
        p.paid_at AS payment_paid_at,
        p.expired_at AS payment_expired_at,
        p.created_at AS payment_created_at,
        p.updated_at AS payment_updated_at
      FROM bookings b
      JOIN events e ON e.id = b.event_id
      JOIN venues v ON v.id = e.venue_id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.id = $1
      LIMIT 1
    `,
    [bookingId],
  );

  const booking = bookingResult.rows[0];

  if (!booking) {
    return null;
  }

  const itemsResult = await client.query(
    `
      SELECT
        bi.id,
        bi.ticket_type_id,
        bi.quantity,
        bi.unit_price,
        bi.subtotal,
        bi.created_at,
        tt.name AS ticket_type_name,
        tt.description AS ticket_type_description
      FROM booking_items bi
      JOIN ticket_types tt ON tt.id = bi.ticket_type_id
      WHERE bi.booking_id = $1
      ORDER BY bi.created_at ASC
    `,
    [bookingId],
  );

  return {
    ...mapBookingSummary(booking),
    user_id: booking.user_id,
    items: itemsResult.rows.map((row) => ({
      created_at: row.created_at,
      id: row.id,
      quantity: row.quantity,
      subtotal: row.subtotal,
      ticket_type: {
        description: row.ticket_type_description,
        id: row.ticket_type_id,
        name: row.ticket_type_name,
      },
      unit_price: row.unit_price,
    })),
  };
}

async function createBookingTransaction(client, userId, eventId, items) {
  const eventResult = await client.query(
    `
      SELECT id, status, start_at
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

  if (event.status !== "PUBLISHED") {
    throw createHttpError(400, "Acara belum dipublikasikan");
  }

  if (event.start_at && new Date(event.start_at) <= new Date()) {
    throw createHttpError(400, "Acara sudah berlangsung atau selesai");
  }

  const ticketTypeIds = items.map((item) => item.ticket_type_id);
  const ticketTypesResult = await client.query(
    `
      SELECT id, event_id, price, quota, sold_quantity, sale_start_at, sale_end_at
      FROM ticket_types
      WHERE id = ANY($1::uuid[])
      FOR UPDATE
    `,
    [ticketTypeIds],
  );

  if (ticketTypesResult.rows.length !== items.length) {
    throw createHttpError(400, "Satu atau beberapa jenis tiket tidak valid");
  }

  const ticketTypeMap = new Map(ticketTypesResult.rows.map((row) => [row.id, row]));
  const bookingItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const ticketType = ticketTypeMap.get(item.ticket_type_id);

    if (ticketType.event_id !== eventId) {
      throw createHttpError(400, "Jenis tiket tidak sesuai dengan acara");
    }

    const now = new Date();

    if (ticketType.sale_start_at && new Date(ticketType.sale_start_at) > now) {
      throw createHttpError(400, "Tiket belum tersedia untuk dibeli");
    }

    if (ticketType.sale_end_at && new Date(ticketType.sale_end_at) <= now) {
      throw createHttpError(400, "Masa penjualan tiket sudah berakhir");
    }

    const availableQuota = ticketType.quota - ticketType.sold_quantity;

    if (availableQuota < item.quantity) {
      throw createHttpError(400, "Stok tiket tidak mencukupi");
    }

    const unitPrice = Number(ticketType.price);
    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;
    bookingItems.push({
      quantity: item.quantity,
      subtotal,
      ticket_type_id: item.ticket_type_id,
      unit_price: unitPrice,
    });
  }

  const expiryResult = await client.query("SELECT NOW() + interval '10 minutes' AS expires_at");
  const expiresAt = expiryResult.rows[0].expires_at;
  const bookingResult = await client.query(
    `
      INSERT INTO bookings (user_id, event_id, booking_code, status, total_amount, expires_at)
      VALUES ($1, $2, $3, 'WAITING_PAYMENT', $4, $5)
      RETURNING id
    `,
    [userId, eventId, generateBookingCode(), totalAmount, expiresAt],
  );
  const bookingId = bookingResult.rows[0].id;

  for (const item of bookingItems) {
    await client.query(
      `
        INSERT INTO booking_items (booking_id, ticket_type_id, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [bookingId, item.ticket_type_id, item.quantity, item.unit_price, item.subtotal],
    );

    await client.query(
      `
        UPDATE ticket_types
        SET sold_quantity = sold_quantity + $1, updated_at = NOW()
        WHERE id = $2
      `,
      [item.quantity, item.ticket_type_id],
    );
  }

  await client.query(
    `
      INSERT INTO payments (booking_id, payment_method, status, amount, expired_at)
      VALUES ($1, 'XENDIT', 'PENDING', $2, $3)
    `,
    [bookingId, totalAmount, expiresAt],
  );

  return getBookingDetail(client, bookingId);
}

export async function createBooking(request, response, next) {
  let client;
  let transactionStarted = false;

  try {
    const eventId = requireUuid(request.body?.event_id, "event_id");
    const items = normalizeItems(request.body?.items);

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;
    const booking = await createBookingTransaction(client, request.user.id, eventId, items);
    await client.query("COMMIT");
    transactionStarted = false;

    sendSuccess(response, 201, "Pesanan berhasil dibuat", {
      booking,
    });
  } catch (error) {
    if (client && transactionStarted) {
      await client.query("ROLLBACK");
    }

    if (error.code === "22P02") {
      next(createHttpError(400, "Format ID tidak valid"));
      return;
    }

    if (error.code === "23505") {
      next(createHttpError(400, "Kode booking sudah digunakan"));
      return;
    }

    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function getMyBookings(request, response, next) {
  let client;

  try {
    client = await pool.connect();
    const result = await client.query(
      `
        SELECT
          b.id AS booking_id,
          b.booking_code,
          b.status AS booking_status,
          b.total_amount,
          b.expires_at,
          b.confirmed_at,
          b.cancelled_at,
          b.created_at,
          b.updated_at,
          e.id AS event_id,
          e.title AS event_title,
          e.poster_url AS event_poster_url,
          e.start_at AS event_start_at,
          e.end_at AS event_end_at,
          e.status AS event_status,
          v.id AS venue_id,
          v.name AS venue_name,
          v.address AS venue_address,
          v.city AS venue_city,
          v.province AS venue_province,
          p.id AS payment_id,
          p.payment_method,
          p.payment_reference,
          p.amount AS payment_amount,
          p.status AS payment_status,
          p.paid_at AS payment_paid_at,
          p.expired_at AS payment_expired_at,
          p.created_at AS payment_created_at,
          p.updated_at AS payment_updated_at
        FROM bookings b
        JOIN events e ON e.id = b.event_id
        JOIN venues v ON v.id = e.venue_id
        LEFT JOIN payments p ON p.booking_id = b.id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC
      `,
      [request.user.id],
    );

    sendSuccess(response, 200, "Pesanan saya berhasil dimuat", {
      bookings: result.rows.map(mapBookingSummary),
    });
  } catch (error) {
    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function getBookingById(request, response, next) {
  let client;

  try {
    const bookingId = requireUuid(request.params.id, "booking id");

    client = await pool.connect();
    const booking = await getBookingDetail(client, bookingId);

    if (!booking) {
      throw createHttpError(404, "Pesanan tidak ditemukan");
    }

    if (request.user.role !== "ADMIN" && booking.user_id !== request.user.id) {
      throw createHttpError(404, "Pesanan tidak ditemukan");
    }

    const { user_id: _userId, ...safeBooking } = booking;

    sendSuccess(response, 200, "Detail pesanan berhasil dimuat", {
      booking: safeBooking,
    });
  } catch (error) {
    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function getAllBookingsAdmin(request, response, next) {
  let client;

  try {
    client = await pool.connect();
    const { limit, offset, page } = validatePagination(request.query);
    const conditions = [];
    const params = [];

    if (request.query.status) {
      const status = String(request.query.status).toUpperCase();
      validateEnum(status, BOOKING_STATUSES, "status");

      params.push(status);
      conditions.push(`b.status = $${params.length}`);
    }

    if (request.query.payment_status) {
      const paymentStatus = String(request.query.payment_status).toUpperCase();
      validateEnum(paymentStatus, PAYMENT_STATUSES, "payment_status");

      params.push(paymentStatus);
      conditions.push(`p.status = $${params.length}`);
    }

    if (request.query.search) {
      params.push(`%${String(request.query.search).trim()}%`);
      conditions.push(`
        (
          b.booking_code ILIKE $${params.length}
          OR u.full_name ILIKE $${params.length}
          OR u.email ILIKE $${params.length}
          OR e.title ILIKE $${params.length}
        )
      `);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = await client.query(
      `
        SELECT COUNT(*)::INTEGER AS total
        FROM bookings b
        JOIN users u ON u.id = b.user_id
        JOIN events e ON e.id = b.event_id
        LEFT JOIN payments p ON p.booking_id = b.id
        ${whereSql}
      `,
      params,
    );

    const listParams = [...params, limit, offset];
    const result = await client.query(
      `
        SELECT
          b.id,
          b.booking_code,
          b.status,
          b.total_amount,
          b.expires_at,
          b.confirmed_at,
          b.cancelled_at,
          b.created_at,
          b.updated_at,
          u.id AS user_id,
          u.full_name AS user_full_name,
          u.email AS user_email,
          u.phone_number AS user_phone_number,
          u.role AS user_role,
          e.id AS event_id,
          e.title AS event_title,
          e.poster_url AS event_poster_url,
          e.start_at AS event_start_at,
          e.end_at AS event_end_at,
          e.status AS event_status,
          v.id AS venue_id,
          v.name AS venue_name,
          v.address AS venue_address,
          v.city AS venue_city,
          v.province AS venue_province,
          p.id AS payment_id,
          p.payment_method,
          p.payment_reference,
          p.amount AS payment_amount,
          p.status AS payment_status,
          p.paid_at AS payment_paid_at,
          p.expired_at AS payment_expired_at,
          p.created_at AS payment_created_at,
          p.updated_at AS payment_updated_at
        FROM bookings b
        JOIN users u ON u.id = b.user_id
        JOIN events e ON e.id = b.event_id
        JOIN venues v ON v.id = e.venue_id
        LEFT JOIN payments p ON p.booking_id = b.id
        ${whereSql}
        ORDER BY b.created_at DESC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `,
      listParams,
    );

    const total = countResult.rows[0]?.total || 0;

    sendSuccess(response, 200, "Daftar pesanan berhasil dimuat", {
      bookings: result.rows.map(mapAdminBookingSummary),
      pagination: {
        limit,
        page,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}
