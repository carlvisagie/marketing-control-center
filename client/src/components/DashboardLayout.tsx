import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Terminal, 
  CheckSquare, 
  Activity, 
  Settings,
  Menu,
  X,
  Bell,
  Flag,
  BarChart3,
  Brain,
  Video,
  Target,
  FileText,
  Calendar,
  FlaskConical,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/accounts", label: "Social Accounts", icon: Users },
  { path: "/campaigns", label: "Campaign Tracker", icon: Target },
  { path: "/ad-copy", label: "Ad Copy Generator", icon: FileText },
  { path: "/calendar", label: "Content Calendar", icon: Calendar },
  { path: "/ab-tests", label: "A/B Tests", icon: FlaskConical },
  { path: "/live", label: "Live Metrics", icon: BarChart3 },
  { path: "/ai", label: "AI Insights", icon: Brain },
  { path: "/command", label: "Command Center", icon: Terminal },
  { path: "/approvals", label: "Approvals", icon: CheckSquare },
  { path: "/activity", label: "Activity Log", icon: Activity },
  { path: "/flags", label: "Feature Flags", icon: Flag },
  { path: "/tiktok", label: "TikTok", icon: Video },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="font-semibold text-lg">Control Center</span>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
            2
          </span>
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-40 transition-transform duration-200",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Terminal className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm">Just Talk</h1>
              <p className="text-xs text-slate-400">Control Center</p>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300">System Online</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>

                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
              CV
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Carl Visagie</p>
              <p className="text-xs text-slate-400 truncate">Owner</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
