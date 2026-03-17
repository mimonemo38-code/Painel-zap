import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useConfig, useUpdateConfig } from "@/hooks/use-config";
import { Settings2, Save, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { data: config, isLoading } = useConfig();
  const updateConfig = useUpdateConfig();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    autoRespond: true,
    respondToGroups: false,
    maxDailyMessages: 100,
    welcomeMessage: "",
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig.mutate(formData, {
      onSuccess: () => {
        toast({
          title: "Configuration Saved",
          description: "System parameters have been updated.",
          className: "bg-card border-primary text-primary-foreground font-mono",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">System Configuration</h1>
        <p className="text-muted-foreground">Adjust core parameters for the AI routing engine.</p>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardHeader className="border-b border-border/50 bg-secondary/10">
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              Core Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {isLoading ? (
              <div className="animate-pulse flex flex-col gap-6">
                <div className="h-10 bg-secondary/50 rounded w-full"></div>
                <div className="h-10 bg-secondary/50 rounded w-full"></div>
                <div className="h-32 bg-secondary/50 rounded w-full"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 font-mono">
                
                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/30">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Global Auto-Responder</h4>
                    <p className="text-sm text-muted-foreground mt-1">If halted, the bot will process incoming messages but will not transmit replies.</p>
                  </div>
                  <Switch 
                    checked={formData.autoRespond}
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, autoRespond: val }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/30">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Group Matrix Processing</h4>
                    <p className="text-sm text-muted-foreground mt-1">Allow processing queries originating from group chats.</p>
                  </div>
                  <Switch 
                    checked={formData.respondToGroups}
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, respondToGroups: val }))}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary" />
                    Max Daily Transmissions
                  </label>
                  <Input 
                    type="number" 
                    min={1}
                    max={10000}
                    value={formData.maxDailyMessages}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxDailyMessages: parseInt(e.target.value) || 100 }))}
                    className="max-w-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">Hard limit to prevent rate-limiting by the WhatsApp network.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary" />
                    Standard Rejection Payload
                  </label>
                  <Textarea 
                    value={formData.welcomeMessage}
                    onChange={(e) => setFormData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">This string is transmitted when an unknown command is received.</p>
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-end">
                  <Button type="submit" size="lg" disabled={updateConfig.isPending} className="font-sans font-bold">
                    <Save className="w-4 h-4 mr-2" />
                    {updateConfig.isPending ? "WRITING TO DB..." : "COMMIT CHANGES"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
