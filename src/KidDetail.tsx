import { useState } from "react";
import { EditEntryForm } from "./EditEntryForm";
import { formatDateTime, formatGrosze } from "./format";
import { EntryForm } from "./EntryForm";
import {
  useAddEntry,
  useDeleteEntry,
  useEditEntry,
  useEntries,
  type Account,
  type Entry,
} from "./hooks";

export function KidDetail({
  account,
  onBack,
}: {
  account: Account;
  onBack: () => void;
}) {
  const { data: entries, isPending } = useEntries(account.id);
  const addEntry = useAddEntry(account.id);
  const editEntry = useEditEntry(account.id);
  const deleteEntry = useDeleteEntry(account.id);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <main>
      <button type="button" onClick={onBack}>
        ← Konta
      </button>

      <h1>{account.name}</h1>
      <p>
        <strong className={account.overdraft ? "overdraft" : undefined}>
          {formatGrosze(account.balanceGrosze)}
        </strong>
      </p>

      {account.overdraft && (
        <p role="status" className="warning">
          Konto na minusie — dołóż {formatGrosze(-account.balanceGrosze)}
        </p>
      )}

      <EntryForm
        onSubmit={async (amountGrosze, description) => {
          await addEntry.mutateAsync({ amountGrosze, description });
        }}
      />

      {addEntry.isError && <p role="alert">Nie udało się dodać wpisu</p>}

      <h2>Historia</h2>
      {isPending && <p>Ładowanie…</p>}
      <ul>
        {(entries ?? []).map((entry) =>
          editingId === entry.id ? (
            <li key={entry.id}>
              <EditEntryForm
                entry={entry}
                onSubmit={async (amountGrosze, description) => {
                  await editEntry.mutateAsync({
                    id: entry.id,
                    amountGrosze,
                    description,
                  });
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <EntryRow
              key={entry.id}
              entry={entry}
              onEdit={() => setEditingId(entry.id)}
              onDelete={() => {
                if (window.confirm("Usunąć wpis?")) {
                  deleteEntry.mutate(entry.id);
                }
              }}
            />
          ),
        )}
      </ul>
      {(entries?.length ?? 0) === 0 && !isPending && <p>Brak wpisów.</p>}
    </main>
  );
}

function EntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <strong>{formatGrosze(entry.amountGrosze)}</strong>{" "}
      {entry.description && <span>{entry.description} </span>}
      <small>
        {formatDateTime(entry.createdAt)} · {entry.createdBy}
      </small>
      <div>
        <button type="button" onClick={onEdit}>
          Edytuj
        </button>{" "}
        <button type="button" onClick={onDelete}>
          Usuń
        </button>
      </div>
    </>
  );
}
