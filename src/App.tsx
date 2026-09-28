import { useState } from "react";
import { formatGrosze } from "./format";
import { KidDetail } from "./KidDetail";
import { useAccounts, useAddKid } from "./hooks";

export function App() {
  const { data: accounts, isPending, error } = useAccounts();
  const addKid = useAddKid();
  const [name, setName] = useState("");
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);

  const selected = accounts?.find((account) => account.id === selectedKidId);
  if (selected) {
    return <KidDetail account={selected} onBack={() => setSelectedKidId(null)} />;
  }

  return (
    <main>
      <h1>Skarbonka</h1>

      {isPending && <p>Ładowanie…</p>}
      {error && <p role="alert">Brak połączenia</p>}

      <ul>
        {(accounts ?? []).map((account) => (
          <li key={account.id}>
            <button type="button" onClick={() => setSelectedKidId(account.id)}>
              {account.name} — {formatGrosze(account.balanceGrosze)}
            </button>
          </li>
        ))}
      </ul>

      {(accounts?.length ?? 0) === 0 && !isPending && !error && (
        <p>Dodaj pierwsze dziecko, aby zacząć.</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addKid.mutate(name.trim(), { onSuccess: () => setName("") });
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Imię dziecka"
          maxLength={50}
        />
        <button type="submit" disabled={addKid.isPending}>
          Dodaj dziecko
        </button>
      </form>
    </main>
  );
}
