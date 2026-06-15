/**
 * POD Bulk Upload Engine — Autonomous Design Upload Dashboard
 *
 * Shows the full autonomous upload pipeline:
 * - Design queue with status across all 5 platforms
 * - AI listing generation per design
 * - Platform dispatch with upload instructions
 * - Activity log
 * - One-click autonomous batch run
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Globe,
  Package,
  FileText,
  Activity,
  Play,
  ExternalLink,
} from "lucide-react";

const PLATFORM_LABELS: Record<string, { name: string; color: string; bg: string }> = {
  amazon_merch: { name: "Amazon", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  redbubble: { name: "Redbubble", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  etsy: { name: "Etsy", color: "text-orange-300", bg: "bg-orange-400/10 border-orange-400/20" },
  spring: { name: "Spring", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  spreadshirt: { name: "Spreadshirt", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  queued: { label: "Queued", color: "text-slate-400", icon: Clock },
  generating_listing: { label: "Generating...", color: "text-yellow-400", icon: RefreshCw },
  listing_ready: { label: "Ready", color: "text-blue-400", icon: FileText },
  uploading: { label: "Uploading...", color: "text-yellow-400", icon: RefreshCw },
  live: { label: "LIVE", color: "text-emerald-400", icon: CheckCircle },
  failed: { label: "Failed", color: "text-red-400", icon: AlertCircle },
  retry_scheduled: { label: "Retry", color: "text-orange-400", icon: RefreshCw },
};

export default function PODUploadEngine() {
  const queryClient = useQueryClient();
  const [newDesignName, setNewDesignName] = useState("");
  const [newAircraft, setNewAircraft] = useState("");
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("queue");

  // Fetch engine state
  const { data: engineState, isLoading } = trpc.podUpload.getEngineState.useQuery(undefined, {
    refetchInterval: 10000,
  });

  // Add design mutation
  const addDesign = trpc.podUpload.addDesign.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["podUpload"]] });
      setNewDesignName("");
      setNewAircraft("");
      toast.success("Design added to queue — AI will generate listings automatically.");
    },
    onError: (err) => toast.error(err.message),
  });

  // Generate listing mutation
  const generateListing = trpc.podUpload.generateListing.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["podUpload"]] });
      toast.success("Listings generated — AI has created optimised listings for all 5 platforms.");
    },
    onError: (err) => toast.error(err.message),
  });

  // Run autonomous batch mutation
  const runBatch = trpc.podUpload.runAutonomousBatch.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["podUpload"]] });
      toast.success(`Batch complete — ${data.processed} designs processed: ${data.message}`);
    },
    onError: (err) => toast.error(err.message),
  });

  // Mark as live mutation
  const markLive = trpc.podUpload.markAsLive.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["podUpload"]] });
      toast.success("Platform status updated.");
    },
    onError: (err) => toast.error(err.message),
  });

  const stats = engineState?.stats;
  const designs = engineState?.designs || [];
  const activityLog = engineState?.activityLog || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Upload className="h-7 w-7 text-orange-400" />
            Bulk Upload Engine
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">AUTONOMOUS</Badge>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            AI generates optimised listings for all 5 platforms. Zero manual work.
          </p>
        </div>
        <Button
          onClick={() => runBatch.mutate()}
          disabled={runBatch.isPending}
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
        >
          {runBatch.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Run Autonomous Batch
        </Button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Designs</p>
              <p className="text-2xl font-bold text-white">{stats.totalDesigns}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Live Listings</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.liveListings}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Queued</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.queuedUploads}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Coverage</p>
              <p className="text-2xl font-bold text-blue-400">{stats.coveragePercent}%</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-400">{stats.failedUploads}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Coverage */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.platformBreakdown.map((pb: any) => {
            const cfg = PLATFORM_LABELS[pb.platform];
            return (
              <Card key={pb.platform} className={`bg-slate-900 border ${cfg.bg}`}>
                <CardContent className="p-3">
                  <p className={`text-xs font-semibold mb-2 ${cfg.color}`}>{cfg.name}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400">{pb.live} live</span>
                    <span className="text-slate-400">{pb.queued} queued</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">{pb.config.uploadMethod}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="queue">Design Queue</TabsTrigger>
          <TabsTrigger value="add">Add Design</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="platforms">Platform Guide</TabsTrigger>
        </TabsList>

        {/* Design Queue */}
        <TabsContent value="queue" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Loading design queue...</div>
          ) : designs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No designs in queue. Add your first design.</div>
          ) : (
            designs.map((design: any) => (
              <Card key={design.id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white text-sm">{design.name}</h3>
                      <p className="text-xs text-slate-400">{design.aircraft} · Signal weight: {design.signalWeight.toFixed(1)}</p>
                    </div>
                    <div className="flex gap-2">
                      {!design.aiListing && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-slate-700 hover:bg-slate-800"
                          onClick={() => generateListing.mutate(design.id)}
                          disabled={generateListing.isPending}
                        >
                          {generateListing.isPending ? (
                            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Zap className="h-3 w-3 mr-1" />
                          )}
                          Generate Listings
                        </Button>
                      )}
                      {design.aiListing && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                          AI Listing Ready — {Math.round((design.aiListing.confidence || 0.85) * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Platform status grid */}
                  <div className="grid grid-cols-5 gap-2">
                    {design.platforms.map((p: any) => {
                      const cfg = PLATFORM_LABELS[p.platform];
                      const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.queued;
                      const StatusIcon = statusCfg.icon;
                      return (
                        <div key={p.platform} className={`rounded-lg border p-2 ${cfg.bg}`}>
                          <p className={`text-xs font-semibold ${cfg.color} mb-1`}>{cfg.name}</p>
                          <div className={`flex items-center gap-1 ${statusCfg.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            <span className="text-xs">{statusCfg.label}</span>
                          </div>
                          {p.status === "listing_ready" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-5 px-1 mt-1 text-emerald-400 hover:text-emerald-300"
                              onClick={() => markLive.mutate({ designId: design.id, platform: p.platform })}
                            >
                              Mark Live
                            </Button>
                          )}
                          {p.listingUrl && (
                            <a href={p.listingUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5 mt-1">
                              <ExternalLink className="h-2.5 w-2.5" />View
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Listing Preview */}
                  {design.aiListing && (
                    <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1">AI-Generated Master Title:</p>
                      <p className="text-sm text-white font-medium">{design.aiListing.title}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {design.aiListing.tags?.slice(0, 8).map((tag: string) => (
                          <span key={tag} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Add Design */}
        <TabsContent value="add" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Add Design to Queue</CardTitle>
              <p className="text-slate-400 text-sm">
                Enter the design name and aircraft. The engine generates all listings automatically for all 5 platforms.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">Design Name</Label>
                <Input
                  value={newDesignName}
                  onChange={(e) => setNewDesignName(e.target.value)}
                  placeholder="e.g. F-15 Strike Eagle Military Aviation Combat Aircraft Design"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Aircraft</Label>
                <Input
                  value={newAircraft}
                  onChange={(e) => setNewAircraft(e.target.value)}
                  placeholder="e.g. F-15 Strike Eagle"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
              <Button
                onClick={() => addDesign.mutate({ name: newDesignName, aircraft: newAircraft })}
                disabled={!newDesignName || !newAircraft || addDesign.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                Add to Queue — AI Handles Everything Else
              </Button>
              <p className="text-xs text-slate-500 text-center">
                After adding, click "Run Autonomous Batch" to generate listings and dispatch to all platforms.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log */}
        <TabsContent value="activity" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-400" />
                Upload Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activityLog.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No activity yet. Run the autonomous batch to start.</p>
                ) : (
                  activityLog.map((entry: any) => (
                    <div key={entry.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{entry.message}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(entry.timestamp).toLocaleTimeString()} · {entry.designName}
                          {entry.platform && ` · ${PLATFORM_LABELS[entry.platform]?.name}`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Guide */}
        <TabsContent value="platforms" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {engineState?.platformConfig && Object.entries(engineState.platformConfig).map(([key, cfg]: [string, any]) => {
              const label = PLATFORM_LABELS[key];
              return (
                <Card key={key} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className={`h-4 w-4 ${label.color}`} />
                      <h3 className={`font-semibold text-sm ${label.color}`}>{cfg.name}</h3>
                      <Badge className="text-xs bg-slate-800 text-slate-300 border-slate-700">
                        {cfg.uploadMethod}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{cfg.notes}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Max tags:</span>
                        <span className="text-white ml-1">{cfg.maxTags || "N/A (bullets)"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Title limit:</span>
                        <span className="text-white ml-1">{cfg.maxTitleLength} chars</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cfg.defaultProducts?.map((p: string) => (
                        <span key={p} className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          {p.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
