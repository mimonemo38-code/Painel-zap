import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWhatsappStatus } from "@/hooks/use-whatsapp";
import { useWhitelist } from "@/hooks/use-whitelist";
import { useHistory } from "@/hooks/use-history";
import { useConfig, useUpdateConfig } from "@/hooks/use-config";
import { Activity, MessageSquare, Users, Power, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: status } = useWhatsappStatus();
  const { data: whitelist } = useWhitelist();
  const { data: history } = useHistory({ limit: 5 });
  const { data: config } = useConfig();
  const updateConfig = useUpdateConfig();

  const isConnected = status?.connected ?? false;
  const activeContacts = whitelist?.filter(c => c.active).length ?? 0;
  
  const today = new Date().toISOString().split('T')[0];
  const messagesToday = history?.filter(h => h.createdAt.startsWith(today)).length ?? 0;

  const toggleBot = () => {
    if (config) {
      updateConfig.mutate({ autoRespond: !config.autoRespond });
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Command Center</h1>
        <p className="text-muted-foreground">Overview of your ZapAuto MRP Bot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Connection Status Card */}
        <Card className="relative overflow-hidden group">
          <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isConnected ? 'from-emerald-500' : 'from-destructive'}`} />
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive-foreground'}`}>
                {isConnected ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <Badge variant={isConnected ? "success" : "destructive"} className="uppercase tracking-wider">
                {status?.status || "Unknown"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">WhatsApp Status</p>
              <h3 className="text-2xl font-bold">{isConnected ? "Connected" : "Disconnected"}</h3>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {status?.number ? `+${status.number}` : "No number linked"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Whitelist Stats */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Active Whitelist</p>
              <h3 className="text-2xl font-bold">{activeContacts} <span className="text-sm font-normal text-muted-foreground">/ {whitelist?.length || 0}</span></h3>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Queries Today</p>
              <h3 className="text-2xl font-bold">{messagesToday}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Bot Toggle */}
        <Card className="relative overflow-hidden group">
          <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${config?.autoRespond ? 'from-primary' : 'from-muted'}`} />
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg cursor-pointer transition-colors ${config?.autoRespond ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`} onClick={toggleBot}>
                <Power className="w-6 h-6" />
              </div>
              <Badge variant={config?.autoRespond ? "default" : "outline"}>
                {config?.autoRespond ? "ACTIVE" : "PAUSED"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Auto-Responder</p>
              <h3 className="text-2xl font-bold">{config?.autoRespond ? "Running" : "Halted"}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity Log
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-y border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Query Type</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {history?.map((entry) => (
                <tr key={entry.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(entry.createdAt), "MMM d, HH:mm:ss")}
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{entry.phone}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={
                      entry.type === 'urgente' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                      entry.type === 'op' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                      'text-blue-400 border-blue-500/30 bg-blue-500/10'
                    }>
                      {entry.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {entry.found ? (
                      <Badge variant="success">Found</Badge>
                    ) : (
                      <Badge variant="destructive">Miss</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {(!history || history.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No recent activity detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
}
