import { useState } from "react";
import { EditEntryForm } from "./EditEntryForm";
import { formatDateTime, formatGrosze } from "./format";
import { EntryForm } from "./EntryForm";
import {
  useAddEntry,
  useDeleteEntry,
  useEditEntry,
  useEntries,
  useUpdateKid,
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
  const { data: entries, isPending, error } = useEntries(account.id);
  const addEntry = useAddEntry(account.id);
  const editEntry = useEditEntry(account.id);
  const deleteEntry = useDeleteEntry(account.id);
  const updateKid = useUpdateKid();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(account.name);

  return (
    <main>
      <button type="button" onClick={onBack}>
        ← Konta
      </button>

      {renaming ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            updateKid.mutate(
              { id: account.id, name: newName.trim() },
              { onSuccess: () => setRenaming(false) },
            );
          }}
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={50}
          />
          <button type="submit" disabled={updateKid.isPending}>
            Zapisz
          </button>{" "}
          <button type="button" onClick={() => setRenaming(false)}>
            Anuluj
          </button>
        </form>
      ) : (
        <h1>
          {account.name}{" "}
          <button type="button" onClick={() => setRenaming(true)}>
            Zmień imię
          </button>
        </h1>
      )}

      <p>
        <button
          type="button"
          disabled={updateKid.isPending}
          onClick={() => {
            if (window.confirm(`Zarchiwizować ${account.name}?`)) {
              updateKid.mutate(
                { id: account.id, archived: true },
                { onSuccess: onBack },
              );
            }
          }}
        >
          Zarchiwizuj
        </button>
      </p>
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
      {error && <p role="alert">Brak połączenia</p>}
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
