import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWhatsappStatus, useWhatsappQr, useConnectWhatsapp, useDisconnectWhatsapp } from "@/hooks/use-whatsapp";
import { Smartphone, RefreshCw, Unplug, ShieldCheck, AlertCircle } from "lucide-react";
import { formatPhone } from "@/lib/utils";

export default function WhatsappPage() {
  const { data: status, isLoading: statusLoading } = useWhatsappStatus();
  const { data: qrData } = useWhatsappQr();
  
  const connectMut = useConnectWhatsapp();
  const disconnectMut = useDisconnectWhatsapp();

  const isConnected = status?.connected ?? false;
  const isQrReady = status?.status === "qr_ready";

  const handleConnect = () => connectMut.mutate();
  const handleDisconnect = () => disconnectMut.mutate();

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">WhatsApp Protocol</h1>
          <p className="text-muted-foreground">Manage the Baileys connection to the WhatsApp network.</p>
        </div>
        <div className="flex gap-4">
          <Badge variant={isConnected ? "success" : isQrReady ? "warning" : "destructive"} className="text-sm px-4 py-1">
            {statusLoading ? "INITIALIZING..." : status?.status.toUpperCase() || "DISCONNECTED"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Terminal Output / Control Panel */}
        <Card className="flex flex-col h-[500px]">
          <CardHeader className="border-b border-border/50 bg-secondary/20">
            <CardTitle className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
              <TerminalIcon /> root@zapauto:~# ./manage-connection.sh
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-6 flex flex-col justify-between font-mono">
            <div className="space-y-4">
              <p className="text-primary font-bold">{">>> SESSION STATUS"}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-muted-foreground">State:</div>
                <div className={isConnected ? "text-emerald-400" : "text-amber-400"}>
                  [{status?.status.toUpperCase() || "UNKNOWN"}]
                </div>
                
                <div className="text-muted-foreground">Network JID:</div>
                <div className="text-foreground">
                  {status?.number ? formatPhone(status.number) : "<UNBOUND>"}
                </div>
                
                <div className="text-muted-foreground">Encryption:</div>
                <div className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> SECURE E2E
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-border/50 pt-6 mt-6">
              <p className="text-primary font-bold">{">>> EXECUTE COMMAND"}</p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={handleConnect} 
                  disabled={isConnected || connectMut.isPending || isQrReady}
                  className="font-mono w-full sm:w-auto"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${connectMut.isPending ? 'animate-spin' : ''}`} />
                  INIT_CONNECTION
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={handleDisconnect} 
                  disabled={!isConnected && !isQrReady && status?.status !== "reconnecting"}
                  className="font-mono w-full sm:w-auto"
                >
                  <Unplug className="w-4 h-4 mr-2" />
                  TERMINATE_SESSION
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Panel */}
        <Card className="h-[500px] flex flex-col items-center justify-center p-8 bg-black/40 border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
          
          {isConnected ? (
            <div className="text-center space-y-6 z-10">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse-glow">
                <Smartphone className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-emerald-400 mb-2">Uplink Established</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  ZapAuto is actively monitoring incoming transmissions from whitelisted vectors.
                </p>
              </div>
            </div>
          ) : isQrReady && qrData?.qr ? (
            <div className="text-center z-10">
              <h3 className="text-xl font-bold mb-6 text-amber-400 flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Awaiting Authentication
              </h3>
              <div className="bg-white p-4 rounded-xl shadow-2xl inline-block">
                <img 
                  src={`data:image/png;base64,${qrData.qr}`} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-6 max-w-xs mx-auto">
                Scan this matrix with your WhatsApp mobile application to bind the node.
              </p>
            </div>
          ) : (
            <div className="text-center z-10 opacity-50">
              <Smartphone className="w-20 h-20 mx-auto mb-6 text-muted-foreground" />
              <h3 className="text-xl font-bold text-muted-foreground mb-2">Node Offline</h3>
              <p className="text-sm max-w-xs mx-auto">
                Initialize connection sequence to generate authentication matrix.
              </p>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}

function TerminalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  );
}
