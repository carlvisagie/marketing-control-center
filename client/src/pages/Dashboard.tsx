/**
 * Marketing Control Center Dashboard
 * Cyberpunk Command Center style - matching JetFighter Aviation Dashboard
 * Controls the distributed AI marketing agent for Just Talk
 * 
 * NOTE: All metrics start at 0 - real data will come from the autonomous agents
 */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Rocket,
  Pause,
  Play,
  RefreshCw,
  Zap,
  Target,
  TrendingUp,
  Phone,
  DollarSign,
  Users,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Facebook,
  Instagram,
  Linkedin,
  Send,
  Activity,
  Settings,
  BarChart3,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Inbox,
} from "lucide-react";

// Real stats - start at 0, will be populated by actual data
const initialStats = {
  postsToday: 0,
  postsTotal: 0,
  engagementRate: 0,
  reach: 0,
  clicks: 0,
  conversions: 0,
  revenue: 0,
  subscribers: 0,
};

// Platform connection status - shows what's connected
const platformStatus = {
  facebook: { connected: false, posts: 0, engagement: 0 },
  instagram: { connected: false, posts: 0, engagement: 0 },
  linkedin: { connected: false, posts: 0, engagement: 0 },
  tiktok: { connected: false, posts: 0, engagement: 0 },
};

// Initial log showing system startup
const initialLogs = [
  { time: new Date().toLocaleTimeString("en-US", { hour12: false }), type: "info", message: "📡 Marketing Control Center ready" },
];

// Content queue - starts empty
interface ContentItem {
  id: number;
  platform: string;
  type: string;
  preview: string;
  scheduledFor: string;
  status: string;
}

