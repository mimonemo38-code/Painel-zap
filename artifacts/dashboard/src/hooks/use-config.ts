import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SystemConfig {
  autoRespond: boolean;
  respondToGroups: boolean;
  maxDailyMessages: number;
  welcomeMessage: string;
}

export function useConfig() {
  return useQuery<SystemConfig>({
    queryKey: ["/api/config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json();
    },
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SystemConfig>) => {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
    },
  });
}
