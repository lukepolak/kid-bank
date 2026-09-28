import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api-client";

export interface Account {
  id: string;
  name: string;
  archived: boolean;
  balanceGrosze: number;
  overdraft: boolean;
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.accounts.$get();
      if (!res.ok) throw new Error("Nie udało się pobrać kont");
      return (await res.json()) as Account[];
    },
  });
}

export function useAddKid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await api.kids.$post({ json: { name } });
      if (!res.ok) throw new Error("Nie udało się dodać dziecka");
      return (await res.json()) as Account;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
}
