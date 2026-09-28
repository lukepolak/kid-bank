import { useState } from "react";
import { formatGrosze } from "./format";
import { KidDetail } from "./KidDetail";
import { useAccounts, useAddKid, useUpdateKid } from "./hooks";

export function App() {
  const { data: accounts, isPending, error } = useAccounts();
  const addKid = useAddKid();
  const updateKid = useUpdateKid();
  const [name, setName] = useState("");
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);

  const selected = accounts?.find((account) => account.id === selectedKidId);
  if (selected) {
    return <KidDetail account={selected} onBack={() => setSelectedKidId(null)} />;
  }

  const active = (accounts ?? []).filter((account) => !account.archived);
  const archived = (accounts ?? []).filter((account) => account.archived);

  return (
    <main>
      <h1>Skarbonka</h1>

      {isPending && <p>Ładowanie…</p>}
      {error && <p role="alert">Brak połączenia</p>}

      <ul>
        {active.map((account) => (
          <li key={account.id}>
            <button type="button" onClick={() => setSelectedKidId(account.id)}>
              {account.name} —{" "}
              <span className={account.overdraft ? "overdraft" : undefined}>
                {formatGrosze(account.balanceGrosze)}
              </span>
              {account.overdraft && " ⚠"}
            </button>
          </li>
        ))}
      </ul>

      {active.length === 0 && !isPending && !error && (
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

      {archived.length > 0 && (
        <section>
          <h2>Zarchiwizowane</h2>
          <ul>
            {archived.map((account) => (
              <li key={account.id}>
                {account.name}{" "}
                <button
                  type="button"
                  disabled={updateKid.isPending}
                  onClick={() =>
                    updateKid.mutate({ id: account.id, archived: false })
                  }
                >
                  Przywróć
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