export default function Dashboard() {
  const [isAttackRunning, setIsAttackRunning] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [logs, setLogs] = useState(initialLogs);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<number | null>(null);

  const handleStartAttack = () => {
    setIsAttackRunning(true);
    toast.success("🚀 24/7 Marketing Attack LAUNCHED!", {
      description: "The agent is now autonomously posting to all platforms.",
    });
    setLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        type: "success",
        message: "🔥 24/7 CONTINUOUS ATTACK STARTED!",
      },
    ]);
  };

  const handlePauseAttack = () => {
    setIsAttackRunning(false);
    toast.info("⏸️ Attack Paused", {
      description: "Marketing agent paused. Resume anytime.",
    });
    setLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        type: "info",
        message: "⏸️ Attack paused by operator",
      },
    ]);
  };

  const handleApproveContent = (id: number) => {
    setContent((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c))
    );
    toast.success("Content approved and scheduled!");
  };

  const handleRejectContent = (id: number) => {
    setContent((prev) => prev.filter((c) => c.id !== id));
    toast.info("Content rejected and removed from queue.");
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="w-4 h-4" />;
      case "instagram":
        return <Instagram className="w-4 h-4" />;
      case "linkedin":
        return <Linkedin className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Rocket className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold font-['Space_Grotesk'] tracking-tight">
                    <span className="text-primary">Just Talk</span>{" "}
                    <span className="text-foreground">Marketing Control Center</span>
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Distributed AI Agent System v3.0
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isAttackRunning
                      ? "bg-green-500 status-pulse"
                      : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm font-medium">
                  {isAttackRunning ? "ATTACK ACTIVE" : "STANDBY"}
                </span>
              </div>

              {/* Main Control Buttons */}
              {isAttackRunning ? (
                <Button
                  onClick={handlePauseAttack}
                  variant="outline"
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Attack
                </Button>
              ) : (
                <Button
                  onClick={handleStartAttack}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Launch 24/7 Attack
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Stats & Platforms */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* System Status */}
            <Card className="cyber-card p-4">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4" />
                System Status
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      isAttackRunning
                        ? "border-green-500/50 text-green-400"
                        : "border-yellow-500/50 text-yellow-400"
                    }
                  >
                    {isAttackRunning ? "✅ Operational" : "⏸️ Standby"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Mode:</span>
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    🔒 Production
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Platforms:</span>
                  <span className="text-sm text-muted-foreground">0 Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Time Saved:</span>
                  <span className="text-sm text-muted-foreground">--</span>
                </div>
              </div>
            </Card>

            {/* Revenue Tracking */}
            <Card className="cyber-card p-4">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4" />
                Revenue Tracking
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current Revenue:</span>
                    <span className="text-muted-foreground font-mono">$0</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="text-foreground font-mono">$1,000</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress:</span>
                    <span className="text-muted-foreground font-mono">0%</span>
                  </div>
                  <div className="cyber-progress">
                    <div
                      className="cyber-progress-bar"
                      style={{ width: `0%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subscribers:</span>
                  <span className="text-muted-foreground">0 @ $29/mo</span>
                </div>
              </div>
            </Card>

            {/* Platform Status */}
            <Card className="cyber-card p-4">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <Target className="w-4 h-4" />
                Platform Status
              </h2>
              <div className="space-y-3">
                {Object.entries(platformStatus).map(([platform, status]) => (
                  <div
                    key={platform}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(platform)}
                      <span className="text-sm capitalize">{platform}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-slate-500" />
                      <span className="text-xs text-muted-foreground">
                        Not connected
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="cyber-card p-4">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/50 text-primary hover:bg-primary/10"
                  onClick={() => toast.info("Connect platforms first to generate content")}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Generate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-accent/50 text-accent hover:bg-accent/10"
                  onClick={() => toast.info("Connect platforms first to deploy")}
                >
                  <Send className="w-3 h-3 mr-1" />
                  Deploy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                  onClick={() => toast.info("No data yet - start the attack to generate reports")}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                  onClick={() => toast.info("Opening settings...")}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Config
                </Button>
              </div>
            </Card>
          </div>

          {/* Center Column - Activity Log & Content Queue */}
          <div className="col-span-12 lg:col-span-6 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="cyber-card p-4 text-center">
                <div className="text-2xl font-bold text-muted-foreground font-mono">
                  {stats.postsToday}
                </div>
                <div className="text-xs text-muted-foreground">Posts Today</div>
              </Card>
              <Card className="cyber-card p-4 text-center">
                <div className="text-2xl font-bold text-muted-foreground font-mono">
                  {stats.reach.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Reach</div>
              </Card>
              <Card className="cyber-card p-4 text-center">
                <div className="text-2xl font-bold text-muted-foreground font-mono">
                  {stats.clicks}
                </div>
                <div className="text-xs text-muted-foreground">Clicks</div>
              </Card>
              <Card className="cyber-card p-4 text-center">
                <div className="text-2xl font-bold text-muted-foreground font-mono">
                  {stats.conversions}
                </div>
                <div className="text-xs text-muted-foreground">Conversions</div>
              </Card>
            </div>

            {/* Activity Log */}
            <Card className="cyber-card p-4">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" />
                Activity Log
              </h2>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 font-mono text-xs">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`log-entry flex items-start gap-2 p-2 rounded ${
                        log.type === "success"
                          ? "bg-green-500/10 text-green-400"
                          : log.type === "error"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <span className="text-muted-foreground">[{log.time}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Content Queue */}
            <Card className="cyber-card p-4">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4" />
                Content Queue
              </h2>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/30">
                  <TabsTrigger value="pending">Pending ({content.filter(c => c.status === "pending").length})</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="posted">Posted</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {content.filter((c) => c.status === "pending").length === 0 && (
                        <div className="text-center py-12">
                          <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                          <p className="text-muted-foreground font-medium">No Content in Queue</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Generated content will appear here for your approval
                          </p>
                        </div>
                      )}
                      {content
                        .filter((c) => c.status === "pending")
                        .map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-lg bg-muted/20 border border-border hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getPlatformIcon(item.platform)}
                                <span className="text-sm font-medium capitalize">
                                  {item.platform}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {item.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {item.scheduledFor}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-line mb-3">
                              {item.preview}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApproveContent(item.id)}
                              >
                                <ThumbsUp className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                onClick={() => handleRejectContent(item.id)}
                              >
                                <ThumbsDown className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toast.info("Edit mode coming soon!")}
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="approved" className="mt-4">
                  <div className="text-center py-12">
                    <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                    <p className="text-muted-foreground">No approved content yet</p>
                  </div>
                </TabsContent>
                <TabsContent value="posted" className="mt-4">
                  <div className="text-center py-12">
                    <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                    <p className="text-muted-foreground">No posted content yet</p>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Performance */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Performance Metrics */}
            <Card className="cyber-card p-4">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4" />
                Performance
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Engagement Rate</span>
                    <span className="text-muted-foreground font-mono">0%</span>
                  </div>
                  <div className="cyber-progress">
                    <div className="cyber-progress-bar" style={{ width: "0%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Click-through Rate</span>
                    <span className="text-muted-foreground font-mono">0%</span>
                  </div>
                  <div className="cyber-progress">
                    <div className="cyber-progress-bar" style={{ width: "0%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Conversion Rate</span>
                    <span className="text-muted-foreground font-mono">0%</span>
                  </div>
                  <div className="cyber-progress">
                    <div className="cyber-progress-bar" style={{ width: "0%" }} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Today's Summary */}
            <Card className="cyber-card p-4">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4" />
                Today's Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Posts Created:</span>
                  <span className="text-sm font-mono text-muted-foreground">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Posts Approved:</span>
                  <span className="text-sm font-mono text-muted-foreground">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Posts Published:</span>
                  <span className="text-sm font-mono text-muted-foreground">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Engagement:</span>
                  <span className="text-sm font-mono text-muted-foreground">0</span>
                </div>
              </div>
            </Card>

            {/* Getting Started */}
            <Card className="cyber-card p-4 border-primary/30">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <Rocket className="w-4 h-4" />
                Getting Started
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>To start seeing real data:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Connect your social platforms</li>
                  <li>Configure your content strategy</li>
                  <li>Launch the 24/7 Attack</li>
                </ol>
                <p className="text-xs mt-4">
                  Use the TikTok page to generate content and send to your phone for manual posting.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
