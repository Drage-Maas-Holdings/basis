import { createRoute, z, OpenAPIHono } from "@hono/zod-openapi";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { deals, contacts } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const STAGES = ["new", "qualified", "won", "lost"] as const;

const pipelineRoutes = new OpenAPIHono();

pipelineRoutes.use("/pipeline", authMiddleware);

const ErrorSchema = z.object({ error: z.string() }).openapi("Error");

const PipelineDealSchema = z
  .object({
    id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    title: z.string().openapi({ example: "Big Deal" }),
    stage: z.enum(STAGES),
    value: z.number().nullable().openapi({ example: 1000 }),
    contactId: z.string().nullable().openapi({ example: "ckly1x7s2000001qexxx" }),
    ownerId: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    createdAt: z.number().openapi({ example: 1700000000000 }),
    updatedAt: z.number().openapi({ example: 1700000000000 }),
    contact: z
      .object({
        id: z.string(),
        name: z.string(),
        company: z.string().nullable(),
      })
      .nullable(),
  })
  .openapi("PipelineDeal");

const StageSummarySchema = z
  .object({
    deals: z.array(PipelineDealSchema),
    count: z.number().openapi({ example: 0 }),
    total: z.number().openapi({ example: 0 }),
  })
  .openapi("StageSummary");

const PipelineResponseSchema = z
  .object({
    stages: z.object({
      new: StageSummarySchema,
      qualified: StageSummarySchema,
      won: StageSummarySchema,
      lost: StageSummarySchema,
    }),
    summary: z.object({
      totalCount: z.number().openapi({ example: 0 }),
      totalValue: z.number().openapi({ example: 0 }),
    }),
  })
  .openapi("PipelineResponse");

const pipelineRoute = createRoute({
  method: "get",
  path: "/pipeline",
  request: {
    query: z.object({
      owner_id: z.string().optional().openapi({ example: "ckly1x7s2000001qexxx" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PipelineResponseSchema,
        },
      },
      description: "Pipeline with deals grouped by stage",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
  },
  tags: ["Pipeline"],
  operationId: "getPipeline",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

pipelineRoutes.openapi(pipelineRoute, async (c) => {
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