import { query } from "../config/database.js";
import { createHttpError } from "../utils/httpError.js";
import {
  optionalString,
  requireUuid,
  validateDate,
  validateOptionalDate,
  validateOptionalUrl,
  validatePagination,
} from "../utils/validation.js";

const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "CANCELLED"];

const SORT_OPTIONS = {
  latest: "e.created_at DESC",
  oldest: "e.created_at ASC",
  start_at_asc: "e.start_at ASC",
  start_at_desc: "e.start_at DESC",
  title_asc: "e.title ASC",
  title_desc: "e.title DESC",
};

const EVENT_SELECT = `
  SELECT
    e.id,
    e.category_id,
    e.venue_id,
    e.title,
    e.description,
    e.poster_url,
    e.banner_url,
    e.start_at,
    e.end_at,
    e.status,
    e.created_at,
    e.updated_at,
    c.name AS category_name,
    c.description AS category_description,
    v.name AS venue_name,
    v.address AS venue_address,
    v.city AS venue_city,
    v.province AS venue_province,
    v.capacity AS venue_capacity
  FROM events e
  JOIN categories c ON c.id = e.category_id
  JOIN venues v ON v.id = e.venue_id
`;

function validateStatus(status) {
  if (!EVENT_STATUSES.includes(status)) {
    throw createHttpError(400, "Status acara harus salah satu dari DRAFT, PUBLISHED, CANCELLED");
  }
}

function requireBodyString(body, fieldName, message) {
  const value = body?.[fieldName];

  if (typeof value !== "string" || value.trim() === "") {
    throw createHttpError(400, message);
  }

  return value.trim();
}

function requireRequestUuid(value, missingMessage, label) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw createHttpError(400, missingMessage);
  }

  return requireUuid(value, label);
}

function getEventParamId(request) {
  const eventId = request.params.id || request.params.eventId;

  if (!eventId) {
    throw createHttpError(400, "ID acara wajib diisi");
  }

  return requireUuid(eventId, "event id");
}

function mapEvent(row) {
  return {
    banner_url: row.banner_url,
    poster_url: row.poster_url,
    category: {
      description: row.category_description,
      id: row.category_id,
      name: row.category_name,
    },
    created_at: row.created_at,
    description: row.description,
    end_at: row.end_at,
    id: row.id,
    start_at: row.start_at,
    status: row.status,
    title: row.title,
    updated_at: row.updated_at,
    venue: {
      address: row.venue_address,
      capacity: row.venue_capacity,
      city: row.venue_city,
      id: row.venue_id,
      name: row.venue_name,
      province: row.venue_province,
    },
  };
}

function buildEventFilters(filters) {
  const conditions = ["e.status = 'PUBLISHED'"];
  const params = [];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`
      (
        e.title ILIKE $${params.length}
        OR e.description ILIKE $${params.length}
        OR c.name ILIKE $${params.length}
        OR v.name ILIKE $${params.length}
      )
    `);
  }

  if (filters.category) {
    params.push(filters.category);
    conditions.push(`(e.category_id::TEXT = $${params.length} OR LOWER(c.name) = LOWER($${params.length}))`);
  }

  if (filters.city) {
    params.push(filters.city);
    conditions.push(`LOWER(v.city) = LOWER($${params.length})`);
  }

  return {
    params,
    whereSql: `WHERE ${conditions.join(" AND ")}`,
  };
}

function buildAdminEventFilters(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`
      (
        e.title ILIKE $${params.length}
        OR e.description ILIKE $${params.length}
        OR c.name ILIKE $${params.length}
        OR v.name ILIKE $${params.length}
      )
    `);
  }

  if (filters.status) {
    validateStatus(filters.status);
    params.push(filters.status);
    conditions.push(`e.status = $${params.length}`);
  }

  if (filters.category) {
    params.push(filters.category);
    conditions.push(`(e.category_id::TEXT = $${params.length} OR LOWER(c.name) = LOWER($${params.length}))`);
  }

  if (filters.city) {
    params.push(filters.city);
    conditions.push(`LOWER(v.city) = LOWER($${params.length})`);
  }

  return {
    params,
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
  };
}

