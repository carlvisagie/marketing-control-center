/**
 * POD Self-Learning Acquisition Engine — Dashboard
 *
 * Carl only watches. The engine runs, learns, decides, and evolves autonomously.
 * No approval queue. No manual steps. Just the live intelligence feed.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Crosshair, Zap, TrendingUp, TrendingDown, Activity,
  RefreshCw, Brain, Target, BarChart3, Plane,
  ChevronRight, AlertCircle, CheckCircle2, Clock,
  Flame, Skull, FlaskConical, Layers, ArrowUpRight,
  ArrowDownRight, Minus, Play, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  WINNER: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: Flame, label: "WINNER" },
  LOSER:  { color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30",         icon: Skull, label: "LOSER"  },
  NEUTRAL:{ color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/30",   icon: Minus, label: "NEUTRAL"},
  TESTING:{ color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/30",       icon: FlaskConical, label: "TESTING"},
};

const IMPACT_CONFIG = {
  HIGH:   { color: "text-red-400",    dot: "bg-red-500"    },
  MEDIUM: { color: "text-yellow-400", dot: "bg-yellow-500" },
  LOW:    { color: "text-slate-400",  dot: "bg-slate-500"  },
};

const DECISION_CONFIG: Record<string, { color: string; label: string }> = {
  SCALE_UP:  { color: "text-emerald-400", label: "↑ SCALE UP"  },
  MAINTAIN:  { color: "text-blue-400",    label: "→ MAINTAIN"  },
  REDUCE:    { color: "text-yellow-400",  label: "↓ REDUCE"    },
  KILL:      { color: "text-red-400",     label: "✕ KILL"      },
  REWRITE:   { color: "text-purple-400",  label: "↺ REWRITE"   },
  PIVOT:     { color: "text-orange-400",  label: "⟳ PIVOT"     },
};

const URGENCY_CONFIG: Record<string, string> = {
  HIGH:   "text-red-400 bg-red-500/10 border-red-500/30",
  MEDIUM: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  LOW:    "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

function WeightBar({ weight }: { weight: number }) {
  const pct = Math.min(100, (weight / 3.0) * 100);
  const color = weight >= 1.5 ? "bg-emerald-500" : weight >= 0.8 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-400 w-8 text-right">{weight.toFixed(1)}</span>
    </div>
  );
}

function PlatformStatusCard({ p }: { p: any }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-white text-sm">{p.platform}</p>
            <p className="text-xs text-slate-400">{p.tier} · {p.slots} slots</p>
          </div>
          <Badge className={cn("text-xs border", URGENCY_CONFIG[p.urgency])}>
            {p.urgency}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded border",
            p.status === "ACTIVE" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
            p.status === "NEEDS_UPLOAD" ? "text-orange-400 bg-orange-500/10 border-orange-500/30" :
            "text-slate-400 bg-slate-700 border-slate-600"
          )}>
            {p.status}
          </span>
          <span className="text-xs text-slate-400">{p.organic_sales} organic sales</span>
        </div>
        <p className="text-xs text-slate-300">{p.action}</p>
      </CardContent>
    </Card>
  );
}

function EvolutionEventCard({ event }: { event: any }) {
  const impact = IMPACT_CONFIG[event.impact as keyof typeof IMPACT_CONFIG] || IMPACT_CONFIG.LOW;
  const typeIcon: Record<string, string> = {
    STRATEGY_SHIFT: "⟳",
    WINNER_CONFIRMED: "🏆",
    LOSER_KILLED: "💀",
    EXPERIMENT_LAUNCHED: "🧪",
    LISTING_REWRITTEN: "✏️",
    WEIGHT_UPDATED: "⚖️",
    PIVOT: "↗️",
  };
  return (
    <div className="flex gap-3 py-3 border-b border-slate-800 last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        <span className={cn("inline-block h-2 w-2 rounded-full mt-1.5", impact.dot)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-white leading-snug">
            <span className="mr-1">{typeIcon[event.type] || "•"}</span>
            {event.message}
          </p>
          <span className={cn("text-xs font-semibold flex-shrink-0", impact.color)}>{event.impact}</span>
        </div>
        {event.evidence && (
          <p className="text-xs text-slate-400 mt-1 italic">{event.evidence}</p>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          <span>{new Date(event.timestamp).toLocaleString()}</span>
          <span>·</span>
          <span className="text-slate-400">{event.type.replace(/_/g, " ")}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PODAcquisition() {
  const [activeTab, setActiveTab] = useState("overview");
  const [contentType, setContentType] = useState<"pinterest_pin" | "tiktok_script" | "email" | "listing" | "reddit_post">("pinterest_pin");
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [rewriteResult, setRewriteResult] = useState<any>(null);

  // Queries
  const engineState = trpc.pod.getEngineState.useQuery(undefined, { refetchInterval: 30000 });
  const evolutionLog = trpc.pod.getEvolutionLog.useQuery(undefined, { refetchInterval: 15000 });
  const experiments = trpc.pod.getExperiments.useQuery();
  const platformStatus = trpc.pod.getPlatformStatus.useQuery();
  const actionPlan = trpc.pod.getActionPlan.useQuery();

  // Mutations
  const runCycle = trpc.pod.runLearningCycle.useMutation({
    onSuccess: () => {
      engineState.refetch();
      evolutionLog.refetch();
      experiments.refetch();
    },
  });

  const generateContent = trpc.pod.generateAutonomousContent.useMutation({
    onSuccess: (data) => setGeneratedContent(data),
  });

  const rewriteListing = trpc.pod.rewriteListing.useMutation({
    onSuccess: (data) => setRewriteResult(data),
  });

  const feedSignal = trpc.pod.feedSignal.useMutation({
    onSuccess: () => {
      engineState.refetch();
      evolutionLog.refetch();
    },
  });

  const state = engineState.data;
  const strategy = state?.strategy;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Crosshair className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">POD Acquisition Engine</h1>
            <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              SELF-LEARNING
            </Badge>
          </div>
          <p className="text-slate-400 text-sm">
            Jetfighter1 · Military Aviation · Engine learns what works and gravitates toward it autonomously
          </p>
        </div>
        <Button
          onClick={() => runCycle.mutate()}
          disabled={runCycle.isPending}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
          size="sm"
        >
          {runCycle.isPending ? (
            <><RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />Learning...</>
          ) : (
            <><Brain className="h-3.5 w-3.5 mr-2" />Run Learning Cycle</>
          )}
        </Button>
      </div>

      {/* Core Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Organic Sales</p>
            <p className="text-2xl font-bold text-white">{state?.total_organic_sales ?? 4}</p>
            <p className="text-xs text-emerald-400 mt-1">All-time confirmed</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Amazon Tier</p>
            <p className="text-2xl font-bold text-white">{state?.amazon_tier ?? 10}</p>
            <p className="text-xs text-yellow-400 mt-1">Target: Tier {state?.amazon_tier_target ?? 25}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Winners</p>
            <p className="text-2xl font-bold text-emerald-400">{strategy?.winner_count ?? 0}</p>
            <p className="text-xs text-slate-400 mt-1">Proven signals</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Testing</p>
            <p className="text-2xl font-bold text-blue-400">{strategy?.testing_count ?? 0}</p>
            <p className="text-xs text-slate-400 mt-1">Active experiments</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Total Weight</p>
            <p className="text-2xl font-bold text-white">{strategy?.total_weight?.toFixed(1) ?? "0.0"}</p>
            <p className="text-xs text-slate-400 mt-1">Signal confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Strategy Banner */}
      {strategy && (
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-red-400" />
              <p className="text-sm font-semibold text-red-400 uppercase tracking-wider">Current Engine Strategy</p>
              <Badge className="text-xs bg-red-500/20 text-red-300 border border-red-500/30">AI-Derived from Signal Weights</Badge>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Primary Design</p>
                <p className="text-sm font-bold text-white flex items-center gap-1">
                  <Plane className="h-3.5 w-3.5 text-red-400" />
                  {strategy.primary_design}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Primary Platform</p>
                <p className="text-sm font-bold text-white">{strategy.primary_platform}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Primary Product</p>
                <p className="text-sm font-bold text-white capitalize">{strategy.primary_product}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Primary Angle</p>
                <p className="text-sm font-bold text-white capitalize">{strategy.primary_angle?.replace(/_/g, " ")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800">Evolution Feed</TabsTrigger>
          <TabsTrigger value="signals" className="data-[state=active]:bg-slate-800">Signal Store</TabsTrigger>
          <TabsTrigger value="platforms" className="data-[state=active]:bg-slate-800">Platforms</TabsTrigger>
          <TabsTrigger value="experiments" className="data-[state=active]:bg-slate-800">Experiments</TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-slate-800">Content Engine</TabsTrigger>
          <TabsTrigger value="plan" className="data-[state=active]:bg-slate-800">90-Day Plan</TabsTrigger>
        </TabsList>

        {/* ── Evolution Feed ── */}
        <TabsContent value="overview" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Live Evolution Feed
                </CardTitle>
                <p className="text-xs text-slate-400">What the engine has done autonomously</p>
              </div>
            </CardHeader>
            <CardContent>
              {evolutionLog.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : evolutionLog.data?.events.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No evolution events yet. Run a learning cycle to start.</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {evolutionLog.data?.events.map((event: any) => (
                    <EvolutionEventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Signal Store ── */}
        <TabsContent value="signals" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  Signal Store — What the Engine Has Learned
                </CardTitle>
                <p className="text-xs text-slate-400">Higher weight = engine allocates more resources</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(state?.signals ?? []).map((sig: any) => {
                  const verdict = VERDICT_CONFIG[sig.verdict as keyof typeof VERDICT_CONFIG] || VERDICT_CONFIG.TESTING;
                  const VerdictIcon = verdict.icon;
                  const decision = DECISION_CONFIG[sig.engine_decision] || DECISION_CONFIG.MAINTAIN;
                  return (
                    <div key={sig.id} className={cn("rounded-lg border p-4", verdict.bg)}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <VerdictIcon className={cn("h-4 w-4", verdict.color)} />
                          <span className="font-semibold text-white text-sm">{sig.design}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-400">{sig.platform}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-400 capitalize">{sig.product}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-400 capitalize">{sig.angle?.replace(/_/g, " ")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-bold", verdict.color)}>{verdict.label}</span>
                          <span className={cn("text-xs font-semibold", decision.color)}>{decision.label}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-2 text-xs">
                        <div>
                          <span className="text-slate-400">Sales: </span>
                          <span className="text-white font-semibold">{sig.sales}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Clicks: </span>
                          <span className="text-white font-semibold">{sig.clicks}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">CVR: </span>
                          <span className="text-white font-semibold">{sig.conversion_rate?.toFixed(2)}%</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <p className="text-xs text-slate-400 mb-1">Weight (resource allocation)</p>
                        <WeightBar weight={sig.weight} />
                      </div>
                      <p className="text-xs text-slate-400 italic">{sig.decision_reason}</p>
                    </div>
                  );
                })}
              </div>

              {/* Feed a new signal */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Feed New Signal to Engine
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                  {[
                    { design: "A-10 Warthog", platform: "Redbubble", angle: "aviation_art", product: "sticker", clicks: 12, sales: 1 },
                    { design: "F-16 Fighting Falcon", platform: "Redbubble", angle: "veteran_gift", product: "sticker", clicks: 8, sales: 0 },
                    { design: "F-22 Raptor", platform: "Amazon Merch", angle: "gift", product: "t-shirt", clicks: 5, sales: 0 },
                    { design: "SR-71 Blackbird", platform: "Etsy", angle: "aviation_art", product: "poster", clicks: 3, sales: 0 },
                    { design: "P-51 Mustang", platform: "Redbubble", angle: "history", product: "sticker", clicks: 15, sales: 2 },
                  ].map((preset) => (
                    <Button
                      key={preset.design}
                      variant="outline"
                      size="sm"
                      className="text-xs border-slate-700 text-slate-300 hover:border-blue-500/50 hover:text-blue-400"
                      onClick={() => feedSignal.mutate({ ...preset, source: "preset_test" })}
                      disabled={feedSignal.isPending}
                    >
                      {preset.design.split(" ")[0]}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">Click to feed a preset signal — engine will score it and update weights automatically</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Platforms ── */}
        <TabsContent value="platforms" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(platformStatus.data?.platforms ?? []).map((p: any) => (
              <PlatformStatusCard key={p.platform} p={p} />
            ))}
          </div>
        </TabsContent>

        {/* ── Experiments ── */}
        <TabsContent value="experiments" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-purple-400" />
                  Active Experiments
                </CardTitle>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="text-blue-400 font-semibold">{experiments.data?.running ?? 0} running</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-semibold">{experiments.data?.concluded ?? 0} concluded</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(experiments.data?.experiments ?? []).map((exp: any) => (
                  <div key={exp.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-500">{exp.id}</span>
                          <Badge className={cn(
                            "text-xs border",
                            exp.status === "RUNNING" ? "text-blue-400 bg-blue-500/10 border-blue-500/30" :
                            exp.status === "CONCLUDED" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
                            "text-red-400 bg-red-500/10 border-red-500/30"
                          )}>
                            {exp.status}
                          </Badge>
                          {exp.verdict && (
                            <Badge className={cn("text-xs border", VERDICT_CONFIG[exp.verdict as keyof typeof VERDICT_CONFIG]?.bg, VERDICT_CONFIG[exp.verdict as keyof typeof VERDICT_CONFIG]?.color)}>
                              {exp.verdict}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-white">
                          {exp.design} · {exp.platform} · {exp.product} · {exp.angle?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 italic mb-1">Hypothesis: {exp.hypothesis}</p>
                    {exp.result && <p className="text-xs text-emerald-400">Result: {exp.result}</p>}
                    <p className="text-xs text-slate-500 mt-1">Started: {new Date(exp.started_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Content Engine ── */}
        <TabsContent value="content" className="mt-4">
          <div className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Autonomous Content Engine
                </CardTitle>
                <p className="text-xs text-slate-400">Engine generates content based on winning signals — no templates, no guesswork</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(["pinterest_pin", "tiktok_script", "email", "listing", "reddit_post"] as const).map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant={contentType === type ? "default" : "outline"}
                      className={cn(
                        "text-xs",
                        contentType === type ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "border-slate-700 text-slate-400"
                      )}
                      onClick={() => setContentType(type)}
                    >
                      {type.replace(/_/g, " ").toUpperCase()}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => generateContent.mutate({ content_type: contentType, count: 3 })}
                  disabled={generateContent.isPending}
                  className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 mb-4"
                  size="sm"
                >
                  {generateContent.isPending ? (
                    <><RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Zap className="h-3.5 w-3.5 mr-2" />Generate 3 {contentType.replace(/_/g, " ")}s</>
                  )}
                </Button>

                {generatedContent?.success && generatedContent.output?.items && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Strategy applied: {generatedContent.output.strategy_applied}
                    </div>
                    {generatedContent.output.items.map((item: any, i: number) => (
                      <div key={i} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-slate-500">{item.id}</span>
                          <span className="text-xs text-slate-400">{item.design} · {item.platform_target} · {item.angle?.replace(/_/g, " ")}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          {Object.entries(item.content || {}).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">{key.replace(/_/g, " ")}</p>
                              <p className="text-slate-200 text-xs leading-relaxed">
                                {Array.isArray(value) ? (value as string[]).join(", ") : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400 italic">
                          {item.why_this_works}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Listing Rewriter */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-purple-400" />
                  Autonomous Listing Rewriter
                </CardTitle>
                <p className="text-xs text-slate-400">Engine rewrites underperforming listings using winning signal angles</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { design: "F-15 Strike Eagle", platform: "etsy" as const, product: "t-shirt", views: 45, sales: 0 },
                    { design: "F-15 Strike Eagle", platform: "amazon" as const, product: "t-shirt", views: 12, sales: 0 },
                    { design: "F-16 Fighting Falcon", platform: "redbubble" as const, product: "sticker", views: 8, sales: 0 },
                  ].map((preset) => (
                    <Button
                      key={`${preset.design}-${preset.platform}`}
                      size="sm"
                      variant="outline"
                      className="text-xs border-slate-700 text-slate-300 hover:border-purple-500/50 hover:text-purple-400"
                      onClick={() => rewriteListing.mutate({ ...preset, reason: "0% conversion — engine auto-rewrite" })}
                      disabled={rewriteListing.isPending}
                    >
                      {rewriteListing.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
                      {preset.design.split(" ")[0]} · {preset.platform}
                    </Button>
                  ))}
                </div>

                {rewriteResult?.success && rewriteResult.rewrite && (
                  <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-400" />
                      <p className="text-sm font-semibold text-purple-400">Listing Rewritten</p>
                      <Badge className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Confidence: {(rewriteResult.rewrite.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Why old listing failed</p>
                      <p className="text-xs text-slate-300">{rewriteResult.rewrite.rewrite_reason}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">New Title</p>
                      <p className="text-sm font-semibold text-white">{rewriteResult.rewrite.new_title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {(rewriteResult.rewrite.new_tags || []).map((tag: string, i: number) => (
                          <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Angle Applied</p>
                      <p className="text-xs text-emerald-400">{rewriteResult.rewrite.angle_applied}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Predicted Improvement</p>
                      <p className="text-xs text-slate-300 italic">{rewriteResult.rewrite.predicted_improvement}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── 90-Day Plan ── */}
        <TabsContent value="plan" className="mt-4">
          <div className="space-y-4">
            {(actionPlan.data?.plan ?? []).map((phase: any, i: number) => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">{phase.phase}</span>
                        <Badge className="text-xs bg-slate-700 text-slate-300 border-slate-600">{phase.label}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Who does this</p>
                      <p className="text-xs font-semibold text-emerald-400">{phase.who}</p>
                      <p className="text-xs text-slate-500">Carl: {phase.carl_time}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-3">
                    {phase.actions.map((action: string, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-slate-300">
                        <ChevronRight className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" />
                        {action}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <Target className="h-3.5 w-3.5 text-yellow-400" />
                    <p className="text-xs text-yellow-400 font-semibold">{phase.target}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
