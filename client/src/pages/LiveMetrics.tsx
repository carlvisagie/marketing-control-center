/**
 * Live Metrics Dashboard - Real Data from Just Talk
 * 
 * This dashboard shows REAL data from the Just Talk platform database.
 * All metrics are read-only and do not affect Just Talk operations.
 */
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Phone,
  MessageSquare,
  DollarSign,
  Users,
  Activity,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Database,
  Heart,
  Brain,
} from "lucide-react";

export default function LiveMetrics() {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Test connection to Just Talk database
  const connectionTest = trpc.analytics.testConnection.useQuery(undefined, {
    refetchInterval: 60000, // Check every minute
  });

  // Get overview metrics
  const overview = trpc.analytics.getOverview.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get recent activity
  const recentActivity = trpc.analytics.getRecentActivity.useQuery(
    { limit: 20 },
    { refetchInterval: 30000 }
  );

  // Get client insights
  const clientInsights = trpc.analytics.getClientInsights.useQuery(undefined, {
    refetchInterval: 60000,
  });

  // Get AI coach metrics
  const aiCoachMetrics = trpc.analytics.getAICoachMetrics.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const handleRefresh = () => {
    overview.refetch();
    recentActivity.refetch();
    clientInsights.refetch();
    aiCoachMetrics.refetch();
    setLastRefresh(new Date());
    toast.success("Data refreshed");
  };

  const isConnected = connectionTest.data?.connected ?? false;
  const metrics = overview.data?.metrics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="h-8 w-8 text-cyan-400" />
            Live Metrics
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time data from Just Talk platform
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className={`${
              isConnected
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            } px-3 py-1`}
          >
            <Database className="h-3 w-3 mr-1" />
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <span className="text-slate-500 text-sm">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {!isConnected && (
        <Card className="bg-amber-500/10 border-amber-500/30 p-4 mb-6">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-medium">Database Not Connected</p>
              <p className="text-sm text-amber-400/70">
                Add JUST_TALK_DATABASE_URL to your environment variables to see live data.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Total Clients"
          value={metrics?.totalClients ?? 0}
          color="cyan"
        />
        <MetricCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="Chat Sessions"
          value={metrics?.chatSessions ?? 0}
          subtitle="Last 30 days"
          color="purple"
        />
        <MetricCard
          icon={<Phone className="h-5 w-5" />}
          label="Calls"
          value={metrics?.callsCount ?? 0}
          subtitle={`${metrics?.callDurationMinutes ?? 0} min total`}
          color="emerald"
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue"
          value={`$${((metrics?.revenueCents ?? 0) / 100).toFixed(2)}`}
          subtitle="Last 30 days"
          color="amber"
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Crisis Alerts"
          value={metrics?.crisisAlerts ?? 0}
          subtitle="Last 30 days"
          color="red"
        />
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-500/20">
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="clients" className="data-[state=active]:bg-cyan-500/20">
            Client Insights
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-cyan-500/20">
            AI Coach Performance
          </TabsTrigger>
        </TabsList>

        {/* Recent Activity Tab */}
        <TabsContent value="activity">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Recent Chats */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                Recent Chats
              </h3>
              <ScrollArea className="h-[300px]">
                {(recentActivity.data?.recentChats as any[])?.map((chat: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-800/50 rounded-lg mb-2 border border-slate-700/30"
                  >
                    <p className="text-slate-300 text-sm truncate">
                      {chat.title || "Untitled conversation"}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(chat.created_at).toLocaleString()}
                    </p>
                  </div>
                )) || (
                  <p className="text-slate-500 text-sm">No recent chats</p>
                )}
              </ScrollArea>
            </Card>

            {/* Recent Calls */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400" />
                Recent Calls
              </h3>
              <ScrollArea className="h-[300px]">
                {(recentActivity.data?.recentCalls as any[])?.map((call: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-800/50 rounded-lg mb-2 border border-slate-700/30"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        className={`${
                          call.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {call.call_type}
                      </Badge>
                      <span className="text-slate-400 text-xs">
                        {Math.round((call.duration_seconds || 0) / 60)} min
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(call.created_at).toLocaleString()}
                    </p>
                  </div>
                )) || (
                  <p className="text-slate-500 text-sm">No recent calls</p>
                )}
              </ScrollArea>
            </Card>

            {/* Recent Sessions */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-400" />
                Recent Bookings
              </h3>
              <ScrollArea className="h-[300px]">
                {(recentActivity.data?.recentSessions as any[])?.map((session: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-800/50 rounded-lg mb-2 border border-slate-700/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">
                        {session.session_type || "Session"}
                      </span>
                      <Badge
                        className={`${
                          session.payment_status === "paid"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-500/20 text-slate-400"
                        }`}
                      >
                        {session.payment_status === "paid"
                          ? `$${((session.price || 0) / 100).toFixed(2)}`
                          : session.payment_status}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(session.created_at).toLocaleString()}
                    </p>
                  </div>
                )) || (
                  <p className="text-slate-500 text-sm">No recent bookings</p>
                )}
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        {/* Client Insights Tab */}
        <TabsContent value="clients">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Status Distribution */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                Client Status
              </h3>
              <div className="space-y-3">
                {(clientInsights.data?.statusDistribution as any[])?.map(
                  (item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-slate-400 capitalize">
                        {item.status || "Unknown"}
                      </span>
                      <Badge className="bg-cyan-500/20 text-cyan-400">
                        {item.count}
                      </Badge>
                    </div>
                  )
                ) || <p className="text-slate-500 text-sm">No data</p>}
              </div>
            </Card>

            {/* Location Distribution */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                Top Locations
              </h3>
              <div className="space-y-3">
                {(clientInsights.data?.locationDistribution as any[])?.map(
                  (item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-slate-400">
                        {item.location_country || "Unknown"}
                      </span>
                      <Badge className="bg-purple-500/20 text-purple-400">
                        {item.count}
                      </Badge>
                    </div>
                  )
                ) || <p className="text-slate-500 text-sm">No data</p>}
              </div>
            </Card>

            {/* Goals Distribution */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-400" />
                Primary Goals
              </h3>
              <div className="space-y-3">
                {(clientInsights.data?.goalsDistribution as any[])?.map(
                  (item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-slate-400">{item.goal_category}</span>
                      <Badge className="bg-rose-500/20 text-rose-400">
                        {item.count}
                      </Badge>
                    </div>
                  )
                ) || <p className="text-slate-500 text-sm">No data</p>}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* AI Coach Performance Tab */}
        <TabsContent value="ai">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Feedback Ratings */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Brain className="h-4 w-4 text-cyan-400" />
                AI Coach Ratings
              </h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-4xl font-bold text-cyan-400">
                    {Number(
                      (aiCoachMetrics.data?.feedbackRatings as any)?.avg_rating || 0
                    ).toFixed(1)}
                  </p>
                  <p className="text-slate-400 text-sm">Average Rating</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xl font-bold text-emerald-400">
                      {(aiCoachMetrics.data?.feedbackRatings as any)?.total_rated || 0}
                    </p>
                    <p className="text-slate-500 text-xs">Total Rated</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xl font-bold text-purple-400">
                      {(aiCoachMetrics.data?.feedbackRatings as any)?.helpful_count || 0}
                    </p>
                    <p className="text-slate-500 text-xs">Helpful</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Emotion Distribution */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-400" />
                Detected Emotions
              </h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {(aiCoachMetrics.data?.emotionDistribution as any[])?.map(
                    (item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-slate-400 capitalize">
                          {item.emotion_detected}
                        </span>
                        <Badge className="bg-rose-500/20 text-rose-400">
                          {item.count}
                        </Badge>
                      </div>
                    )
                  ) || <p className="text-slate-500 text-sm">No data</p>}
                </div>
              </ScrollArea>
            </Card>

            {/* Crisis Distribution */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Crisis Flags
              </h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {(aiCoachMetrics.data?.crisisDistribution as any[])?.map(
                    (item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-slate-400 capitalize">
                          {item.crisis_flag}
                        </span>
                        <Badge className="bg-amber-500/20 text-amber-400">
                          {item.count}
                        </Badge>
                      </div>
                    )
                  ) || <p className="text-slate-500 text-sm">No crisis flags</p>}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: "cyan" | "purple" | "emerald" | "amber" | "red";
}) {
  const colorClasses = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    red: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <Card className={`${colorClasses[color]} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={colorClasses[color].split(" ")[0]}>{icon}</span>
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colorClasses[color].split(" ")[0]}`}>
        {value}
      </p>
      {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
    </Card>
  );
}
