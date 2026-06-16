import pool from "../config/database.js";
import { createHttpError } from "../utils/httpError.js";
import { requireString, requireUuid } from "../utils/validation.js";

function sendSuccess(response, statusCode, message, data) {
  response.status(statusCode).json({
    data,
    message,
    status: "success",
  });
}

function createCheckInError(statusCode, message, ticket) {
  const error = createHttpError(statusCode, message);
  error.responseBody = ticket
    ? {
        data: {
          ticket: mapTicket(ticket),
        },
        message,
        status: "error",
      }
    : {
        message,
        status: "error",
      };
  return error;
}

function mapTicket(row) {
  const ownerName = row.owner_name || row.owner_email || null;

  return {
    activated_at: row.activated_at,
    booking_code: row.booking_code,
    booking_id: row.booking_id,
    booking_status: row.booking_status,
    customer_email: row.owner_email,
    customer_name: ownerName,
    event_id: row.event_id,
    event_datetime: row.start_at,
    event_name: row.event_title,
    event_title: row.event_title,
    holder_name: row.holder_name,
    owner_email: row.owner_email,
    owner_name: ownerName,
    payment: {
      amount: row.payment_amount,
      id: row.payment_id,
      method: row.payment_method,
      paid_at: row.payment_paid_at,
      status: row.payment_status,
    },
    payment_amount: row.payment_amount,
    payment_status: row.payment_status,
    start_at: row.start_at,
    ticket_code: row.ticket_code,
    ticket_id: row.ticket_id,
    ticket_status: row.ticket_status,
    ticket_type: {
      id: row.ticket_type_id,
      name: row.ticket_type_name,
      price: row.ticket_type_price,
    },
    ticket_type_name: row.ticket_type_name,
    total_amount: row.booking_total_amount,
    used_at: row.used_at,
    venue: {
      address: row.venue_address,
      city: row.venue_city,
      id: row.venue_id,
      name: row.venue_name,
      province: row.venue_province,
    },
    venue_city: row.venue_city,
    venue_name: row.venue_name,
  };
}

function getTicketSelectSql() {
  return `
    SELECT
      t.id AS ticket_id,
      t.ticket_code,
      t.status AS ticket_status,
      t.holder_name,
      t.activated_at,
      t.used_at,
      b.id AS booking_id,
      b.booking_code,
      b.status AS booking_status,
      b.total_amount AS booking_total_amount,
      e.id AS event_id,
      e.title AS event_title,
      e.start_at,
      e.end_at,
      v.id AS venue_id,
      v.name AS venue_name,
      v.address AS venue_address,
      v.city AS venue_city,
      v.province AS venue_province,
      tt.id AS ticket_type_id,
      tt.name AS ticket_type_name,
      tt.price AS ticket_type_price,
      p.id AS payment_id,
      p.payment_method,
      p.amount AS payment_amount,
      p.paid_at AS payment_paid_at,
      COALESCE(p.status, 'PENDING') AS payment_status,
      b.user_id AS booking_user_id,
      u.full_name AS owner_name,
      u.email AS owner_email
    FROM tickets t
    JOIN bookings b ON b.id = t.booking_id
    JOIN users u ON u.id = b.user_id
    LEFT JOIN booking_items bi ON bi.id = t.booking_item_id
    LEFT JOIN ticket_types tt ON tt.id = bi.ticket_type_id
    JOIN events e ON e.id = b.event_id
    JOIN venues v ON v.id = e.venue_id
    LEFT JOIN payments p ON p.booking_id = b.id
  `;
}

async function getTicketByCodeRow(client, ticketCode, options = {}) {
  const result = await client.query(
    `
      ${getTicketSelectSql(options)}
      WHERE t.ticket_code = $1
      LIMIT 1
      ${options.forUpdate ? "FOR UPDATE OF t, b" : ""}
    `,
    [ticketCode],
  );

  return result.rows[0] || null;
}

