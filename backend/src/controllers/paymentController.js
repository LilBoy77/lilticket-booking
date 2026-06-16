import crypto from "crypto";
import pool from "../config/database.js";
import { createHttpError } from "../utils/httpError.js";
import { requireUuid } from "../utils/validation.js";

const XENDIT_INVOICE_URL = "https://api.xendit.co/v2/invoices";
const PAYMENT_EXPIRY_SECONDS = 600;
const PAID_XENDIT_STATUSES = ["PAID", "SETTLED"];
const DUMMY_XENDIT_SECRET_KEYS = [
  "dummy",
  "dummy_xendit_secret_key",
  "changeme",
  "change-me",
  "your_xendit_secret_key",
  "xendit_secret_key",
];
const DUMMY_WEBHOOK_TOKENS = ["dummy", "changeme", "change-me", "your_webhook_token", "xendit_webhook_token"];

function sendSuccess(response, statusCode, message, data) {
  response.status(statusCode).json({
    data,
    message,
    status: "success",
  });
}

function generateTicketCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(5).toString("hex").toUpperCase();

  return `TKT-${date}-${random}`;
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

function getPublicBackendInfo() {
  const publicBackendUrl = process.env.PUBLIC_BACKEND_URL?.trim().replace(/\/$/, "");

  if (!publicBackendUrl) {
    return null;
  }

  return {
    public_backend_url: publicBackendUrl,
    webhook_url: `${publicBackendUrl}/api/payments/xendit/webhook`,
  };
}

function isWebhookTokenConfigured(token) {
  if (!token || token.trim() === "") {
    return false;
  }

  return !DUMMY_WEBHOOK_TOKENS.includes(token.trim().toLowerCase());
}

function validateWebhookToken(request) {
  const configuredToken = process.env.XENDIT_WEBHOOK_TOKEN;

  if (!isWebhookTokenConfigured(configuredToken)) {
    console.warn("XENDIT_WEBHOOK_TOKEN is not configured or still dummy. Skipping webhook token validation.");
    return;
  }

  const callbackToken = request.get("x-callback-token");

  if (callbackToken !== configuredToken) {
    throw createHttpError(401, "Token callback Xendit tidak valid");
  }
}

function isXenditSecretKeyConfigured(secretKey) {
  if (!secretKey || secretKey.trim() === "") {
    return false;
  }

  return !DUMMY_XENDIT_SECRET_KEYS.includes(secretKey.trim().toLowerCase());
}

function getXenditAuthHeader() {
  const secretKey = process.env.XENDIT_SECRET_KEY;

  if (!isXenditSecretKeyConfigured(secretKey)) {
    throw createHttpError(500, "Konfigurasi Xendit belum lengkap");
  }

  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

async function parseXenditResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {
      message: text,
    };
  }
}

