import { useEffect, useState } from "react";
import { api } from "./api-client";

export function App() {
  const [status, setStatus] = useState<string>("Łączenie…");

  useEffect(() => {
    api.ping
      .$get()
      .then((res) => res.json())
      .then(
        (ping) =>
          setStatus(
            `${ping.status} · baza: ${ping.database} · ${ping.parent}`,
          ),
      )
      .catch(() => setStatus("Brak połączenia"));
  }, []);

  return (
    <main>
      <h1>Skarbonka</h1>
      <p>{status}</p>
    </main>
  );
}