export async function getMyTickets(request, response, next) {
  let client;

  try {
    client = await pool.connect();
    const result = await client.query(
      `
        ${getTicketSelectSql()}
        WHERE b.user_id = $1
        ORDER BY e.start_at DESC, t.created_at DESC
      `,
      [request.user.id],
    );

    sendSuccess(response, 200, "Tiket saya berhasil dimuat", {
      tickets: result.rows.map(mapTicket),
    });
  } catch (error) {
    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function getTicketById(request, response, next) {
  let client;

  try {
    const { ticketId } = request.params;

    const validTicketId = requireUuid(ticketId, "ticket id");

    client = await pool.connect();
    const params = [validTicketId];
    const ownerFilter = request.user.role === "ADMIN" ? "" : "AND b.user_id = $2";

    if (ownerFilter) {
      params.push(request.user.id);
    }

    const result = await client.query(
      `
        ${getTicketSelectSql()}
        WHERE t.id = $1
        ${ownerFilter}
        LIMIT 1
      `,
      params,
    );
    const ticket = result.rows[0];

    if (!ticket) {
      throw createHttpError(404, "Tiket tidak ditemukan");
    }

    sendSuccess(response, 200, "Detail tiket berhasil dimuat", {
      ticket: mapTicket(ticket),
    });
  } catch (error) {
    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function getTicketByCode(request, response, next) {
  let client;

  try {
    const ticketCode = requireString(request.params, "ticketCode");

    client = await pool.connect();
    const result = await client.query(
      `
        ${getTicketSelectSql()}
        WHERE t.ticket_code = $1
        ${request.user.role === "ADMIN" ? "" : "AND b.user_id = $2"}
        LIMIT 1
      `,
      request.user.role === "ADMIN" ? [ticketCode] : [ticketCode, request.user.id],
    );
    const ticket = result.rows[0];

    if (!ticket) {
      throw createHttpError(404, "Tiket tidak ditemukan");
    }

    sendSuccess(response, 200, "Tiket berhasil dimuat", {
      ticket: mapTicket(ticket),
    });
  } catch (error) {
    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function checkInTicket(request, response, next) {
  let client;
  let transactionStarted = false;

  try {
    const ticketCode = requireString(
      {
        ticket_code: request.body?.ticketCode || request.body?.ticket_code,
      },
      "ticket_code",
    );

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const ticket = await getTicketByCodeRow(client, ticketCode, { forUpdate: true });

    if (!ticket) {
      throw createCheckInError(404, "Tiket tidak ditemukan.");
    }

    if (ticket.ticket_status === "USED") {
      throw createCheckInError(409, "Tiket sudah digunakan.", ticket);
    }

    if (ticket.ticket_status === "CANCELLED" || ticket.booking_status === "CANCELLED") {
      throw createCheckInError(400, "Tiket dibatalkan.", ticket);
    }

    if (ticket.booking_status !== "CONFIRMED") {
      throw createCheckInError(400, "Pesanan belum terkonfirmasi.", ticket);
    }

    if (ticket.payment_status !== "PAID") {
      throw createCheckInError(400, "Pembayaran belum berhasil.", ticket);
    }

    if (ticket.ticket_status !== "ACTIVE") {
      throw createCheckInError(400, "Tiket tidak aktif.", ticket);
    }

    await client.query(
      `
        UPDATE tickets
        SET status = 'USED', used_at = NOW(), updated_at = NOW()
        WHERE ticket_code = $1
      `,
      [ticketCode],
    );

    const checkedInTicket = await getTicketByCodeRow(client, ticketCode);

    await client.query("COMMIT");
    transactionStarted = false;

    sendSuccess(response, 200, "Check-in berhasil. Tiket valid.", {
      ticket: mapTicket(checkedInTicket),
    });
  } catch (error) {
    if (client && transactionStarted) {
      await client.query("ROLLBACK");
    }

    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function getTicketsByBookingId(request, response, next) {
  let client;

  try {
    const { bookingId } = request.params;

    const validBookingId = requireUuid(bookingId, "booking id");

    client = await pool.connect();
    const params = [validBookingId];
    const ownerFilter = request.user.role === "ADMIN" ? "" : "AND b.user_id = $2";

    if (ownerFilter) {
      params.push(request.user.id);
    }

    const result = await client.query(
      `
        ${getTicketSelectSql()}
        WHERE b.id = $1
        ${ownerFilter}
        ORDER BY t.created_at ASC
      `,
      params,
    );

    sendSuccess(response, 200, "Tiket pesanan berhasil dimuat", {
      tickets: result.rows.map(mapTicket),
    });
  } catch (error) {
    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}