async function createXenditInvoice(booking) {
  const frontendUrl = getFrontendUrl();
  const amount = Number(booking.total_amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw createHttpError(400, "Nominal pembayaran harus lebih dari 0");
  }

  const payload = {
    amount,
    description: `Pembayaran untuk pesanan LilTicket ${booking.booking_code}`,
    expiry_duration: PAYMENT_EXPIRY_SECONDS,
    external_id: booking.booking_code,
    failure_redirect_url: `${frontendUrl}/payment/failed?booking_id=${booking.id}`,
    success_redirect_url: `${frontendUrl}/payment/success?booking_id=${booking.id}`,
  };

  const response = await fetch(XENDIT_INVOICE_URL, {
    body: JSON.stringify(payload),
    headers: {
      Authorization: getXenditAuthHeader(),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const responseBody = await parseXenditResponse(response);

  if (!response.ok) {
    const message = responseBody?.message || "Gagal membuat invoice Xendit";
    throw createHttpError(400, message);
  }

  if (!responseBody?.invoice_url || !responseBody?.id) {
    throw createHttpError(502, "Response invoice Xendit tidak valid");
  }

  return responseBody;
}

async function getBookingPayment(client, bookingId) {
  const result = await client.query(
    `
      SELECT
        b.id,
        b.user_id,
        b.booking_code,
        b.status AS booking_status,
        b.expires_at AS booking_expires_at,
        b.total_amount,
        p.id AS payment_id,
        p.status AS payment_status,
        p.amount AS payment_amount,
        p.checkout_url,
        p.expired_at AS payment_expired_at,
        p.xendit_invoice_id,
        p.xendit_external_id
      FROM bookings b
      JOIN payments p ON p.booking_id = b.id
      WHERE b.id = $1
      LIMIT 1
      FOR UPDATE OF p
    `,
    [bookingId],
  );

  return result.rows[0] || null;
}

async function getWebhookPayment(client, body) {
  const invoiceId = typeof body?.id === "string" ? body.id : null;
  const externalId = typeof body?.external_id === "string" ? body.external_id : null;

  if (!invoiceId && !externalId) {
    throw createHttpError(400, "Payload webhook wajib menyertakan id atau external_id");
  }

  const result = await client.query(
    `
      SELECT
        p.id AS payment_id,
        p.booking_id,
        p.status AS payment_status,
        p.xendit_invoice_id,
        p.xendit_external_id,
        b.status AS booking_status
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      WHERE
        ($1::text IS NOT NULL AND p.xendit_invoice_id = $1)
        OR ($2::text IS NOT NULL AND p.xendit_external_id = $2)
      LIMIT 1
      FOR UPDATE OF p, b
    `,
    [invoiceId, externalId],
  );

  return result.rows[0] || null;
}

async function createMissingTickets(client, bookingId) {
  const itemsResult = await client.query(
    `
      SELECT id, quantity
      FROM booking_items
      WHERE booking_id = $1
      ORDER BY created_at ASC
    `,
    [bookingId],
  );

  for (const item of itemsResult.rows) {
    const ticketsResult = await client.query(
      `
        SELECT COUNT(*)::INTEGER AS total
        FROM tickets
        WHERE booking_id = $1 AND booking_item_id = $2
      `,
      [bookingId, item.id],
    );
    const existingTickets = ticketsResult.rows[0]?.total || 0;
    const missingTickets = item.quantity - existingTickets;

    for (let index = 0; index < missingTickets; index += 1) {
      await createActiveTicket(client, bookingId, item.id);
    }
  }
}

async function createActiveTicket(client, bookingId, bookingItemId) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await client.query(
        `
          INSERT INTO tickets (booking_id, booking_item_id, ticket_code, status, activated_at)
          VALUES ($1, $2, $3, 'ACTIVE', NOW())
        `,
        [bookingId, bookingItemId, generateTicketCode()],
      );
      return;
    } catch (error) {
      if (error.code !== "23505" || attempt === 4) {
        throw error;
      }
    }
  }
}

function getPaidAtValue(body) {
  if (body?.paid_at && !Number.isNaN(Date.parse(body.paid_at))) {
    return new Date(body.paid_at);
  }

  return new Date();
}

