import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface WhatsappStatus {
  connected: boolean;
  status: string;
  number: string | null;
}

export interface QrResponse {
  qr: string;
}

export function useWhatsappStatus() {
  return useQuery<WhatsappStatus>({
    queryKey: ["/api/whatsapp/status"],
    queryFn: async () => {
      const res = await fetch("/api/whatsapp/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    refetchInterval: 3000, // Poll every 3 seconds
  });
}

export function useWhatsappQr() {
  return useQuery<QrResponse>({
    queryKey: ["/api/whatsapp/qr"],
    queryFn: async () => {
      const res = await fetch("/api/whatsapp/qr");
      if (!res.ok) throw new Error("QR not available");
      return res.json();
    },
    retry: false,
  });
}

export function useConnectWhatsapp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to connect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    },
  });
}

export function useDisconnectWhatsapp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/whatsapp/disconnect", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    },
  });
}
