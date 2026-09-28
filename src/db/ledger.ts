import { asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { kids } from "./schema";

/**
 * The Ledger — Skarbonka's deep money module (SPEC issue 03+).
 *
 * Everything that touches SQL lives behind this interface: the Drizzle schema,
 * all queries, and balance derivation. Routes (and everything else) speak in
 * domain terms only: kids, accounts, balances, entries.
 *
 * Canonical vocabulary: CONTEXT.md (Account, Entry, Balance, Overdraft).
 */

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
      const rows = await db.select().from(kids).orderBy(asc(kids.name));
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        archived: row.archived,
        // Entries arrive with the next slice (issue 04); until then every
        // account is empty and every balance derives to zero.
        balanceGrosze: 0,
        overdraft: false,
      }));
    },
  };
}

export type Ledger = ReturnType<typeof createLedger>;
