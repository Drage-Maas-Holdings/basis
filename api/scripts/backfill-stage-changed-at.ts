/**
 * One-time backfill script for the stage_changed_at column.
 *
 * For existing deals with stage "won" or "lost" where stage_changed_at is
 * null, this script sets stage_changed_at equal to updated_at.
 *
 * This is an approximation: updated_at reflects the most recent edit to
 * any field on the deal, not the time of the stage transition specifically.
 * For historical data this is the best available signal, but newly created
 * or updated deals will use the accurate stage_changed_at logic from the
 * deals route handler.
 */

import "dotenv/config";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { db } from "../src/db/client.js";
import { deals } from "../src/db/schema.js";

const targetStages = ["won", "lost"];

const rows = await db
  .select({ id: deals.id, stage: deals.stage, updatedAt: deals.updatedAt })
  .from(deals)
  .where(and(inArray(deals.stage, targetStages), isNull(deals.stageChangedAt)));

console.log(`Found ${rows.length} deal(s) to backfill:`);

for (const row of rows) {
  console.log(`  ${row.id} | stage=${row.stage} | updated_at=${row.updatedAt}`);
  await db
    .update(deals)
    .set({ stageChangedAt: row.updatedAt })
    .where(eq(deals.id, row.id));
}

console.log("Backfill complete.");