import { useState } from "react";
import { parseAmountInput } from "./amount";

interface EntryFormProps {
  /** Receives a signed integer amount in grosze and an optional description. */
  onSubmit: (amountGrosze: number, description?: string) => Promise<void>;
}

/**
 * Records a movement of money. The amount is typed the Polish way ("149,50");
 * the Dodaj/Zabierz actions apply the sign and submit (SPEC issue 04).
 */
export function EntryForm({ onSubmit }: EntryFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(remove: boolean) {
    const grosze = parseAmountInput(amount);
    if (grosze === null) {
      setError("Nieprawidłowa kwota");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await onSubmit(remove ? -grosze : grosze, description.trim() || undefined);
      setAmount("");
      setDescription("");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="amount">Kwota</label>
      <input
        id="amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        placeholder="149,50"
      />

      <label htmlFor="description">Opis</label>
      <input
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
        placeholder="np. Prezent urodzinowy"
      />

      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(false)}
        >
          Dodaj
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(true)}
        >
          Zabierz
        </button>
      </div>

      {error && <p role="alert">{error}</p>}
    </form>
  );
}
