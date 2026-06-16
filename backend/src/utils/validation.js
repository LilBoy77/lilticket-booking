import { createHttpError } from "./httpError.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export function isValidUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export function isValidEmail(value) {
  return typeof value === "string" && EMAIL_PATTERN.test(value.trim());
}

export function isRequired(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function requireString(body, fieldName) {
  const value = body?.[fieldName];

  if (typeof value !== "string" || value.trim() === "") {
    throw createHttpError(400, `${fieldName} wajib diisi`);
  }

  return value.trim();
}

export function optionalString(body, fieldName) {
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

export function requireUuid(value, fieldName) {
  const normalizedValue = typeof value === "string" ? value.trim() : value;

  if (!isValidUuid(normalizedValue)) {
    throw createHttpError(400, `${fieldName} harus berupa ID yang valid`);
  }

  return normalizedValue;
}

export function isPositiveNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue > 0;
}

export function requirePositiveNumber(value, fieldName) {
  if (!isPositiveNumber(value)) {
    throw createHttpError(400, `${fieldName} harus lebih dari 0`);
  }

  return Number(value);
}

export function requirePositiveInteger(value, fieldName) {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw createHttpError(400, `${fieldName} harus lebih dari 0`);
  }

  return numericValue;
}

export function validatePagination(query, options = {}) {
  const defaultPage = options.defaultPage || DEFAULT_PAGE;
  const defaultLimit = options.defaultLimit || DEFAULT_LIMIT;
  const maxLimit = options.maxLimit || MAX_LIMIT;
  const page = Number.parseInt(query?.page, 10);
  const limit = Number.parseInt(query?.limit, 10);
  const safePage = Number.isNaN(page) || page < 1 ? defaultPage : page;
  const safeLimit = Number.isNaN(limit) || limit < 1 ? defaultLimit : Math.min(limit, maxLimit);

  return {
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    page: safePage,
  };
}

export function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw createHttpError(400, `${fieldName} harus salah satu dari: ${allowedValues.join(", ")}`);
  }

  return value;
}

export function validateDate(value, fieldName) {
  if (Number.isNaN(Date.parse(value))) {
    throw createHttpError(400, `${fieldName} harus berupa tanggal yang valid`);
  }
}

export function validateOptionalDate(value, fieldName) {
  if (value === null || value === undefined || value === "") {
    return;
  }

  validateDate(value, fieldName);
}

export function validateOptionalUrl(value, fieldName) {
  if (!isRequired(value)) {
    return;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
        throw createHttpError(400, `${fieldName} harus berupa URL yang valid`);
    }
  } catch (_error) {
    throw createHttpError(400, `${fieldName} harus berupa URL yang valid`);
  }
}
