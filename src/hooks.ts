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

export interface Entry {
  id: string;
  amountGrosze: number;
  description: string | null;
  createdBy: string;
  createdAt: string;
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

export function useUpdateKid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      archived?: boolean;
    }) => {
      const res = await api.kids[":id"].$patch({
        param: { id: input.id },
        json: { name: input.name, archived: input.archived },
      });
      if (!res.ok) throw new Error("Nie udało się zapisać dziecka");
      return (await res.json()) as Account;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useEntries(kidId: string) {
  return useQuery({
    queryKey: ["entries", kidId],
    queryFn: async () => {
      const res = await api.accounts[":kidId"].entries.$get({
        param: { kidId },
      });
      if (!res.ok) throw new Error("Nie udało się pobrać historii");
      return (await res.json()) as Entry[];
    },
  });
}

export function useEditEntry(kidId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      amountGrosze: number;
      description?: string;
    }) => {
      const res = await api.entries[":id"].$patch({
        param: { id: input.id },
        json: { amountGrosze: input.amountGrosze, description: input.description },
      });
      if (!res.ok) throw new Error("Nie udało się zapisać wpisu");
      return (await res.json()) as {
        entry: Entry;
        balanceGrosze: number;
        overdraft: boolean;
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["entries", kidId] });
    },
  });
}

export function useDeleteEntry(kidId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.entries[":id"].$delete({ param: { id } });
      if (!res.ok) throw new Error("Nie udało się usunąć wpisu");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["entries", kidId] });
    },
  });
}

export function useAddEntry(kidId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      amountGrosze: number;
      description?: string;
    }) => {
      const res = await api.accounts[":kidId"].entries.$post({
        param: { kidId },
        json: input,
      });
      if (!res.ok) throw new Error("Nie udało się dodać wpisu");
      return (await res.json()) as {
        entry: Entry;
        balanceGrosze: number;
        overdraft: boolean;
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["entries", kidId] });
    },
  });
}
