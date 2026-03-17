import { useQuery } from "@tanstack/react-query";

export interface HistoryEntry {
  id: number;
  phone: string;
  type: string;
  query: string;
  found: boolean;
  response: string;
  createdAt: string;
}

export function useHistory(params?: { phone?: string; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.phone) searchParams.set("phone", params.phone);
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const queryString = searchParams.toString();
  const url = `/api/history${queryString ? `?${queryString}` : ""}`;

  return useQuery<HistoryEntry[]>({
    queryKey: [url],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
  });
}
