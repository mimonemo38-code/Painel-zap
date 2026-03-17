import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface WhitelistContact {
  id: number;
  phone: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export function useWhitelist() {
  return useQuery<WhitelistContact[]>({
    queryKey: ["/api/whitelist"],
    queryFn: async () => {
      const res = await fetch("/api/whitelist");
      if (!res.ok) throw new Error("Failed to fetch whitelist");
      return res.json();
    },
  });
}

export function useAddWhitelistContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { phone: string; name: string }) => {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whitelist"] });
    },
  });
}

export function useUpdateWhitelistContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await fetch(`/api/whitelist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to update contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whitelist"] });
    },
  });
}

export function useDeleteWhitelistContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/whitelist/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whitelist"] });
    },
  });
}
