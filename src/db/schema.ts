import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const placeholder = sqliteTable("placeholder", {
  id: integer("id").primaryKey(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
