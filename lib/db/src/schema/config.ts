import { pgTable, serial, text, boolean, integer } from "drizzle-orm/pg-core";

export const configTable = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export type Config = typeof configTable.$inferSelect;
