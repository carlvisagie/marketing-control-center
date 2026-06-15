/**
 * POD Bulk Upload Engine — Living Organism Dashboard
 *
 * This is the organism's primary interface. It shows:
 *  1. Organism health (GREEN / AMBER / RED) with bottleneck and next action
 *  2. Platform priority groups — PRIMARY (unlimited) vs SECONDARY (tier-gated)
 *  3. Visual design gallery — every design visible with per-platform status
 *  4. AI listing generation and dispatch
 *  5. Activity log
 *
 * The organism never hides. Every design, every platform, every status is visible.
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
  FileText,
  Activity,
  ExternalLink,
  Heart,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";

// ─── Platform Display Config ──────────────────────────────────────────────────

const PLATFORM_LABELS: Record<string, { name: string; color: string; bg: string; border: string }> = {
  amazon_merch: { name: "Amazon", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  redbubble:    { name: "Redbubble", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  etsy:         { name: "Etsy", color: "text-orange-300", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  spring:       { name: "Spring", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  spreadshirt:  { name: "Spreadshirt", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: any }> = {
  queued:             { label: "Queued",       color: "text-slate-400",   dot: "bg-slate-500",   icon: Clock },
  generating_listing: { label: "Generating…",  color: "text-yellow-400",  dot: "bg-yellow-400",  icon: RefreshCw },
  listing_ready:      { label: "Ready",         color: "text-blue-400",    dot: "bg-blue-400",    icon: FileText },
  uploading:          { label: "Uploading…",    color: "text-yellow-400",  dot: "bg-yellow-400",  icon: RefreshCw },
  live:               { label: "LIVE",          color: "text-emerald-400", dot: "bg-emerald-400", icon: CheckCircle },
  failed:             { label: "Failed",        color: "text-red-400",     dot: "bg-red-400",     icon: AlertCircle },
  retry_scheduled:    { label: "Retry",         color: "text-orange-400",  dot: "bg-orange-400",  icon: RefreshCw },
};

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  WINNER:        { label: "WINNER",        color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  TESTING:       { label: "TESTING",       color: "text-blue-400",    bg: "bg-blue-500/15 border-blue-500/30" },
  NEEDS_LISTING: { label: "NEEDS LISTING", color: "text-yellow-400",  bg: "bg-yellow-500/15 border-yellow-500/30" },
  NEEDS_UPLOAD:  { label: "NEEDS UPLOAD",  color: "text-orange-400",  bg: "bg-orange-500/15 border-orange-500/30" },
};

const HEALTH_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  GREEN: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle, label: "HEALTHY" },
  AMBER: { color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  icon: AlertTriangle, label: "ATTENTION" },
  RED:   { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     icon: AlertCircle, label: "CRITICAL" },
};

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PRIMARY:   { label: "PRIMARY",   color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  SECONDARY: { label: "SECONDARY", color: "text-yellow-400",  bg: "bg-yellow-500/15 border-yellow-500/30" },
  BLOCKED:   { label: "BLOCKED",   color: "text-slate-500",   bg: "bg-slate-500/10 border-slate-500/20" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrganismHealthBanner({ snapshot }: { snapshot: any }) {
  const health = snapshot?.health_state || "AMBER";
  const cfg = HEALTH_CONFIG[health];
  const HealthIcon = cfg.icon;

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <HealthIcon className={`h-6 w-6 ${cfg.color} flex-shrink-0`} />
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold tracking-widest ${cfg.color}`}>ORGANISM {cfg.label}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">jetfighter1_pod</span>
            </div>
            <p className="text-sm text-white mt-0.5 font-medium">{snapshot?.next_recommended_action}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-500">Coverage</p>
          <p className={`text-xl font-bold ${cfg.color}`}>
            {snapshot?.signals?.designs?.coverage_percent ?? 0}%
          </p>
        </div>
      </div>

      {/* Checks row */}
      {snapshot?.checks && (
        <div className="flex flex-wrap gap-2 mt-3">
          {snapshot.checks.map((check: any) => {
            const checkColor = check.ok ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : check.severity === "red" ? "text-red-400 bg-red-500/10 border-red-500/20"
              : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
            return (
              <div key={check.name} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${checkColor}`}>
                {check.ok
                  ? <CheckCircle className="h-3 w-3" />
                  : check.severity === "red" ? <AlertCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />
                }
                <span>{check.detail}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlatformPriorityRow({ groups }: { groups: any[] }) {
  if (!groups?.length) return null;

  const primary = groups.filter((g: any) => g.tier === "PRIMARY");
  const secondary = groups.filter((g: any) => g.tier === "SECONDARY");

  return (
    <div className="space-y-3">
      {/* Primary platforms */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold tracking-widest text-emerald-400">PRIMARY PLATFORMS</span>
          <span className="text-xs text-slate-500">— unlimited uploads, no tier gate</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {primary.map((g: any) => {
            const label = PLATFORM_LABELS[g.key];
            const healthCfg = HEALTH_CONFIG[g.health] || HEALTH_CONFIG.AMBER;
            const HealthIcon = healthCfg.icon;
            return (
              <div key={g.key} className={`rounded-lg border p-3 ${label.bg} ${label.border}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${label.color}`}>{g.platform}</span>
                  <HealthIcon className={`h-3.5 w-3.5 ${healthCfg.color}`} />
                </div>
                <div className="flex gap-3 text-xs mb-2">
                  <span className="text-emerald-400 font-semibold">{g.live_count} live</span>
                  <span className="text-slate-400">{g.queued_count} queued</span>
                </div>
                <p className="text-xs text-slate-400 leading-tight">{g.action}</p>
                {g.store_url && (
                  <a href={g.store_url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-1 text-xs ${label.color} hover:opacity-80 mt-2`}>
                    <ExternalLink className="h-3 w-3" />View store
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary platforms */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold tracking-widest text-yellow-400">SECONDARY PLATFORMS</span>
          <span className="text-xs text-slate-500">— tier-gated or setup required</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {secondary.map((g: any) => {
            const label = PLATFORM_LABELS[g.key];
            const healthCfg = HEALTH_CONFIG[g.health] || HEALTH_CONFIG.AMBER;
            const HealthIcon = healthCfg.icon;
            return (
              <div key={g.key} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${label?.color || "text-slate-300"}`}>{g.platform}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">
                      {g.tier}
                    </span>
                    <HealthIcon className={`h-3.5 w-3.5 ${healthCfg.color}`} />
                  </div>
                </div>
                <div className="flex gap-3 text-xs mb-1">
                  <span className="text-emerald-400 font-semibold">{g.live_count} live</span>
                  <span className="text-slate-400">{g.queued_count} queued</span>
                  <span className="text-slate-500">{g.total_capacity}</span>
                </div>
                <p className="text-xs text-slate-400 leading-tight">{g.constraint}</p>
                <p className="text-xs text-white mt-1">{g.action}</p>
                {g.store_url && (
                  <a href={g.store_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mt-2">
                    <ExternalLink className="h-3 w-3" />View store
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DesignCard({
  design,
  onGenerateListing,
  onMarkLive,
  isGenerating,
}: {
  design: any;
  onGenerateListing: (id: string) => void;
  onMarkLive: (designId: string, platform: string) => void;
  isGenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  const verdict = design.organism_verdict || "NEEDS_LISTING";
  const verdictCfg = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.NEEDS_LISTING;

  // Sort platforms: PRIMARY first, then SECONDARY
  const sortedPlatforms = [...(design.platform_status || [])].sort((a: any, b: any) => {
    const order = { PRIMARY: 0, SECONDARY: 1, BLOCKED: 2 };
    return (order[a.priority_tier as keyof typeof order] ?? 2) - (order[b.priority_tier as keyof typeof order] ?? 2);
  });

  function copyListing(platform: string) {
    if (!design.listing_title) return;
    navigator.clipboard.writeText(design.listing_title);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white text-sm truncate">{design.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${verdictCfg.bg} ${verdictCfg.color}`}>
                {verdictCfg.label}
              </span>
              {design.signal_weight >= 1.5 && (
                <span className="text-xs text-pink-400 flex items-center gap-0.5">
                  <Heart className="h-3 w-3" />Proven
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {design.aircraft} · Signal {design.signal_weight?.toFixed(1)}
              {design.listing_confidence && ` · AI ${Math.round(design.listing_confidence * 100)}% confidence`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!design.has_listing ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 gap-1"
                onClick={() => onGenerateListing(design.id)}
                disabled={isGenerating}
              >
                {isGenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                Generate Listings
              </Button>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                AI Ready
              </Badge>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Next action */}
        <p className="text-xs text-slate-400 mb-3 bg-slate-800/50 px-2 py-1.5 rounded border border-slate-700/50">
          <span className="text-white font-medium">Next: </span>{design.next_action}
        </p>

        {/* Platform status grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {sortedPlatforms.map((p: any) => {
            const label = PLATFORM_LABELS[p.platform_key] || { name: p.platform, color: "text-slate-300", bg: "bg-slate-800", border: "border-slate-700" };
            const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.queued;
            const StatusIcon = statusCfg.icon;
            const isPrimary = p.priority_tier === "PRIMARY";

            return (
              <div
                key={p.platform_key}
                className={`rounded-lg border p-2 relative ${label.bg} ${label.border} ${!isPrimary ? "opacity-70" : ""}`}
              >
                {isPrimary && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" title="Primary platform" />
                )}
                <p className={`text-xs font-semibold ${label.color} mb-1 leading-tight`}>{label.name}</p>
                <div className={`flex items-center gap-1 ${statusCfg.color}`}>
                  <StatusIcon className={`h-3 w-3 ${p.status === "generating_listing" || p.status === "uploading" ? "animate-spin" : ""}`} />
                  <span className="text-xs">{statusCfg.label}</span>
                </div>
                {p.status === "listing_ready" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-5 px-1 mt-1 text-emerald-400 hover:text-emerald-300 w-full justify-start"
                    onClick={() => onMarkLive(design.id, p.platform_key)}
                  >
                    Mark Live
                  </Button>
                )}
                {p.listing_url && (
                  <a
                    href={p.listing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs ${label.color} hover:opacity-80 flex items-center gap-0.5 mt-1`}
                  >
                    <ExternalLink className="h-2.5 w-2.5" />View
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Expanded: AI listing detail */}
        {expanded && design.has_listing && (
          <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">AI Master Title</p>
                <p className="text-sm text-white font-medium">{design.listing_title}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-slate-400 hover:text-white gap-1 flex-shrink-0"
                onClick={() => copyListing("master")}
              >
                <Copy className="h-3 w-3" />
                {copiedPlatform === "master" ? "Copied!" : "Copy"}
              </Button>
            </div>
            {design.listing_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {design.listing_tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AmazonQueueCard({ queue }: { queue: any }) {
  if (!queue) return null;
  const slotsUsedPct = Math.round((queue.slots_used / queue.slots_total) * 100);
  const isFull = queue.slots_remaining === 0;

  return (
    <div className={`rounded-xl border p-4 ${isFull ? "bg-yellow-500/5 border-yellow-500/20" : "bg-slate-900 border-slate-800"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-orange-400 font-bold text-sm">Amazon Merch</span>
          <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">
            Tier {queue.tier}
          </span>
        </div>
        <TrendingUp className="h-4 w-4 text-orange-400" />
      </div>

      {/* Slot bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Design slots</span>
          <span className={isFull ? "text-yellow-400 font-semibold" : "text-white"}>
            {queue.slots_used} / {queue.slots_total} used
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFull ? "bg-yellow-500" : "bg-orange-500"}`}
            style={{ width: `${slotsUsedPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-500">Awaiting slots</p>
          <p className="text-white font-semibold">{queue.designs_awaiting_amazon} designs</p>
        </div>
        <div>
          <p className="text-slate-500">Days to clear queue</p>
          <p className="text-white font-semibold">{queue.days_to_clear_queue}d at 1/day</p>
        </div>
        <div>
          <p className="text-slate-500">Tier target</p>
          <p className="text-white font-semibold">Tier {queue.tier_target} (25 slots)</p>
        </div>
        <div>
          <p className="text-slate-500">Unlock requires</p>
          <p className="text-white font-semibold">10 organic sales</p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3 leading-relaxed">{queue.next_action}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PODUploadEngine() {
  const queryClient = useQueryClient();
  const [newDesignName, setNewDesignName] = useState("");
  const [newAircraft, setNewAircraft] = useState("");
  const [activeTab, setActiveTab] = useState("gallery");

  // Organism state (full snapshot)
  const { data: organism, isLoading: organismLoading } = trpc.podOrganism.getState.useQuery(undefined, {
    refetchInterval: 15000,
  });

  // Engine state (for activity log and platform config)
  const { data: engineState } = trpc.podUpload.getEngineState.useQuery(undefined, {
    refetchInterval: 15000,
  });

  // Mutations
  const addDesign = trpc.podUpload.addDesign.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["podUpload"]] });
      queryClient.invalidateQueries({ queryKey: [["podOrganism"]] });
      setNewDesignName("");
      setNewAircraft("");
      toast.success("Design added — AI will generate listings automatically.");
    },
    onError: (err) => toast.error(err.message),
  });

  const generateListing = trpc.podUpload.generateListing.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["podUpload"]] });
      queryClient.invalidateQueries({ queryKey: [["podOrganism"]] });
      toast.success("AI listings generated for all platforms.");
    },
    onError: (err) => toast.error(`Listing generation failed: ${err.message}`),
  });

  const runBatch = trpc.podUpload.runAutonomousBatch.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["podUpload"]] });
      queryClient.invalidateQueries({ queryKey: [["podOrganism"]] });
      toast.success(`Batch complete — ${data.processed} designs processed.`);
    },
    onError: (err) => toast.error(err.message),
  });

  const markLive = trpc.podUpload.markAsLive.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["podUpload"]] });
      queryClient.invalidateQueries({ queryKey: [["podOrganism"]] });
      toast.success("Platform status updated to LIVE.");
    },
    onError: (err) => toast.error(err.message),
  });

  const gallery = organism?.design_gallery || [];
  const platformGroups = organism?.platform_priority || [];
  const activityLog = engineState?.activityLog || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Upload className="h-7 w-7 text-orange-400" />
            Bulk Upload Engine
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">AUTONOMOUS</Badge>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Living organism — every design, every platform, every status. Real signals only.
          </p>
        </div>
        <Button
          onClick={() => runBatch.mutate()}
          disabled={runBatch.isPending}
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
        >
          {runBatch.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Run Autonomous Batch
        </Button>
      </div>

      {/* Organism Health Banner */}
      {!organismLoading && organism && (
        <OrganismHealthBanner snapshot={organism} />
      )}

      {/* Stats row */}
      {organism && (() => {
        const ds = organism.signals?.designs as any;
        const queuedTotal = ds?.platform_coverage
          ? Object.values(ds.platform_coverage as Record<string, any>).reduce((a: number, c: any) => a + (c.queued || 0), 0)
          : 0;
        const stats = [
          { label: "Designs",      value: ds?.total_designs ?? 0,      color: "text-white" },
          { label: "Live Listings",value: ds?.total_live_listings ?? 0, color: "text-emerald-400" },
          { label: "Queued",       value: queuedTotal,                  color: "text-yellow-400" },
          { label: "Coverage",     value: `${ds?.coverage_percent ?? 0}%`, color: "text-blue-400" },
          { label: "Amazon Slots", value: `${organism.amazon_queue?.slots_used ?? 0}/${organism.amazon_queue?.slots_total ?? 10}`, color: "text-orange-400" },
        ];
        return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.map(stat => (
            <Card key={stat.label} className="bg-slate-900 border-slate-800">
              <CardContent className="p-3">
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        );
      })()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="gallery">Design Gallery</TabsTrigger>
          <TabsTrigger value="platforms">Platform Status</TabsTrigger>
          <TabsTrigger value="add">Add Design</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        {/* ── Design Gallery ── */}
        <TabsContent value="gallery" className="space-y-3 mt-4">
          {organismLoading ? (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading organism state…
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No designs in the gallery yet. Add your first design.
            </div>
          ) : (
            gallery.map((design: any) => (
              <DesignCard
                key={design.id}
                design={design}
                onGenerateListing={(id) => generateListing.mutate({ designId: id })}
                onMarkLive={(designId, platform) => markLive.mutate({ designId, platform: platform as any })}
                isGenerating={generateListing.isPending}
              />
            ))
          )}
        </TabsContent>

        {/* ── Platform Status ── */}
        <TabsContent value="platforms" className="space-y-4 mt-4">
          <PlatformPriorityRow groups={platformGroups} />
          <AmazonQueueCard queue={organism?.amazon_queue} />
        </TabsContent>

        {/* ── Add Design ── */}
        <TabsContent value="add" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Add Design to Gallery</CardTitle>
              <p className="text-slate-400 text-sm">
                Enter the design name and aircraft. The organism generates all listings automatically for all platforms.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">Design Name</Label>
                <Input
                  value={newDesignName}
                  onChange={(e) => setNewDesignName(e.target.value)}
                  placeholder="e.g. F-15 Strike Eagle Military Aviation Combat Aircraft"
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
                Add to Gallery — Organism Handles Everything Else
              </Button>
              <p className="text-xs text-slate-500 text-center">
                After adding, click "Run Autonomous Batch" to generate listings and dispatch to all platforms.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Activity Log ── */}
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
                  <p className="text-slate-400 text-sm text-center py-4">
                    No activity yet. Run the autonomous batch to start.
                  </p>
                ) : (
                  activityLog.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
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
      </Tabs>
    </div>
  );
}
