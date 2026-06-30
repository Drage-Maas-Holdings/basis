import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { deals, contacts } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const STAGES = ["new", "qualified", "won", "lost"] as const;

const pipelineRoutes = new Hono();

pipelineRoutes.use("/pipeline", authMiddleware);

pipelineRoutes.get("/pipeline", async (c) => {
  const { owner_id } = c.req.query();

  const conditions: ReturnType<typeof eq>[] = [];

  if (owner_id) {
    conditions.push(eq(deals.ownerId, owner_id));
  }

  const where = conditions.length > 0
    ? conditions.length === 1
      ? conditions[0]
      : and(...conditions)
    : undefined;

  let query = db
    .select({
      id: deals.id,
      title: deals.title,
      stage: deals.stage,
      value: deals.value,
      contactId: deals.contactId,
      ownerId: deals.ownerId,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      contactId2: contacts.id,
      contactName: contacts.name,
      contactCompany: contacts.company,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id))
    .$dynamic();

  if (where) {
    query = query.where(where);
  }

  const rows = await query;

  const stages: Record<string, { deals: unknown[]; count: number; total: number }> = {};
  for (const stage of STAGES) {
    stages[stage] = { deals: [], count: 0, total: 0 };
  }

  let totalCount = 0;
  let totalValue = 0;

  for (const row of rows) {
    const deal = {
      id: row.id,
      title: row.title,
      stage: row.stage,
      value: row.value,
      contactId: row.contactId,
      ownerId: row.ownerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      contact: row.contactId2
        ? {
            id: row.contactId2,
            name: row.contactName,
            company: row.contactCompany,
          }
        : null,
    };

    if (stages[row.stage]) {
      stages[row.stage].deals.push(deal);
      stages[row.stage].count++;
      stages[row.stage].total += row.value ?? 0;
    }

    totalCount++;
    totalValue += row.value ?? 0;
  }

  return c.json({
    stages,
    summary: { totalCount, totalValue },
  });
});

export default pipelineRoutes;
