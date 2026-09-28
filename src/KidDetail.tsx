import { formatDateTime, formatGrosze } from "./format";
import { EntryForm } from "./EntryForm";
import { useAddEntry, useEntries, type Account } from "./hooks";

export function KidDetail({
  account,
  onBack,
}: {
  account: Account;
  onBack: () => void;
}) {
  const { data: entries, isPending } = useEntries(account.id);
  const addEntry = useAddEntry(account.id);

  return (
    <main>
      <button type="button" onClick={onBack}>
        ← Konta
      </button>

      <h1>{account.name}</h1>
      <p>
        <strong>{formatGrosze(account.balanceGrosze)}</strong>
      </p>

      <EntryForm
        onSubmit={async (amountGrosze, description) => {
          await addEntry.mutateAsync({ amountGrosze, description });
        }}
      />

      {addEntry.isError && <p role="alert">Nie udało się dodać wpisu</p>}

      <h2>Historia</h2>
      {isPending && <p>Ładowanie…</p>}
      <ul>
        {(entries ?? []).map((entry) => (
          <li key={entry.id}>
            <strong>{formatGrosze(entry.amountGrosze)}</strong>{" "}
            {entry.description && <span>{entry.description} </span>}
            <small>
              {formatDateTime(entry.createdAt)} · {entry.createdBy}
            </small>
          </li>
        ))}
      </ul>
      {(entries?.length ?? 0) === 0 && !isPending && <p>Brak wpisów.</p>}
    </main>
  );
}
