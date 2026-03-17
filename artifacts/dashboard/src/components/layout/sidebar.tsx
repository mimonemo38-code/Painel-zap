import { Link, useLocation } from "wouter";
import { 
  TerminalSquare, 
  MessageSquare, 
  Users, 
  History, 
  Settings,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWhatsappStatus } from "@/hooks/use-whatsapp";

const navItems = [
  { href: "/", label: "Dashboard", icon: TerminalSquare },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { href: "/whitelist", label: "Whitelist", icon: Users },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: status } = useWhatsappStatus();
  
  const isConnected = status?.connected ?? false;

  return (
    <aside className="w-64 flex flex-col h-screen border-r border-border bg-card/50 backdrop-blur-md relative z-10">
      <div className="p-6 flex items-center gap-3 border-b border-border/50">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <TerminalSquare className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wider bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">ZAPAUTO</h1>
          <p className="text-xs text-primary font-medium flex items-center gap-1.5">
            <span className={cn("w-1.5 h-1.5 rounded-full block", isConnected ? "bg-emerald-500 animate-pulse-glow" : "bg-destructive")} />
            {isConnected ? "ONLINE" : "OFFLINE"}
          </p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-transparent border border-transparent"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              )}
              <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="bg-secondary/50 rounded-lg p-4 border border-border flex items-center gap-3">
          <Activity className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">System Status</p>
            <p className="text-sm font-bold text-foreground">All Systems Nominal</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