async function getEventById(id) {
  const result = await query(
    `
      ${EVENT_SELECT}
      WHERE e.id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] || null;
}

async function ensureEventExists(id) {
  const event = await getEventById(id);

  if (!event) {
    throw createHttpError(404, "Acara tidak ditemukan");
  }

  return event;
}

export async function getEvents(request, response, next) {
  try {
    const { limit, offset, page } = validatePagination(request.query);
    const sort = SORT_OPTIONS[request.query.sort] ? request.query.sort : "start_at_asc";
    const { params, whereSql } = buildEventFilters({
      category: request.query.category?.trim(),
      city: request.query.city?.trim(),
      search: request.query.search?.trim(),
    });

    const countResult = await query(
      `
        SELECT COUNT(*)::INTEGER AS total
        FROM events e
        JOIN categories c ON c.id = e.category_id
        JOIN venues v ON v.id = e.venue_id
        ${whereSql}
      `,
      params,
    );

    const listParams = [...params, limit, offset];
    const eventsResult = await query(
      `
        ${EVENT_SELECT}
        ${whereSql}
        ORDER BY ${SORT_OPTIONS[sort]}
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `,
      listParams,
    );

    const total = countResult.rows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    response.status(200).json({
      data: {
        events: eventsResult.rows.map(mapEvent),
        pagination: {
          limit,
          page,
          total,
          total_pages: totalPages,
        },
      },
      message: "Daftar acara berhasil dimuat",
      status: "success",
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminEvents(request, response, next) {
  try {
    const { limit, offset, page } = validatePagination(request.query);
    const sort = SORT_OPTIONS[request.query.sort] ? request.query.sort : "latest";
    const { params, whereSql } = buildAdminEventFilters({
      category: request.query.category?.trim(),
      city: request.query.city?.trim(),
      search: request.query.search?.trim(),
      status: request.query.status?.trim(),
    });

    const countResult = await query(
      `
        SELECT COUNT(*)::INTEGER AS total
        FROM events e
        JOIN categories c ON c.id = e.category_id
        JOIN venues v ON v.id = e.venue_id
        ${whereSql}
      `,
      params,
    );

    const listParams = [...params, limit, offset];
    const eventsResult = await query(
      `
        ${EVENT_SELECT}
        ${whereSql}
        ORDER BY ${SORT_OPTIONS[sort]}
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `,
      listParams,
    );

    const total = countResult.rows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    response.status(200).json({
      data: {
        events: eventsResult.rows.map(mapEvent),
        pagination: {
          limit,
          page,
          total,
          total_pages: totalPages,
        },
      },
      message: "Daftar acara admin berhasil dimuat",
      status: "success",
    });
  } catch (error) {
    next(error);
  }
}

export async function getEventDetail(request, response, next) {
  try {
    const eventId = getEventParamId(request);

    const event = await getEventById(eventId);

    if (!event || event.status !== "PUBLISHED") {
      throw createHttpError(404, "Acara tidak ditemukan");
    }

    const ticketTypesResult = await query(
      `
        SELECT id, event_id, name, description, price, quota, sold_quantity, sale_start_at, sale_end_at, created_at, updated_at
        FROM ticket_types
        WHERE event_id = $1
        ORDER BY price ASC
      `,
      [event.id],
    );

    response.status(200).json({
      data: {
        event: {
          ...mapEvent(event),
          ticket_types: ticketTypesResult.rows,
        },
      },
      message: "Detail acara berhasil dimuat",
      status: "success",
    });
  } catch (error) {
    next(error);
  }
}

export async function createEvent(request, response, next) {
  try {
    const categoryId = requireRequestUuid(request.body?.category_id, "Kategori acara wajib dipilih", "Kategori acara");
    const venueId = requireRequestUuid(request.body?.venue_id, "Venue acara wajib dipilih", "Venue acara");
    const title = requireBodyString(request.body, "title", "Nama acara wajib diisi");
    const startAt = requireBodyString(request.body, "start_at", "Tanggal acara wajib diisi");
    const status = requireBodyString(request.body, "status", "Status acara wajib diisi");
    const description = optionalString(request.body, "description");
    const posterUrl = optionalString(request.body, "poster_url");
    const bannerUrl = optionalString(request.body, "banner_url");
    const endAt = optionalString(request.body, "end_at");

    if (title.length < 3) {
      throw createHttpError(400, "Nama acara minimal 3 karakter");
    }

    if (!description || description.length < 10) {
      throw createHttpError(400, "Deskripsi acara minimal 10 karakter");
    }

    validateStatus(status);
    validateDate(startAt, "Tanggal acara");
    validateOptionalDate(endAt, "Tanggal selesai acara");
    validateOptionalUrl(posterUrl, "URL poster acara");
    validateOptionalUrl(bannerUrl, "URL banner acara");

    if (new Date(startAt) < new Date()) {
      throw createHttpError(400, "Tanggal mulai acara tidak boleh di masa lalu");
    }

    if (endAt && new Date(endAt) <= new Date(startAt)) {
      throw createHttpError(400, "Tanggal selesai acara harus lebih besar dari tanggal mulai acara");
    }

    const result = await query(
      `
        INSERT INTO events (category_id, venue_id, title, description, poster_url, banner_url, start_at, end_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [categoryId, venueId, title, description, posterUrl, bannerUrl, startAt, endAt, status],
    );

    const event = await getEventById(result.rows[0].id);

    response.status(201).json({
      data: {
        event: mapEvent(event),
      },
      message: "Acara berhasil dibuat",
      status: "success",
    });
  } catch (error) {
    if (error.code === "23503") {
      next(createHttpError(400, "Kategori atau venue tidak valid"));
      return;
    }

    next(error);
  }
}

