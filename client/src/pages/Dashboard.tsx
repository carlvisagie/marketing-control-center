/**
 * Marketing Control Center Dashboard
 * Cyberpunk Command Center style - matching JetFighter Aviation Dashboard
 * Controls the distributed AI marketing agent for Just Talk
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
} from "lucide-react";

// Mock data for demonstration - in production this would come from the agent API
const initialStats = {
  postsToday: 12,
  postsTotal: 847,
  engagementRate: 4.7,
  reach: 15420,
  clicks: 342,
  conversions: 8,
  revenue: 232,
  subscribers: 8,
};

const platformStatus = {
  facebook: { connected: true, posts: 4, engagement: 5.2 },
  instagram: { connected: true, posts: 4, engagement: 6.1 },
  linkedin: { connected: true, posts: 2, engagement: 3.8 },
  tiktok: { connected: false, posts: 0, engagement: 0 },
};

const initialLogs = [
  { time: "19:53:38", type: "success", message: "🚀 Marketing Control Center initialized!" },
  { time: "19:53:39", type: "info", message: "📡 Connecting to distributed agent system..." },
  { time: "19:53:40", type: "success", message: "✅ Agent connection established" },
  { time: "19:53:41", type: "info", message: "📊 Loading campaign metrics..." },
  { time: "19:53:42", type: "success", message: "✅ All systems operational" },
];

const pendingContent = [
  {
    id: 1,
    platform: "facebook",
    type: "emotional",
    preview: "Ever feel like you're talking, but nobody is really listening? 💭\n\nYou're not alone. Sometimes we all need someone who truly hears us...",
    scheduledFor: "20:00",
    status: "pending",
  },
  {
    id: 2,
    platform: "instagram",
    type: "value",
    preview: "3 AM thoughts hitting different? 🌙\n\nHere's the truth: You don't have to wait until morning to talk to someone...",
    scheduledFor: "21:00",
    status: "pending",
  },
  {
    id: 3,
    platform: "linkedin",
    type: "promotional",
    preview: "Healthcare workers, caregivers, night shift heroes - we see you. 💜\n\nJust Talk is here 24/7 because your schedule isn't 9-5...",
    scheduledFor: "22:00",
    status: "pending",
  },
];

export default function Dashboard() {
  const [isAttackRunning, setIsAttackRunning] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [logs, setLogs] = useState(initialLogs);
  const [content, setContent] = useState(pendingContent);
  const [selectedContent, setSelectedContent] = useState<number | null>(null);

  // Simulate real-time updates
  useEffect(() => {
    if (isAttackRunning) {
      const interval = setInterval(() => {
        // Add new log entry
        const newLog = {
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          type: Math.random() > 0.3 ? "success" : "info",
          message: getRandomLogMessage(),
        };
        setLogs((prev) => [...prev.slice(-19), newLog]);

        // Update stats occasionally
        if (Math.random() > 0.7) {
          setStats((prev) => ({
            ...prev,
            postsToday: prev.postsToday + 1,
            postsTotal: prev.postsTotal + 1,
            reach: prev.reach + Math.floor(Math.random() * 100),
            clicks: prev.clicks + Math.floor(Math.random() * 10),
          }));
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAttackRunning]);

  const getRandomLogMessage = () => {
    const messages = [
      "📝 Generated new emotional post for Facebook",
      "✅ Posted to Instagram successfully",
      "📊 Engagement spike detected on LinkedIn",
      "🎯 New click from Facebook ad",
      "💬 Comment received - auto-responding...",
      "📈 Reach increased by 2.3%",
      "🔄 Refreshing content library...",
      "✨ New testimonial post scheduled",
      "📱 TikTok content queued for Sintra",
      "💰 Potential conversion detected!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

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
                    {isAttackRunning ? "✅ Operational" : "⏸️ Paused"}
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
                  <span className="text-sm text-accent">4 Integrated</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Time Saved:</span>
                  <span className="text-sm text-accent">35 min/day</span>
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
                    <span className="text-accent font-mono">${stats.revenue}</span>
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
                    <span className="text-primary font-mono">{((stats.revenue / 1000) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="cyber-progress">
                    <div
                      className="cyber-progress-bar"
                      style={{ width: `${(stats.revenue / 1000) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subscribers:</span>
                  <span className="text-accent">{stats.subscribers} @ $29/mo</span>
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
                      {status.connected ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {status.posts} posts
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
                  onClick={() => toast.info("Generating new content...")}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Generate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-accent/50 text-accent hover:bg-accent/10"
                  onClick={() => toast.info("Deploying to platforms...")}
                >
                  <Send className="w-3 h-3 mr-1" />
                  Deploy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                  onClick={() => toast.info("Fetching sales report...")}
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
                <div className="text-2xl font-bold text-primary font-mono">
                  {stats.postsToday}
                </div>
                <div className="text-xs text-muted-foreground">Posts Today</div>
              </Card>
              <Card className="cyber-card p-4 text-center">
                <div className="text-2xl font-bold text-accent font-mono">
                  {stats.reach.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Reach</div>
              </Card>
              <Card className="cyber-card p-4 text-center">
                <div className="text-2xl font-bold text-orange-400 font-mono">
                  {stats.clicks}
                </div>
                <div className="text-xs text-muted-foreground">Clicks</div>
              </Card>
              <Card className="cyber-card p-4 text-center">
                <div className="text-2xl font-bold text-purple-400 font-mono">
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
                      {content.filter((c) => c.status === "pending").length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          <p>All content reviewed!</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="approved" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>Approved content will appear here</p>
                  </div>
                </TabsContent>
                <TabsContent value="posted" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p>Posted content history will appear here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Just Talk Info & Config */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Just Talk Product Card */}
            <Card className="cyber-card p-4 border-primary/30">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-primary font-['Space_Grotesk']">
                  Just Talk
                </h2>
                <p className="text-xs text-muted-foreground">
                  Someone to talk to. Anytime you need it.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono">(775) 455-8329</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  <DollarSign className="w-4 h-4 text-accent" />
                  <span className="text-sm">$29/month</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">24/7 AI Companion</span>
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-gradient-to-r from-primary to-accent"
                onClick={() => window.open("https://just-talk.onrender.com", "_blank")}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Landing Page
              </Button>
            </Card>

            {/* Target Audiences */}
            <Card className="cyber-card p-4">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <Users className="w-4 h-4" />
                Target Audiences
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  "Caregivers",
                  "Healthcare Workers",
                  "Night Shift",
                  "New Parents",
                  "Remote Workers",
                  "Gig Economy",
                ].map((audience) => (
                  <Badge
                    key={audience}
                    variant="outline"
                    className="text-xs border-muted-foreground/30"
                  >
                    {audience}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Emotional Hooks */}
            <Card className="cyber-card p-4">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4" />
                Emotional Hooks
              </h2>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 text-xs">
                  {[
                    "Ever feel like you're talking, but nobody is really listening?",
                    "It's 3 AM. Your thoughts are loud. Who do you call?",
                    "You're always there for them. But who is there for you?",
                    "Tired of starting over? Explaining it all again?",
                    "Some things you can't say to anyone. But you still need to say them.",
                  ].map((hook, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-muted/30 text-muted-foreground italic"
                    >
                      "{hook}"
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Agent Connection */}
            <Card className="cyber-card p-4">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4" />
                Agent Connection
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HP OMEN:</span>
                  <span className="text-yellow-400">⚠️ Not Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Predator Helios:</span>
                  <span className="text-yellow-400">⚠️ Not Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lenovo Server:</span>
                  <span className="text-yellow-400">⚠️ Not Connected</span>
                </div>
                <p className="text-muted-foreground mt-2 p-2 bg-muted/30 rounded">
                  Configure your local agent endpoints to enable real-time control.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Just Talk Marketing Control Center v1.0</span>
            <span>Powered by Distributed AI Agent System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
