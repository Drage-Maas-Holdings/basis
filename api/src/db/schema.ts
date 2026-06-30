import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  notes: text("notes"),
  ownerId: text("owner_id").notNull().references(() => users.id),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const deals = sqliteTable("deals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  stage: text("stage").notNull(),
  value: integer("value"),
  contactId: text("contact_id").references(() => contacts.id),
  ownerId: text("owner_id").notNull().references(() => users.id),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  dueAt: integer("due_at"),
  completed: integer("completed").notNull().default(0),
  contactId: text("contact_id").references(() => contacts.id),
  dealId: text("deal_id").references(() => deals.id),
  ownerId: text("owner_id").notNull().references(() => users.id),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const interactionLogs = sqliteTable("interaction_logs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  body: text("body").notNull(),
  contactId: text("contact_id").references(() => contacts.id),
  dealId: text("deal_id").references(() => deals.id),
  loggedBy: text("logged_by").notNull().references(() => users.id),
  createdAt: integer("created_at").notNull(),
});
