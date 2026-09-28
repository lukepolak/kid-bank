import { useState } from "react";
import { parseAmountInput } from "./amount";
import type { Entry } from "./hooks";

/** Grosze → input prefill ("149,50"); the sign lives in the save buttons. */
function formatForInput(amountGrosze: number): string {
  return (Math.abs(amountGrosze) / 100).toFixed(2).replace(".", ",");
}

/** Inline editor for a history entry (ADR 0001: mistakes are fixable). */
export function EditEntryForm({
  entry,
  onSubmit,
  onCancel,
}: {
  entry: Entry;
  onSubmit: (amountGrosze: number, description?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(formatForInput(entry.amountGrosze));
  const [description, setDescription] = useState(entry.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save(negative: boolean) {
    const grosze = parseAmountInput(amount);
    if (grosze === null) {
      setError("Nieprawidłowa kwota");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await onSubmit(
        negative ? -grosze : grosze,
        description.trim() || undefined,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <label htmlFor={`edit-amount-${entry.id}`}>Kwota</label>
      <input
        id={`edit-amount-${entry.id}`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
      />

      <label htmlFor={`edit-description-${entry.id}`}>Opis</label>
      <input
        id={`edit-description-${entry.id}`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
      />

      <div>
        <button type="button" disabled={pending} onClick={() => save(false)}>
          Zapisz +
        </button>
        <button type="button" disabled={pending} onClick={() => save(true)}>
          Zapisz −
        </button>
        <button type="button" disabled={pending} onClick={onCancel}>
          Anuluj
        </button>
      </div>

      {error && <p role="alert">{error}</p>}
    </form>
  );
}
