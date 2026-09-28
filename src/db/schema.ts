import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// Skarbonka database schema — owned by the Ledger module (src/db/ledger.ts).

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

// A single movement of money into or out of a kid's account (Entry, CONTEXT.md):
// a signed amount in grosze, an optional description, the parent who made it,
// and soft-delete support (ADR 0001 — entries are editable, never hard-deleted).
export const entries = sqliteTable(
  "entries",
  {
    id: text("id").primaryKey(),
    kidId: text("kid_id")
      .notNull()
      .references(() => kids.id),
    amountGrosze: integer("amount_grosze").notNull(),
    description: text("description"),
    createdBy: text("created_by").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
  },
  (table) => [
    // History queries: entries for a kid, newest first.
    index("entries_kid_created_idx").on(table.kidId, table.createdAt),
  ],
);
