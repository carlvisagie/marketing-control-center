/**
 * Jetfighter Viral Media Engine — Aviation Content Generation Dashboard
 *
 * Aviation adaptation of the Just Talk Viral Engine.
 * Shows:
 * - Self-learning theme weights (gravitates toward winners)
 * - Generated scripts with 5-frame previews
 * - Batch generation with accept/reject scoring
 * - Platform captions ready to post
 * - Engine analytics and evolution feed
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clapperboard,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Play,
  Star,
  BarChart3,
  Target,
  Film,
  Brain,
  CheckCircle,
  XCircle,
} from "lucide-react";

const THEME_LABELS: Record<string, string> = {
  f15_strike_eagle: "F-15 Strike Eagle",
  a10_warthog: "A-10 Warthog",
  f16_viper: "F-16 Viper",
  f22_raptor: "F-22 Raptor",
  sr71_blackbird: "SR-71 Blackbird",
  f35_lightning: "F-35 Lightning II",
  b52_stratofortress: "B-52 Stratofortress",
  p51_mustang: "P-51 Mustang",
  veteran_pride: "Veteran Pride",
  pilot_life: "Pilot Life",
  aviation_history: "Aviation History",
  gift_for_pilot: "Gift for Pilot",
  airshow_culture: "Airshow Culture",
  military_family: "Military Family",
};

const VISUAL_STYLE_LABELS: Record<string, string> = {
  cockpit_dark: "Cockpit Dark",
  afterburner_glow: "Afterburner Glow",
  formation_flight: "Formation Flight",
  hangar_atmosphere: "Hangar Atmosphere",
  blueprint_technical: "Blueprint Technical",
};

export default function PODMediaEngine() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("generate");
  const [selectedScript, setSelectedScript] = useState<any>(null);
  const [batchCount, setBatchCount] = useState(5);

  // Fetch engine state
  const { data: engineState, isLoading } = trpc.podMedia.getEngineState.useQuery(undefined, {
    refetchInterval: 15000,
  });

  // Fetch theme weights
  const { data: themeWeights } = trpc.podMedia.getThemeWeights.useQuery(undefined, {
    refetchInterval: 15000,
  });

  // Fetch recent batches
  const { data: recentBatches } = trpc.podMedia.getRecentBatches.useQuery(undefined, {
    refetchInterval: 15000,
  });

  // Fetch analytics
  const { data: analytics } = trpc.podMedia.getAnalytics.useQuery(undefined, {
    refetchInterval: 15000,
  });

  // Run autonomous batch
  const runBatch = trpc.podMedia.runAutonomousBatch.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["podMedia"]] });
      toast.success(`Batch complete — ${data.accepted}/${data.totalGenerated} scripts accepted`);
      if (data.topScript) setSelectedScript(data.topScript);
    },
    onError: (err) => toast.error(err.message),
  });

  // Generate single script
  const generateScript = trpc.podMedia.generateScript.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["podMedia"]] });
      if (data.accepted) {
        setSelectedScript(data.script);
        toast.success(`Script accepted — score: ${data.script.score}/100`);
      } else {
        toast.error(`Script rejected — score: ${data.script.score}/100. Engine will try a different angle.`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const topTheme = themeWeights?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Clapperboard className="h-7 w-7 text-purple-400" />
            Viral Media Engine
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">SELF-LEARNING</Badge>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Aviation adaptation of the Just Talk Viral Engine. Generates, scores, and evolves autonomously.
          </p>
        </div>
        <Button
          onClick={() => runBatch.mutate({ count: batchCount })}
          disabled={runBatch.isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
        >
          {runBatch.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Run Batch ({batchCount} scripts)
        </Button>
      </div>

      {/* Stats Row */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Generated</p>
              <p className="text-2xl font-bold text-white">{analytics.totalScriptsGenerated}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Accepted</p>
              <p className="text-2xl font-bold text-emerald-400">{analytics.totalAccepted}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-400">{analytics.totalRejected}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Accept Rate</p>
              <p className="text-2xl font-bold text-blue-400">{analytics.acceptRate}%</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Avg Score</p>
              <p className="text-2xl font-bold text-purple-400">{Math.round(analytics.avgScore || 0)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Theme Banner */}
      {topTheme && (
        <Card className="bg-gradient-to-r from-purple-900/30 to-slate-900 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-xs text-slate-400">Engine's Top Performing Theme</p>
                <p className="text-white font-semibold">{THEME_LABELS[topTheme.theme] || topTheme.theme}</p>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-slate-400">Weight</p>
                  <p className="text-lg font-bold text-purple-400">{topTheme.weight.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">Avg Score</p>
                  <p className="text-lg font-bold text-white">{Math.round(topTheme.avgScore || 0)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="weights">Theme Weights</TabsTrigger>
          <TabsTrigger value="batches">Recent Batches</TabsTrigger>
          <TabsTrigger value="script">Script Viewer</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Batch size selector */}
            <Card className="bg-slate-900 border-slate-800 col-span-2 md:col-span-3">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-white font-medium">Autonomous Batch</p>
                    <p className="text-xs text-slate-400">Engine selects themes by weight. Higher weight = more likely to be chosen.</p>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {[3, 5, 10, 15].map(n => (
                      <Button
                        key={n}
                        size="sm"
                        variant={batchCount === n ? "default" : "outline"}
                        className={batchCount === n ? "bg-purple-600" : "border-slate-700"}
                        onClick={() => setBatchCount(n)}
                      >
                        {n}
                      </Button>
                    ))}
                    <Button
                      onClick={() => runBatch.mutate({ count: batchCount })}
                      disabled={runBatch.isPending}
                      className="bg-purple-600 hover:bg-purple-700 gap-2"
                    >
                      {runBatch.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Generate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick generate per theme */}
          <div>
            <p className="text-sm text-slate-400 mb-3">Or generate a single script for a specific theme:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {themeWeights?.slice(0, 8).map((tw: any) => (
                <Button
                  key={tw.theme}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 text-left justify-start h-auto py-2 px-3"
                  onClick={() => generateScript.mutate(tw.theme)}
                  disabled={generateScript.isPending}
                >
                  <div className="text-left">
                    <p className="text-xs text-white font-medium">{THEME_LABELS[tw.theme] || tw.theme}</p>
                    <p className="text-xs text-purple-400">weight: {tw.weight.toFixed(1)}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Latest generated script preview */}
          {selectedScript && (
            <Card className="bg-slate-900 border-purple-500/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Film className="h-4 w-4 text-purple-400" />
                    Latest Script — {selectedScript.aircraft}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={selectedScript.score >= 75
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                    }>
                      Score: {selectedScript.score}/100
                    </Badge>
                    {selectedScript.score >= 75
                      ? <CheckCircle className="h-4 w-4 text-emerald-400" />
                      : <XCircle className="h-4 w-4 text-red-400" />
                    }
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 5-frame preview */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {selectedScript.frames?.map((frame: string, i: number) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-2 border border-slate-700 aspect-[9/16] flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Frame {i + 1}</p>
                        <p className="text-xs text-white font-medium leading-tight">{frame}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Platform captions */}
                {selectedScript.platform_captions && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-medium">Platform Captions (ready to post):</p>
                    {Object.entries(selectedScript.platform_captions).map(([platform, caption]: [string, any]) => (
                      <div key={platform} className="p-2 bg-slate-800/50 rounded border border-slate-700">
                        <p className="text-xs text-purple-400 font-medium mb-1">{platform.replace(/_/g, " ").toUpperCase()}</p>
                        <p className="text-xs text-white">{caption}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hashtags */}
                {selectedScript.hashtags && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedScript.hashtags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Theme Weights Tab */}
        <TabsContent value="weights" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" />
                Self-Learning Theme Weights
              </CardTitle>
              <p className="text-slate-400 text-xs">
                Engine gravitates toward higher-weight themes. Weights evolve automatically based on script quality scores.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {themeWeights?.map((tw: any) => {
                  const maxWeight = 5.0;
                  const pct = Math.round((tw.weight / maxWeight) * 100);
                  return (
                    <div key={tw.theme} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {tw.topPerformer && <Star className="h-3 w-3 text-yellow-400" />}
                          <span className="text-sm text-white">{THEME_LABELS[tw.theme] || tw.theme}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-slate-400">{tw.totalGenerated} scripts</span>
                          <span className="text-purple-400 font-bold">{tw.weight.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${tw.topPerformer ? "bg-gradient-to-r from-purple-500 to-yellow-400" : "bg-purple-600"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Batches Tab */}
        <TabsContent value="batches" className="mt-4 space-y-3">
          {!recentBatches || recentBatches.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No batches yet. Run the engine to generate your first batch.</div>
          ) : (
            recentBatches.map((batch: any) => (
              <Card key={batch.batch_id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-white">Batch {batch.batch_id.slice(-8)}</p>
                      <p className="text-xs text-slate-400">{new Date(batch.generatedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Accepted</p>
                        <p className="text-lg font-bold text-emerald-400">{batch.accepted}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Rejected</p>
                        <p className="text-lg font-bold text-red-400">{batch.rejected}</p>
                      </div>
                      <Badge className={batch.status === "ready" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-300"}>
                        {batch.status}
                      </Badge>
                    </div>
                  </div>
                  {/* Scripts in batch */}
                  {batch.scripts?.slice(0, 3).map((script: any) => (
                    <div
                      key={script.script_id}
                      className="p-2 bg-slate-800/50 rounded border border-slate-700 mb-2 cursor-pointer hover:border-purple-500/30"
                      onClick={() => { setSelectedScript(script); setActiveTab("script"); }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white font-medium truncate flex-1">{script.hook}</p>
                        <Badge className="ml-2 text-xs bg-purple-500/20 text-purple-400 border-purple-500/30 shrink-0">
                          {script.score}/100
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{script.aircraft} · {VISUAL_STYLE_LABELS[script.visual_style]}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Script Viewer Tab */}
        <TabsContent value="script" className="mt-4">
          {!selectedScript ? (
            <div className="text-center py-12 text-slate-400">
              Generate a batch or click a script from Recent Batches to view it here.
            </div>
          ) : (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">{selectedScript.aircraft} — Full Script</CardTitle>
                  <Badge className={selectedScript.score >= 75
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                  }>
                    Score: {selectedScript.score}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 5 frames */}
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-2">5-Frame Script (1080×1920):</p>
                  <div className="space-y-2">
                    {selectedScript.frames?.map((frame: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                        <span className="text-xs text-purple-400 font-bold w-16 shrink-0">Frame {i + 1}{i === 0 ? " (HOOK)" : i === 4 ? " (CTA)" : ""}</span>
                        <p className="text-sm text-white">{frame}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Caption variants */}
                {selectedScript.caption_variants && (
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-2">Caption Variants:</p>
                    {selectedScript.caption_variants.map((cap: string, i: number) => (
                      <div key={i} className="p-2 bg-slate-800/50 rounded border border-slate-700 mb-2">
                        <p className="text-xs text-slate-400 mb-1">Variant {i + 1}</p>
                        <p className="text-sm text-white">{cap}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Store link */}
                <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                  <p className="text-xs text-purple-400 font-medium mb-1">Store Link (in bio / caption):</p>
                  <p className="text-sm text-white">{selectedScript.store_link_anchor}</p>
                </div>

                {/* Reasons */}
                {selectedScript.reasons?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-2">Engine Assessment:</p>
                    {selectedScript.reasons.map((r: string, i: number) => (
                      <p key={i} className="text-xs text-slate-300 flex items-start gap-1">
                        <span className="text-purple-400 mt-0.5">→</span> {r}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
