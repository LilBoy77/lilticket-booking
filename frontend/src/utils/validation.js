const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export function isRequired(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function required(value, label) {
  const valid = isRequired(value);

  if (!label) {
    return valid;
  }

  return valid ? "" : `${label} wajib diisi.`;
}

export function isValidEmail(value) {
  return typeof value === "string" && EMAIL_PATTERN.test(value.trim());
}

export function onlyDigits(value) {
  return /^\d+$/.test(String(value).trim());
}

export function minDigits(value, min) {
  return onlyDigits(value) && String(value).trim().length >= min;
}

export function minLength(value, min, label) {
  if (!isRequired(value)) {
    if (!label) {
      return false;
    }

    return `${label} wajib diisi.`;
  }

  if (!label) {
    return String(value).trim().length >= min;
  }

  return String(value).trim().length >= min ? "" : `${label} minimal ${min} karakter.`;
}

export function email(value, label = "Email") {
  if (!isRequired(value)) {
    return `${label} wajib diisi.`;
  }

  return isValidEmail(String(value)) ? "" : `${label} tidak valid.`;
}

export function password(value, label = "Password") {
  if (!isRequired(value)) {
    return `${label} wajib diisi.`;
  }

  return String(value).length >= 8 ? "" : `${label} minimal 8 karakter.`;
}

export function positiveNumber(value, label) {
  if (!isRequired(value)) {
    return `${label} wajib diisi.`;
  }

  return isPositiveNumber(value) ? "" : `${label} harus lebih dari 0.`;
}

export function isPositiveNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue > 0;
}

export function isValidUrl(value) {
  if (!isRequired(value)) {
    return true;
  }

  return URL_PATTERN.test(String(value).trim());
}

export function optionalUrl(value, label) {
  if (!isRequired(value)) {
    return "";
  }

  return isValidUrl(value) ? "" : `${label} harus berupa URL valid.`;
}

export function isValidDate(value) {
  return isRequired(value) && !Number.isNaN(Date.parse(value));
}

export function validDate(value, label) {
  if (!isRequired(value)) {
    return `${label} wajib diisi.`;
  }

  return isValidDate(value) ? "" : `${label} harus berupa tanggal valid.`;
}

export function optionalDate(value, label) {
  if (!isRequired(value)) {
    return "";
  }

  return Number.isNaN(Date.parse(value)) ? `${label} harus berupa tanggal valid.` : "";
}

export function isEndDateAfterStartDate(start, end) {
  if (!isRequired(end)) {
    return true;
  }

  if (!isValidDate(start) || !isValidDate(end)) {
    return false;
  }

  return new Date(end) > new Date(start);
}

export function requiredArrayItems(items, label) {
  return Array.isArray(items) && items.length > 0 ? "" : `${label} wajib dipilih.`;
}

export function validatePhoneNumber(value) {
  if (!isRequired(value)) {
    return "";
  }

  if (!onlyDigits(value)) {
    return "Nomor telepon hanya boleh berisi angka.";
  }

  return minDigits(value, 10) ? "" : "Nomor telepon minimal 10 digit.";
}

export function validateEnum(value, allowedValues, label) {
  if (!isRequired(value)) {
    return `${label} wajib diisi.`;
  }

  return allowedValues.includes(value) ? "" : `${label} tidak valid.`;
}