export async function createXenditPayment(request, response, next) {
  let client;
  let transactionStarted = false;

  try {
    const bookingId = requireUuid(request.body?.booking_id, "booking_id");

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;
    const booking = await getBookingPayment(client, bookingId);

    if (!booking) {
      throw createHttpError(404, "Pesanan tidak ditemukan");
    }

    if (request.user.role !== "ADMIN" && booking.user_id !== request.user.id) {
      throw createHttpError(404, "Pesanan tidak ditemukan");
    }

    if (booking.booking_status === "CONFIRMED" || booking.payment_status === "PAID") {
      throw createHttpError(400, "Pesanan ini sudah dibayar.");
    }

    if (booking.booking_status === "CANCELLED" || booking.payment_status === "EXPIRED") {
      throw createHttpError(400, "Waktu pembayaran sudah habis. Silakan buat pesanan baru.");
    }

    if (booking.booking_status !== "WAITING_PAYMENT") {
      throw createHttpError(400, "Pesanan tidak sedang menunggu pembayaran");
    }

    if (booking.payment_status !== "PENDING") {
      throw createHttpError(400, "Pembayaran tidak berstatus tertunda");
    }

    const expiresAt = booking.payment_expired_at || booking.booking_expires_at;

    if (expiresAt && new Date(expiresAt) <= new Date()) {
      await client.query(
        `
          UPDATE payments
          SET status = 'EXPIRED', expired_at = COALESCE(expired_at, NOW()), updated_at = NOW()
          WHERE id = $1 AND status = 'PENDING'
        `,
        [booking.payment_id],
      );
      await client.query(
        `
          UPDATE bookings
          SET status = 'CANCELLED', cancelled_at = COALESCE(cancelled_at, NOW()), updated_at = NOW()
          WHERE id = $1 AND status = 'WAITING_PAYMENT'
        `,
        [booking.id],
      );
      await client.query("COMMIT");
      transactionStarted = false;
      throw createHttpError(400, "Waktu pembayaran sudah habis. Silakan buat pesanan baru.");
    }

    if (booking.checkout_url) {
      await client.query("COMMIT");
      transactionStarted = false;
      sendSuccess(response, 200, "Link checkout Xendit berhasil dimuat", {
        checkout_url: booking.checkout_url,
        public_backend: getPublicBackendInfo(),
        payment: {
          amount: booking.payment_amount,
          id: booking.payment_id,
          status: booking.payment_status,
          xendit_external_id: booking.xendit_external_id,
          xendit_invoice_id: booking.xendit_invoice_id,
        },
      });
      return;
    }

    const invoice = await createXenditInvoice(booking);
    const expiryResult = await client.query("SELECT NOW() + interval '10 minutes' AS expired_at");
    const expiredAt = expiryResult.rows[0].expired_at;

    await client.query(
      `
        UPDATE bookings
        SET expires_at = $1, updated_at = NOW()
        WHERE id = $2
      `,
      [expiredAt, booking.id],
    );

    const updateResult = await client.query(
      `
        UPDATE payments
        SET
          checkout_url = $1,
          xendit_invoice_id = $2,
          xendit_external_id = $3,
          payment_reference = $2,
          expired_at = $5,
          updated_at = NOW()
        WHERE id = $4
        RETURNING id, amount, status, checkout_url, xendit_invoice_id, xendit_external_id
      `,
      [invoice.invoice_url, invoice.id, invoice.external_id || booking.booking_code, booking.payment_id, expiredAt],
    );
    const payment = updateResult.rows[0];

    await client.query("COMMIT");
    transactionStarted = false;

    sendSuccess(response, 201, "Link checkout Xendit berhasil dibuat", {
      checkout_url: payment.checkout_url,
      public_backend: getPublicBackendInfo(),
      payment: {
        amount: payment.amount,
        id: payment.id,
        status: payment.status,
        xendit_external_id: payment.xendit_external_id,
        xendit_invoice_id: payment.xendit_invoice_id,
      },
    });
  } catch (error) {
    if (client && transactionStarted) {
      await client.query("ROLLBACK");
    }

    if (error.code === "42703") {
      next(createHttpError(500, "Tabel pembayaran belum memiliki kolom Xendit"));
      return;
    }

    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function handleXenditWebhook(request, response, next) {
  let client;
  let transactionStarted = false;

  try {
    validateWebhookToken(request);

    const xenditStatus = typeof request.body?.status === "string" ? request.body.status.toUpperCase() : null;
    const externalId = typeof request.body?.external_id === "string" ? request.body.external_id : null;

    if (process.env.NODE_ENV !== "production") {
      console.log("Xendit webhook received", {
        external_id: externalId,
        status: xenditStatus,
      });
    }

    if (!xenditStatus) {
      throw createHttpError(400, "Status payload webhook wajib diisi");
    }

    if (![...PAID_XENDIT_STATUSES, "EXPIRED"].includes(xenditStatus)) {
      response.status(200).json({
        message: "Webhook processed",
        status: "success",
      });
      return;
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const payment = await getWebhookPayment(client, request.body);

    if (!payment) {
      await client.query("COMMIT");
      transactionStarted = false;

      response.status(200).json({
        ignored: true,
        message: "Webhook diterima, tetapi invoice tidak ditemukan. Diabaikan.",
      });
      return;
    }

    if (PAID_XENDIT_STATUSES.includes(xenditStatus)) {
      await client.query(
        `
          UPDATE payments
          SET status = 'PAID', paid_at = COALESCE(paid_at, $1), updated_at = NOW()
          WHERE id = $2
        `,
        [getPaidAtValue(request.body), payment.payment_id],
      );

      await client.query(
        `
          UPDATE bookings
          SET status = 'CONFIRMED', confirmed_at = COALESCE(confirmed_at, NOW()), updated_at = NOW()
          WHERE id = $1
        `,
        [payment.booking_id],
      );

      await createMissingTickets(client, payment.booking_id);
    }

    if (xenditStatus === "EXPIRED" && payment.payment_status !== "PAID") {
      await client.query(
        `
          UPDATE payments
          SET status = 'EXPIRED', expired_at = COALESCE(expired_at, NOW()), updated_at = NOW()
          WHERE id = $1
        `,
        [payment.payment_id],
      );

      await client.query(
        `
          UPDATE bookings
          SET status = 'CANCELLED', cancelled_at = COALESCE(cancelled_at, NOW()), updated_at = NOW()
          WHERE id = $1 AND status <> 'CONFIRMED'
        `,
        [payment.booking_id],
      );
    }

    await client.query("COMMIT");
    transactionStarted = false;

    response.status(200).json({
      message: "Webhook processed",
      status: "success",
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
