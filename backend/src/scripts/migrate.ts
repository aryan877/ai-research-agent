import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

dotenv.config();

const runMigrations = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log("Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed successfully");
  } catch (error: any) {
    if (
      error.cause?.code === "42P07" ||
      error.message?.includes("already exists")
    ) {
      console.log("Tables already exist, skipping migration");
    } else {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
};

runMigrations();
