# Kid Bank

A family ledger that tracks each kid's pocket money and savings. Parents record every movement of a kid's money with a short description. Shown to users as **Skarbonka**.

## Language

**Kid**:
A child whose money is tracked in the app. Exists as a named record only — a kid is not a user of the app.
_Avoid_: Child, account holder

**Parent**:
An adult with full access to every kid's account; the only kind of user.
_Avoid_: User, admin, adult

## The Ledger

**Account**:
The record of all money belonging to one Kid. One per kid; an ordered list of Entries.
_Avoid_: Wallet, jar, pot

**Entry**:
A single movement of money into or out of an Account: an amount, a direction, a short description, and a timestamp. The source of truth.
_Avoid_: Operation, transaction

**Balance**:
The sum of all Entries in an Account at a given moment. Always derived from the Entries; never stored or hand-edited.
_Avoid_: Funds, total

**Overdraft**:
A negative Balance. Allowed by design — kids can spend more than they have when a Parent fronts the difference — and warned about softly in the UI.
_Avoid_: Debt, loan
