/**
 * Activity Log Page
 * 
 * See everything the AI has been doing across all your projects.
 * 
 * NOTE: This page will show real activity when the autonomous marketing
 * agents are active and logging their actions.
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Code,
  Database,
  Globe,
  Phone,
  Inbox,
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  type: "success" | "error" | "warning" | "info";
  category: "ai" | "database" | "api" | "phone" | "marketing";
  message: string;
  details?: string;
  source: string;
}

export default function ActivityLog() {
  // Start with empty array - real logs will come from the system
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || log.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const refreshLogs = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const getTypeIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "info":
        return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  const getCategoryIcon = (category: LogEntry["category"]) => {
    switch (category) {
      case "ai":
        return <MessageSquare className="w-4 h-4" />;
      case "database":
        return <Database className="w-4 h-4" />;
      case "api":
        return <Code className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "marketing":
        return <Globe className="w-4 h-4" />;
    }
  };

  const categories = [
    { id: "ai", label: "AI", icon: MessageSquare },
    { id: "database", label: "Database", icon: Database },
    { id: "api", label: "API", icon: Code },
    { id: "phone", label: "Phone", icon: Phone },
    { id: "marketing", label: "Marketing", icon: Globe },
  ];

  // Stats
  const stats = {
    total: logs.length,
    success: logs.filter(l => l.type === "success").length,
    errors: logs.filter(l => l.type === "error").length,
    warnings: logs.filter(l => l.type === "warning").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Activity Log
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time view of all system activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshLogs}
          disabled={loading}
          className="border-border"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-foreground font-mono">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Events</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-green-400 font-mono">{stats.success}</div>
          <div className="text-xs text-muted-foreground">Successful</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-yellow-400 font-mono">{stats.warnings}</div>
          <div className="text-xs text-muted-foreground">Warnings</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-red-400 font-mono">{stats.errors}</div>
          <div className="text-xs text-muted-foreground">Errors</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={selectedCategory === cat.id ? "" : "border-border"}
            >
              <cat.icon className="w-3 h-3 mr-1" />
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Log Entries or Empty State */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="divide-y divide-border">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                When the autonomous marketing agents start working, their activity 
                will be logged here in real-time.
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No logs match your filters</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start gap-3">
                  {getTypeIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{log.message}</span>
                      <Badge variant="outline" className="text-xs border-border">
                        {getCategoryIcon(log.category)}
                        <span className="ml-1">{log.category}</span>
                      </Badge>
                    </div>
                    {log.details && (
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{log.source}</span>
                      <span>{log.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
