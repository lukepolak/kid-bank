import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { entries, kids } from "./schema";

/**
 * The Ledger — Skarbonka's deep money module (SPEC issue 03+).
 *
 * Everything that touches SQL lives behind this interface: the Drizzle schema,
 * all queries, and balance derivation. Routes (and everything else) speak in
 * domain terms only: kids, accounts, balances, entries.
 *
 * Canonical vocabulary: CONTEXT.md (Account, Entry, Balance, Overdraft).
 */

export interface EntryRecord {
  id: string;
  amountGrosze: number;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntryInput {
  /** Signed integer grosze; the sign is the direction (CONTEXT.md: Entry). */
  amountGrosze: number;
  description?: string | null;
}

export interface AccountSummary {
  id: string;
  name: string;
  archived: boolean;
  /** Derived from the account's non-deleted Entries; never stored. */
  balanceGrosze: number;
  /** True exactly when balanceGrosze < 0 (Overdraft, CONTEXT.md). */
  overdraft: boolean;
}

export function createLedger(d1: D1Database) {
  const db = drizzle(d1);

  return {
    /** A new Kid with a fresh (empty, therefore zero) Account. */
    async addKid(name: string): Promise<AccountSummary> {
      const id = crypto.randomUUID();
      await db.insert(kids).values({ id, name });

      return {
        id,
        name,
        archived: false,
        balanceGrosze: 0,
        overdraft: false,
      };
    },

    /** Every kid's account with its derived balance (SPEC: ordered by name). */
    async listAccounts(): Promise<AccountSummary[]> {
      const rows = await db
        .select({
          id: kids.id,
          name: kids.name,
          archived: kids.archived,
          balanceGrosze:
            sql<number>`coalesce(sum(case when ${entries.deletedAt} is null then ${entries.amountGrosze} else 0 end), 0)`,
        })
        .from(kids)
        .leftJoin(entries, eq(entries.kidId, kids.id))
        .groupBy(kids.id)
        .orderBy(asc(kids.name));

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        archived: row.archived,
        balanceGrosze: row.balanceGrosze,
        overdraft: row.balanceGrosze < 0,
      }));
    },

    /**
     * Record a movement of money (Entry, CONTEXT.md). The balance is derived
     * from the non-deleted entries — never stored. Returns null for an
     * unknown kid (route maps that to 404).
     */
    async addEntry(
      kidId: string,
      input: EntryInput,
      createdBy: string,
    ): Promise<{ entry: EntryRecord; balanceGrosze: number; overdraft: boolean } | null> {
      const kid = await db
        .select({ id: kids.id })
        .from(kids)
        .where(eq(kids.id, kidId))
        .get();
      if (!kid) return null;

      const id = crypto.randomUUID();
      const now = new Date();
      await db.insert(entries).values({
        id,
        kidId,
        amountGrosze: input.amountGrosze,
        description: input.description ?? null,
        createdBy,
        createdAt: now,
        updatedAt: now,
      });

      const [{ balanceGrosze }] = await db
        .select({
          balanceGrosze: sql<number>`coalesce(sum(${entries.amountGrosze}), 0)`,
        })
        .from(entries)
        .where(eq(entries.kidId, kidId));

      const entry = await db
        .select()
        .from(entries)
        .where(eq(entries.id, id))
        .get();

      return {
        entry: serializeEntry(entry!),
        balanceGrosze,
        overdraft: balanceGrosze < 0,
      };
    },

    /**
     * An account's history: non-deleted entries, newest first (SPEC).
     * Returns null for an unknown kid (route maps that to 404).
     */
    async listEntries(kidId: string): Promise<EntryRecord[] | null> {
      const kid = await db
        .select({ id: kids.id })
        .from(kids)
        .where(eq(kids.id, kidId))
        .get();
      if (!kid) return null;

      const rows = await db
        .select()
        .from(entries)
        .where(and(eq(entries.kidId, kidId), isNull(entries.deletedAt)))
        .orderBy(desc(entries.createdAt), sql`rowid desc`);

      return rows.map(serializeEntry);
    },
  };
}

function serializeEntry(row: typeof entries.$inferSelect): EntryRecord {
  return {
    id: row.id,
    amountGrosze: row.amountGrosze,
    description: row.description,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type Ledger = ReturnType<typeof createLedger>;
