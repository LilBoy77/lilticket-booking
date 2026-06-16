import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
let hasLoggedDatabaseConnection = false;

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  if (process.env.NODE_ENV !== "production" && !hasLoggedDatabaseConnection) {
    console.log("Database connected");
    hasLoggedDatabaseConnection = true;
  }
});

pool.on("error", (error) => {
  if (process.env.NODE_ENV !== "production") {
    console.error("Database pool error:", error.message);
  }
});

export function query(text, params) {
  if (!databaseUrl) {
    throw new Error("Database connection is not configured");
  }

  return pool.query(text, params);
}

export default pool;
