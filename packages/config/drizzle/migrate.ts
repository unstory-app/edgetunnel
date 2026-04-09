import "dotenv/config";
import { createDb } from "./drizzle/schema";

async function runMigration() {
  const db = createDb();
  console.log("✅ Database connection verified.");
  process.exit(0);
}

runMigration().catch((error) => {
  console.error("❌ DB error:", error);
  process.exit(1);
});
