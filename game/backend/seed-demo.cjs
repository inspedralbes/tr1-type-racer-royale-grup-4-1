const mysql = require("mysql2/promise");
const fs = require("node:fs/promises");
const path = require("node:path");
const { existsSync } = require("node:fs");

async function seed() {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME } = process.env;
  if (process.env.DEMO_MODE !== "true" || DB_NAME !== "journalismrace_demo") {
    throw new Error("Expected the isolated JournalismRace demo database");
  }
  if (!DB_HOST || !DB_USER || (process.env.DB_SSL !== "false" && !DB_PASSWORD)) {
    throw new Error("Configure DB_HOST, DB_USER and DB_PASSWORD in Render");
  }
  const db = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: Number(DB_PORT || 4000),
    ...(process.env.DB_SSL !== "false" && { ssl: { rejectUnauthorized: true, minVersion: "TLSv1.2" } }),
    multipleStatements: true,
  });
  try {
    await db.query("CREATE DATABASE IF NOT EXISTS journalismrace_demo CHARACTER SET utf8mb4");
    await db.changeUser({ database: DB_NAME });
    const bundledSchema = path.join(__dirname, "init.sql");
    const schemaPath = existsSync(bundledSchema) ? bundledSchema : path.join(__dirname, "../db/db_init/init.sql");
    const original = await fs.readFile(schemaPath, "utf8");
    const schema = original
      .replace(/^USE .*;\r?$/gm, "")
      .replace(/^DROP TABLE .*;\r?$/gm, "")
      .replace(/^CREATE TABLE (?!IF NOT EXISTS)/gm, "CREATE TABLE IF NOT EXISTS ")
      .replace(/^ALTER TABLE users ADD UNIQUE KEY .*;\r?$/gm, "")
      .replace(/^CREATE INDEX .*;\r?$/gm, "")
      .replace("username VARCHAR(100) NOT NULL,", "username VARCHAR(100) NOT NULL UNIQUE,")
      .replace(/^SELECT r\.\*,[\s\S]*?ORDER BY r\.created_at DESC;/m, "")
      .replace(/^INSERT INTO /gm, "INSERT IGNORE INTO ");
    await db.query(schema);
  } finally {
    await db.end();
  }
}

seed().catch((error) => {
  console.error("JournalismRace demo setup failed:", error.code || error.message);
  process.exitCode = 1;
});
