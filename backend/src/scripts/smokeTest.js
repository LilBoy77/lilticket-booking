const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:5055/api";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || "admin@lilticket.test";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || "Admin12345!";
const CUSTOMER_EMAIL = process.env.SMOKE_CUSTOMER_EMAIL || "customer@lilticket.test";
const CUSTOMER_PASSWORD = process.env.SMOKE_CUSTOMER_PASSWORD || "Customer12345!";

const results = [];

function stringifySafe(value) {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return "";
  }
}

function containsSensitiveUserData(value) {
  return stringifySafe(value).includes("password_hash");
}

function getCookieHeader(response) {
  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) {
    return "";
  }

  return setCookie
    .split(",")
    .map((cookie) => cookie.trim().split(";")[0])
    .filter((cookie) => cookie.includes("="))
    .join("; ");
}

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {
      raw: text,
    };
  }
}

async function request(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers,
    method: options.method || "GET",
  });
  const data = await readJson(response);

  return {
    cookie: getCookieHeader(response),
    data,
    ok: response.ok,
    status: response.status,
  };
}

function record(name, passed, details = "") {
  results.push({
    details,
    name,
    passed,
  });
}

async function test(name, callback) {
  try {
    const details = await callback();
    record(name, true, details);
  } catch (error) {
    record(name, false, error.message);
  }
}

function expectStatus(result, expectedStatus, endpointName) {
  if (result.status !== expectedStatus) {
    throw new Error(`${endpointName} expected ${expectedStatus}, got ${result.status}`);
  }
}

function expectNoPasswordHash(result, endpointName) {
  if (containsSensitiveUserData(result.data)) {
    throw new Error(`${endpointName} response contains password_hash`);
  }
}

async function loginAs(email, password, expectedRole) {
  const result = await request("/auth/login", {
    body: {
      email,
      password,
    },
    method: "POST",
  });

  expectStatus(result, 200, "POST /auth/login");
  expectNoPasswordHash(result, "POST /auth/login");

  const userRole = result.data?.data?.user?.role;

  if (userRole !== expectedRole) {
    throw new Error(`POST /auth/login expected role ${expectedRole}, got ${userRole || "none"}`);
  }

  if (!result.cookie) {
    throw new Error("POST /auth/login did not return auth cookie");
  }

  return {
    cookie: result.cookie,
    result,
  };
}

async function main() {
  let adminCookie = "";
  let customerCookie = "";
  let customerLoginResult = null;
  let customerMeResult = null;
  let eventsResult = null;
  let myBookingsResult = null;

  await test("GET /health", async () => {
    const result = await request("/health");
    expectStatus(result, 200, "GET /health");
    return result.data?.message || "";
  });

  await test("GET /health/db", async () => {
    const result = await request("/health/db");
    expectStatus(result, 200, "GET /health/db");
    return result.data?.message || "";
  });

  await test("POST /auth/login admin", async () => {
    const login = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD, "ADMIN");
    adminCookie = login.cookie;
    return "admin login ok";
  });

  await test("GET /auth/me admin", async () => {
    const result = await request("/auth/me", {
      cookie: adminCookie,
    });
    expectStatus(result, 200, "GET /auth/me");
    expectNoPasswordHash(result, "GET /auth/me");

    if (result.data?.data?.user?.role !== "ADMIN") {
      throw new Error("GET /auth/me did not return ADMIN user");
    }

    return "admin me ok";
  });

  await test("POST /auth/logout admin", async () => {
    const result = await request("/auth/logout", {
      cookie: adminCookie,
      method: "POST",
    });
    expectStatus(result, 200, "POST /auth/logout");
    return "admin logout ok";
  });

  await test("POST /auth/login customer", async () => {
    const login = await loginAs(CUSTOMER_EMAIL, CUSTOMER_PASSWORD, "CUSTOMER");
    customerCookie = login.cookie;
    customerLoginResult = login.result;
    return "customer login ok";
  });

  await test("GET /auth/me customer", async () => {
    const result = await request("/auth/me", {
      cookie: customerCookie,
    });
    customerMeResult = result;
    expectStatus(result, 200, "GET /auth/me");
    expectNoPasswordHash(result, "GET /auth/me");

    if (result.data?.data?.user?.role !== "CUSTOMER") {
      throw new Error("GET /auth/me did not return CUSTOMER user");
    }

    return "customer me ok";
  });

  await test("Security login response", async () => {
    expectNoPasswordHash(customerLoginResult, "POST /auth/login");
    return "login response does not contain password_hash";
  });

  await test("Security me response", async () => {
    expectNoPasswordHash(customerMeResult, "GET /auth/me");
    return "me response does not contain password_hash";
  });

  await test("GET /events", async () => {
    const result = await request("/events");
    eventsResult = result;
    expectStatus(result, 200, "GET /events");

    const events = result.data?.data?.events;

    if (!Array.isArray(events)) {
      throw new Error("GET /events did not return events array");
    }

    return `${events.length} event(s)`;
  });

  await test("GET /events/:id", async () => {
    const event = eventsResult?.data?.data?.events?.[0];

    if (!event?.id) {
      throw new Error("GET /events returned no event id to test");
    }

    const result = await request(`/events/${event.id}`);
    expectStatus(result, 200, "GET /events/:id");
    return event.id;
  });

  await test("GET /events/invalid-id", async () => {
    const result = await request("/events/invalid-id");
    expectStatus(result, 400, "GET /events/invalid-id");
    return "invalid id returns 400";
  });

  await test("GET /bookings/my", async () => {
    const result = await request("/bookings/my", {
      cookie: customerCookie,
    });
    myBookingsResult = result;
    expectStatus(result, 200, "GET /bookings/my");

    const bookings = result.data?.data?.bookings;

    if (!Array.isArray(bookings)) {
      throw new Error("GET /bookings/my did not return bookings array");
    }

    return `${bookings.length} booking(s)`;
  });

  await test("GET /bookings/:bookingId/tickets", async () => {
    const booking = myBookingsResult?.data?.data?.bookings?.[0];

    if (!booking?.id) {
      return "no customer booking available, non-mutating ticket endpoint check skipped";
    }

    const result = await request(`/bookings/${booking.id}/tickets`, {
      cookie: customerCookie,
    });
    expectStatus(result, 200, "GET /bookings/:bookingId/tickets");
    return booking.id;
  });

  await test("POST /payments/xendit/create validation", async () => {
    const result = await request("/payments/xendit/create", {
      body: {},
      cookie: customerCookie,
      method: "POST",
    });
    expectStatus(result, 400, "POST /payments/xendit/create");
    return "empty booking_id returns 400";
  });

  for (const result of results) {
    const label = result.passed ? "PASS" : "FAIL";
    const details = result.details ? ` - ${result.details}` : "";
    console.log(`${label} ${result.name}${details}`);
  }

  const failed = results.filter((result) => !result.passed);

  console.log("");
  console.log(`${results.length - failed.length}/${results.length} smoke checks passed`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`FAIL smoke test runner - ${error.message}`);
  process.exitCode = 1;
});
