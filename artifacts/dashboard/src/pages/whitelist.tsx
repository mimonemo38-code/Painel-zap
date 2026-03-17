import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useWhitelist, useAddWhitelistContact, useDeleteWhitelistContact, useUpdateWhitelistContact } from "@/hooks/use-whitelist";
import { Trash2, UserPlus, Search, Shield } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { format } from "date-fns";

export default function WhitelistPage() {
  const { data: whitelist, isLoading } = useWhitelist();
  const addContact = useAddWhitelistContact();
  const deleteContact = useDeleteWhitelistContact();
  const updateContact = useUpdateWhitelistContact();

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    addContact.mutate({ phone, name }, {
      onSuccess: () => {
        setPhone("");
        setName("");
      }
    });
  };

  const filtered = whitelist?.filter(c => 
    c.phone.includes(search) || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Access Control</h1>
        <p className="text-muted-foreground">Manage allowed vectors (phone numbers) that can interface with ZapAuto.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Add Form */}
        <Card className="xl:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Register Identity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Mobile Identifier (Phone)</label>
                <Input 
                  placeholder="e.g. 5511999999999" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Alias (Optional)</label>
                <Input 
                  placeholder="e.g. John Doe / Factory A" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={addContact.isPending}>
                {addContact.isPending ? "REGISTERING..." : "GRANT ACCESS"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Authorized Database
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search database..." 
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-y border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Identity</th>
                  <th className="px-6 py-4 font-medium">Added On</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Loading database...</td></tr>
                ) : filtered?.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No identities found in database.</td></tr>
                ) : (
                  filtered?.map((contact) => (
                    <tr key={contact.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-mono text-foreground">{formatPhone(contact.phone)}</div>
                        <div className="text-xs text-muted-foreground mt-1">{contact.name || "UNNAMED"}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(contact.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Switch 
                            checked={contact.active} 
                            onCheckedChange={(val) => updateContact.mutate({ id: contact.id, active: val })}
                          />
                          <Badge variant={contact.active ? "success" : "outline"} className="w-20 justify-center">
                            {contact.active ? "ACTIVE" : "HALTED"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if(confirm(`Revoke access for ${contact.phone}?`)) {
                              deleteContact.mutate(contact.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
