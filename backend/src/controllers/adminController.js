import { query } from "../config/database.js";

function sendSuccess(response, statusCode, message, data) {
  response.status(statusCode).json({
    data,
    message,
    status: "success",
  });
}

function mapLatestBooking(row) {
  return {
    booking_code: row.booking_code,
    created_at: row.created_at,
    event: {
      id: row.event_id,
      title: row.event_title,
    },
    id: row.id,
    payment: {
      amount: row.payment_amount,
      status: row.payment_status,
    },
    status: row.status,
    total_amount: row.total_amount,
    user: {
      email: row.user_email,
      full_name: row.user_full_name,
      id: row.user_id,
      role: row.user_role,
    },
  };
}

export async function getDashboard(request, response, next) {
  try {
    const [
      eventsResult,
      bookingsResult,
      paidBookingsResult,
      pendingBookingsResult,
      revenueResult,
      ticketsSoldResult,
      latestBookingsResult,
    ] = await Promise.all([
      query("SELECT COUNT(*)::INTEGER AS total FROM events"),
      query("SELECT COUNT(*)::INTEGER AS total FROM bookings"),
      query(`
        SELECT COUNT(*)::INTEGER AS total
        FROM bookings b
        JOIN payments p ON p.booking_id = b.id
        WHERE b.status = 'CONFIRMED' AND p.status = 'PAID'
      `),
      query(`
        SELECT COUNT(*)::INTEGER AS total
        FROM bookings b
        JOIN payments p ON p.booking_id = b.id
        WHERE b.status = 'WAITING_PAYMENT' AND p.status = 'PENDING'
      `),
      query("SELECT COALESCE(SUM(amount), 0)::NUMERIC(12, 2) AS total FROM payments WHERE status = 'PAID'"),
      query("SELECT COUNT(*)::INTEGER AS total FROM tickets WHERE status IN ('ACTIVE', 'USED')"),
      query(
        `
          SELECT
            b.id,
            b.booking_code,
            b.status,
            b.total_amount,
            b.created_at,
            u.id AS user_id,
            u.full_name AS user_full_name,
            u.email AS user_email,
            u.role AS user_role,
            e.id AS event_id,
            e.title AS event_title,
            p.amount AS payment_amount,
            p.status AS payment_status
          FROM bookings b
          JOIN users u ON u.id = b.user_id
          JOIN events e ON e.id = b.event_id
          LEFT JOIN payments p ON p.booking_id = b.id
          ORDER BY b.created_at DESC
          LIMIT 5
        `,
      ),
    ]);

    sendSuccess(response, 200, "Dasbor berhasil dimuat", {
      latest_bookings: latestBookingsResult.rows.map(mapLatestBooking),
      total_bookings: bookingsResult.rows[0]?.total || 0,
      total_events: eventsResult.rows[0]?.total || 0,
      total_paid_bookings: paidBookingsResult.rows[0]?.total || 0,
      total_pending_bookings: pendingBookingsResult.rows[0]?.total || 0,
      total_revenue: revenueResult.rows[0]?.total || "0.00",
      total_tickets_sold: ticketsSoldResult.rows[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
}
