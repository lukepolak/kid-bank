import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Skarbonka database schema — owned by the Ledger module (src/db/ledger.ts).
// The entries table arrives with the entries slice (issue 04).

export const kids = sqliteTable("kids", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  archived: integer("archived", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
