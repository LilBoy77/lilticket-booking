const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const DEFAULT_AUTH_COOKIE_MAX_AGE = 7 * ONE_DAY_IN_MILLISECONDS;
const TIME_UNIT_IN_MILLISECONDS = {
  d: ONE_DAY_IN_MILLISECONDS,
  h: 60 * 60 * 1000,
  m: 60 * 1000,
  s: 1000,
};

function getJwtMaxAge() {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  if (/^\d+$/.test(expiresIn)) {
    return Number(expiresIn) * 1000;
  }

  const match = expiresIn.match(/^(\d+)([dhms])$/i);

  if (!match) {
    return DEFAULT_AUTH_COOKIE_MAX_AGE;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  return amount * TIME_UNIT_IN_MILLISECONDS[unit];
}

export function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    maxAge: getJwtMaxAge(),
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  };
}

export function getClearAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  };
}