export async function updateEvent(request, response, next) {
  try {
    const eventId = getEventParamId(request);
    const currentEvent = await ensureEventExists(eventId);
    const requiredFieldMessages = {
      category_id: "Kategori acara wajib dipilih",
      description: "Deskripsi acara wajib diisi",
      start_at: "Tanggal acara wajib diisi",
      status: "Status acara wajib diisi",
      title: "Nama acara wajib diisi",
      venue_id: "Venue acara wajib dipilih",
    };

    for (const fieldName of Object.keys(requiredFieldMessages)) {
      if (request.body?.[fieldName] === undefined || request.body?.[fieldName] === null || String(request.body[fieldName]).trim() === "") {
        throw createHttpError(400, requiredFieldMessages[fieldName]);
      }
    }

    const fields = [
      ["category_id", "category_id"],
      ["venue_id", "venue_id"],
      ["title", "title"],
      ["description", "description"],
      ["poster_url", "poster_url"],
      ["banner_url", "banner_url"],
      ["start_at", "start_at"],
      ["end_at", "end_at"],
      ["status", "status"],
    ];
    const setClauses = [];
    const params = [];

    for (const [bodyField, columnName] of fields) {
      if (request.body?.[bodyField] !== undefined) {
        const value =
          bodyField === "description" || bodyField === "poster_url" || bodyField === "banner_url" || bodyField === "end_at"
            ? optionalString(request.body, bodyField)
            : requireBodyString(request.body, bodyField, requiredFieldMessages[bodyField] || `${bodyField} wajib diisi`);

        if (bodyField === "category_id" || bodyField === "venue_id") {
          requireUuid(value, bodyField === "category_id" ? "Kategori acara" : "Venue acara");
        }

        if (bodyField === "title" && value.length < 3) {
          throw createHttpError(400, "Nama acara minimal 3 karakter");
        }

        if (bodyField === "description" && (!value || value.length < 10)) {
          throw createHttpError(400, "Deskripsi acara minimal 10 karakter");
        }

        if (bodyField === "status") {
          validateStatus(value);
        }

        if (bodyField === "start_at" || bodyField === "end_at") {
          validateOptionalDate(value, bodyField === "start_at" ? "Tanggal acara" : "Tanggal selesai acara");
        }

        if (bodyField === "poster_url") {
          validateOptionalUrl(value, "URL poster acara");
        }

        if (bodyField === "banner_url") {
          validateOptionalUrl(value, "URL banner acara");
        }

        params.push(value);
        setClauses.push(`${columnName} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      throw createHttpError(400, "Tidak ada data acara yang dikirim");
    }

    const nextStartAt = request.body?.start_at === undefined ? currentEvent.start_at : request.body.start_at;
    const nextEndAt = request.body?.end_at === undefined ? currentEvent.end_at : request.body.end_at;

    if (nextEndAt && new Date(nextEndAt) <= new Date(nextStartAt)) {
      throw createHttpError(400, "Tanggal selesai acara harus lebih besar dari tanggal mulai acara");
    }

    params.push(eventId);

    const result = await query(
      `
        UPDATE events
        SET ${setClauses.join(", ")}, updated_at = NOW()
        WHERE id = $${params.length}
        RETURNING id
      `,
      params,
    );

    const event = await getEventById(result.rows[0].id);

    response.status(200).json({
      data: {
        event: mapEvent(event),
      },
      message: "Acara berhasil diperbarui",
      status: "success",
    });
  } catch (error) {
    if (error.code === "23503") {
      next(createHttpError(400, "Kategori atau venue tidak valid"));
      return;
    }

    next(error);
  }
}

export async function deleteEvent(request, response, next) {
  try {
    const eventId = getEventParamId(request);
    const event = await ensureEventExists(eventId);

    await query("DELETE FROM events WHERE id = $1", [eventId]);

    response.status(200).json({
      data: {
        event: mapEvent(event),
      },
      message: "Acara berhasil dihapus",
      status: "success",
    });
  } catch (error) {
    next(error);
  }
}
