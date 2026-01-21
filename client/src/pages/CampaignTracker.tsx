/**
 * Campaign Tracker
 * 
 * Track marketing KPIs based on Sintra strategy:
 * - Landing page CVR (target ≥5%)
 * - Trial → paid rate (target ≥35%)
 * - Blended CAC (target ≤$45)
 * - D30 retention (target ≥55%)
 * - Annual attach rate (target ≥20%)
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
  trendValue: number;
  description: string;
  isInverse?: boolean; // true if lower is better (like CAC)
}

interface CampaignMetric {
  id: string;
  name: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
  cpc: number;
  cpa: number;
  status: "active" | "paused" | "ended";
}

export default function CampaignTracker() {
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  // Note: Real metrics will come from Just Talk database via reporting router
  // For now, we use placeholder values that will be populated when campaigns are active
  const justTalkMetrics = {
    totalVisitors: 0,
    totalTrials: 0,
    totalPaidSubscribers: 0,
    totalAdSpend: 0,
    retainedUsers30d: 0,
    annualSubscribers: 0,
  };

  // Calculate KPIs from real data
  const calculateKPIs = (): KPIMetric[] => {
    const metrics = justTalkMetrics;
    
    // Default values if no data
    const totalVisitors = metrics?.totalVisitors || 0;
    const totalTrials = metrics?.totalTrials || 0;
    const totalPaidSubscribers = metrics?.totalPaidSubscribers || 0;
    const totalSpend = metrics?.totalAdSpend || 0;
    const retainedUsers30d = metrics?.retainedUsers30d || 0;
    const annualSubscribers = metrics?.annualSubscribers || 0;

    // Calculate rates
    const landingCVR = totalVisitors > 0 ? (totalTrials / totalVisitors) * 100 : 0;
    const trialToPaid = totalTrials > 0 ? (totalPaidSubscribers / totalTrials) * 100 : 0;
    const blendedCAC = totalPaidSubscribers > 0 ? totalSpend / totalPaidSubscribers : 0;
    const d30Retention = totalPaidSubscribers > 0 ? (retainedUsers30d / totalPaidSubscribers) * 100 : 0;
    const annualAttach = totalPaidSubscribers > 0 ? (annualSubscribers / totalPaidSubscribers) * 100 : 0;

    return [
      {
        id: "landing-cvr",
        name: "Landing Page CVR",
        value: landingCVR,
        target: 5,
        unit: "%",
        trend: landingCVR >= 5 ? "up" : "down",
        trendValue: landingCVR - 5,
        description: "Visitor → Trial conversion rate",
      },
      {
        id: "trial-to-paid",
        name: "Trial → Paid",
        value: trialToPaid,
        target: 35,
        unit: "%",
        trend: trialToPaid >= 35 ? "up" : "down",
        trendValue: trialToPaid - 35,
        description: "Trial users who convert to paid",
      },
      {
        id: "blended-cac",
        name: "Blended CAC",
        value: blendedCAC,
        target: 45,
        unit: "$",
        trend: blendedCAC <= 45 ? "up" : "down",
        trendValue: 45 - blendedCAC,
        description: "Cost to acquire a paid subscriber",
        isInverse: true,
      },
      {
        id: "d30-retention",
        name: "D30 Retention",
        value: d30Retention,
        target: 55,
        unit: "%",
        trend: d30Retention >= 55 ? "up" : "down",
        trendValue: d30Retention - 55,
        description: "Users retained after 30 days",
      },
      {
        id: "annual-attach",
        name: "Annual Attach Rate",
        value: annualAttach,
        target: 20,
        unit: "%",
        trend: annualAttach >= 20 ? "up" : "down",
        trendValue: annualAttach - 20,
        description: "New subs choosing annual plan",
      },
    ];
  };

  const kpis = calculateKPIs();

  // Mock campaign data - will be replaced with real Meta/TikTok API data
  const campaigns: CampaignMetric[] = [
    {
      id: "meta-cold-1",
      name: "Cold Prospecting - 3AM Problem",
      platform: "Meta",
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cvr: 0,
      cpc: 0,
      cpa: 0,
      status: "paused",
    },
    {
      id: "meta-retarget-1",
      name: "Retargeting - 7-day Trial",
      platform: "Meta",
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cvr: 0,
      cpc: 0,
      cpa: 0,
      status: "paused",
    },
    {
      id: "tiktok-organic-1",
      name: "Organic - POV Skits",
      platform: "TikTok",
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cvr: 0,
      cpc: 0,
      cpa: 0,
      status: "paused",
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const getKPIStatus = (kpi: KPIMetric) => {
    const isOnTarget = kpi.isInverse 
      ? kpi.value <= kpi.target 
      : kpi.value >= kpi.target;
    
    if (isOnTarget) {
      return { color: "text-green-400", bg: "bg-green-500/20", icon: CheckCircle2 };
    }
    
    const percentOff = kpi.isInverse
      ? ((kpi.value - kpi.target) / kpi.target) * 100
      : ((kpi.target - kpi.value) / kpi.target) * 100;
    
    if (percentOff > 50) {
      return { color: "text-red-400", bg: "bg-red-500/20", icon: AlertTriangle };
    }
    
    return { color: "text-yellow-400", bg: "bg-yellow-500/20", icon: Info };
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="w-4 h-4 text-green-400" />;
      case "down":
        return <ArrowDownRight className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === "$") {
      return `$${value.toFixed(2)}`;
    }
    return `${value.toFixed(1)}${unit}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Campaign Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Track KPIs and campaign performance against targets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-background rounded-lg border border-border p-1">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  dateRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const status = getKPIStatus(kpi);
          const StatusIcon = status.icon;
          const progressPercent = kpi.isInverse
            ? Math.min(100, (kpi.target / Math.max(kpi.value, 0.01)) * 100)
            : Math.min(100, (kpi.value / kpi.target) * 100);

          return (
            <Card key={kpi.id} className="p-4 bg-card border-border">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${status.bg}`}>
                  <StatusIcon className={`w-4 h-4 ${status.color}`} />
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(kpi.trend)}
                  <span className={`text-xs ${kpi.trend === "up" ? "text-green-400" : kpi.trend === "down" ? "text-red-400" : "text-gray-400"}`}>
                    {kpi.trendValue > 0 ? "+" : ""}{kpi.trendValue.toFixed(1)}
                  </span>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="text-2xl font-bold text-foreground">
                  {formatValue(kpi.value, kpi.unit)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Target: {formatValue(kpi.target, kpi.unit)}
                </div>
              </div>

              <Progress value={progressPercent} className="h-1 mb-2" />
              
              <div className="text-sm font-medium text-foreground">{kpi.name}</div>
              <div className="text-xs text-muted-foreground">{kpi.description}</div>
            </Card>
          );
        })}
      </div>

      {/* Campaign Performance Table */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Campaign Performance</h2>
              <p className="text-sm text-muted-foreground">Active and recent campaigns</p>
            </div>
          </div>
        </div>

        {campaigns.length === 0 || campaigns.every(c => c.spend === 0) ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Active Campaigns</h3>
            <p className="text-muted-foreground mb-4">
              Connect your Meta and TikTok ad accounts to track campaign performance
            </p>
            <Button variant="outline">
              Connect Ad Accounts
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Campaign</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Platform</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Spend</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Impressions</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">CTR</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">CVR</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">CPA</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{campaign.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{campaign.platform}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      ${campaign.spend.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {campaign.impressions.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {campaign.ctr.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {campaign.cvr.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      ${campaign.cpa.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        className={
                          campaign.status === "active"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : campaign.status === "paused"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Strategy Recommendations */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Info className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Strategy Recommendations</h2>
            <p className="text-sm text-muted-foreground">Based on Sintra marketing playbook</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-background border border-border">
            <h3 className="font-medium text-foreground mb-2">Meta Campaign Strategy</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Campaign A: Cold Prospecting (Broad 25-55, US/CA/UK/AU)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Campaign B: Retargeting (7/14/30-day visitors)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Creative angles: "3 AM", "No schedule", "Private", "Cheaper"</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-background border border-border">
            <h3 className="font-medium text-foreground mb-2">TikTok Strategy</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Organic-first: Post daily for 30 days</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>POV skits, mini-scripts, product demos, founder story</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Creator outreach: 20 DMs/day for UGC</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-background border border-border">
            <h3 className="font-medium text-foreground mb-2">Weekly A/B Tests</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Week 1: CTA wording ("Start Now" vs "Talk Now")</span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Week 2: Trial pricing (7-day $7 vs 3-day $3)</span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Week 3: Hero headline ("3 AM" vs "No schedule")</span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Week 4: Trust row ordering</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-background border border-border">
            <h3 className="font-medium text-foreground mb-2">Compliance Reminders</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>No "you are lonely/depressed" language (Meta policy)</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Use general language: "For anyone who wants someone to talk to"</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Include disclaimer: "Not a substitute for professional care"</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
