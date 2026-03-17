import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHistory } from "@/hooks/use-history";
import { Database, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { formatPhone } from "@/lib/utils";

export default function HistoryPage() {
  const [phoneSearch, setPhoneSearch] = useState("");
  // Only search when user types explicitly, but we debounce or just pass to hook
  // For simplicity, we just filter client side since limit is 50, but let's use the hook param if needed.
  // Passing empty string fetches all (up to limit)
  const { data: history, isLoading } = useHistory({ limit: 100, phone: phoneSearch || undefined });

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Query Logs</h1>
        <p className="text-muted-foreground">Historical ledger of all incoming transmissions and bot responses.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/10">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Transaction Ledger
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Filter by exact phone..." 
                className="pl-9 bg-background"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="h-10 px-4 rounded-md hidden sm:flex items-center gap-2 border-border/60">
              <Filter className="w-3 h-3" /> Last 100
            </Badge>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-y border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Vector ID</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium w-1/4">Query Payload</th>
                <th className="px-6 py-4 font-medium">Result</th>
                <th className="px-6 py-4 font-medium w-1/4">Response Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-mono text-xs">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Decrypting logs...</td></tr>
              ) : !history || history.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No logs found.</td></tr>
              ) : (
                history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(entry.createdAt), "yyyy-MM-dd")} <br/>
                      <span className="text-foreground">{format(new Date(entry.createdAt), "HH:mm:ss")}</span>
                    </td>
                    <td className="px-6 py-4 text-primary/80">{formatPhone(entry.phone)}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={
                        entry.type === 'urgente' ? 'text-red-400 border-red-500/30' :
                        entry.type === 'op' ? 'text-amber-400 border-amber-500/30' :
                        'text-blue-400 border-blue-500/30'
                      }>
                        {entry.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 truncate max-w-[200px]" title={entry.query}>
                      "{entry.query}"
                    </td>
                    <td className="px-6 py-4">
                      {entry.found ? (
                        <Badge variant="success" className="bg-transparent border border-emerald-500/50">HIT</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-transparent border border-red-500/50">MISS</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 truncate max-w-[200px] text-muted-foreground" title={entry.response}>
                      {entry.response}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
}
