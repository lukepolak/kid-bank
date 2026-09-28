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

    /** Rename a kid. The account, history, and balance are untouched. */
    async renameKid(id: string, name: string): Promise<AccountSummary | null> {
      const updated = await db
        .update(kids)
        .set({ name })
        .where(eq(kids.id, id))
        .returning({ id: kids.id });
      if (updated.length === 0) return null;
      return this.accountOf(id);
    },

    /**
     * Archive (or restore) a kid. Archiving hides the account from the home
     * screen but preserves everything — kids are never deleted (SPEC).
     */
    async setArchived(
      id: string,
      archived: boolean,
    ): Promise<AccountSummary | null> {
      const updated = await db
        .update(kids)
        .set({ archived })
        .where(eq(kids.id, id))
        .returning({ id: kids.id });
      if (updated.length === 0) return null;
      return this.accountOf(id);
    },

    /** One account's full summary, derived. */
    async accountOf(id: string): Promise<AccountSummary | null> {
      const kid = await db.select().from(kids).where(eq(kids.id, id)).get();
      if (!kid) return null;
      const { balanceGrosze, overdraft } = await this.balanceOf(id);
      return {
        id: kid.id,
        name: kid.name,
        archived: kid.archived,
        balanceGrosze,
        overdraft,
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

      const created = await this.getEntry(id);
      return { entry: created!, ...(await this.balanceOf(kidId)) };
    },

    /**
     * Remove a mistake from history and balance (ADR 0001): soft-delete only —
     * the row is never physically removed, deleted_at records the event.
     * Returns the account state, or null for unknown/already-deleted entries.
     */
    async deleteEntry(
      id: string,
    ): Promise<{ balanceGrosze: number; overdraft: boolean } | null> {
      const existing = await db
        .select()
        .from(entries)
        .where(and(eq(entries.id, id), isNull(entries.deletedAt)))
        .get();
      if (!existing) return null;

      await db
        .update(entries)
        .set({ deletedAt: new Date() })
        .where(eq(entries.id, id));

      return this.balanceOf(existing.kidId);
    },

    /**
     * Fix a mistake (ADR 0001): amount and description change, created_at is
     * preserved, updated_at records the change, balance follows. Returns
     * null for unknown or already-deleted entries (route maps to 404).
     */
    async editEntry(
      id: string,
      input: EntryInput,
    ): Promise<{ entry: EntryRecord; balanceGrosze: number; overdraft: boolean } | null> {
      const existing = await db
        .select()
        .from(entries)
        .where(and(eq(entries.id, id), isNull(entries.deletedAt)))
        .get();
      if (!existing) return null;

      await db
        .update(entries)
        .set({
          amountGrosze: input.amountGrosze,
          description: input.description ?? null,
          updatedAt: new Date(),
        })
        .where(eq(entries.id, id));

      const entry = await this.getEntry(id);
      return { entry: entry!, ...await this.balanceOf(existing.kidId) };
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

    async getEntry(id: string): Promise<EntryRecord | null> {
      const row = await db
        .select()
        .from(entries)
        .where(eq(entries.id, id))
        .get();
      return row ? serializeEntry(row) : null;
    },

    /** The account state: derived balance + overdraft flag (never stored). */
    async balanceOf(
      kidId: string,
    ): Promise<{ balanceGrosze: number; overdraft: boolean }> {
      const [{ balanceGrosze }] = await db
        .select({
          balanceGrosze: sql<number>`coalesce(sum(${entries.amountGrosze}), 0)`,
        })
        .from(entries)
        .where(and(eq(entries.kidId, kidId), isNull(entries.deletedAt)));

      return { balanceGrosze, overdraft: balanceGrosze < 0 };
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
