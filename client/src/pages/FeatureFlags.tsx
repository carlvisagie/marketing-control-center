/**
 * Feature Flags Management Page
 * 
 * Control Center for managing Just Talk feature flags.
 * Enable/disable features, set rollout percentages, and test safely.
 * 
 * NOTE: This page will show real flags when connected to the Just Talk API.
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Flag,
  Shield,
  Zap,
  Brain,
  CreditCard,
  Bug,
  FlaskConical,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

// Feature flag interface matching the database schema
interface FeatureFlag {
  id: string;
  flagName: string;
  description: string | null;
  enabled: boolean;
  rolloutPercentage: number;
  targetUserIds: string[] | null;
  targetRoles: string[] | null;
  environments: string[] | null;
  lastModifiedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Get icon for flag type
function getFlagIcon(flagName: string) {
  if (flagName.includes("guardrail") || flagName.includes("safety") || flagName.includes("crisis")) {
    return <Shield className="w-5 h-5 text-green-400" />;
  }
  if (flagName.includes("ai") || flagName.includes("prompt")) {
    return <Brain className="w-5 h-5 text-purple-400" />;
  }
  if (flagName.includes("payment") || flagName.includes("stripe")) {
    return <CreditCard className="w-5 h-5 text-blue-400" />;
  }
  if (flagName.includes("debug") || flagName.includes("beta")) {
    return <FlaskConical className="w-5 h-5 text-orange-400" />;
  }
  if (flagName.includes("voice")) {
    return <Zap className="w-5 h-5 text-yellow-400" />;
  }
  return <Flag className="w-5 h-5 text-primary" />;
}

// Get category for flag
function getFlagCategory(flagName: string): string {
  if (flagName.includes("guardrail") || flagName.includes("safety") || flagName.includes("crisis")) {
    return "Safety";
  }
  if (flagName.includes("ai") || flagName.includes("prompt")) {
    return "AI";
  }
  if (flagName.includes("payment") || flagName.includes("stripe")) {
    return "Payment";
  }
  if (flagName.includes("debug") || flagName.includes("beta")) {
    return "Development";
  }
  if (flagName.includes("voice")) {
    return "Voice";
  }
  return "General";
}

export default function FeatureFlags() {
  // Start with empty array - real flags will come from the Just Talk API
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<FeatureFlag>>>(new Map());

  // Refresh flags from server
  const refreshFlags = async () => {
    setLoading(true);
    toast.info("Refreshing feature flags...");
    // In production, this would fetch from the Just Talk API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast.info("Connect to Just Talk API to load feature flags");
  };

  // Toggle flag enabled state
  const toggleFlag = (flagName: string, enabled: boolean) => {
    setFlags(prev => prev.map(f => 
      f.flagName === flagName ? { ...f, enabled } : f
    ));
    
    const change = pendingChanges.get(flagName) || {};
    change.enabled = enabled;
    setPendingChanges(new Map(pendingChanges.set(flagName, change)));
    
    toast.info(`${flagName} ${enabled ? 'enabled' : 'disabled'} (pending save)`);
  };

  // Update rollout percentage
  const updateRollout = (flagName: string, percentage: number) => {
    setFlags(prev => prev.map(f => 
      f.flagName === flagName ? { ...f, rolloutPercentage: percentage } : f
    ));
    
    const change = pendingChanges.get(flagName) || {};
    change.rolloutPercentage = percentage;
    setPendingChanges(new Map(pendingChanges.set(flagName, change)));
  };

  // Save all pending changes
  const saveChanges = async () => {
    if (pendingChanges.size === 0) {
      toast.info("No changes to save");
      return;
    }

    setLoading(true);
    toast.info("Saving changes...");
    
    // In production, this would call the Just Talk API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPendingChanges(new Map());
    setLoading(false);
    toast.success(`${pendingChanges.size} flag(s) updated successfully`);
  };

  // Group flags by category
  const groupedFlags = flags.reduce((acc, flag) => {
    const category = getFlagCategory(flag.flagName);
    if (!acc[category]) acc[category] = [];
    acc[category].push(flag);
    return acc;
  }, {} as Record<string, FeatureFlag[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Flag className="w-6 h-6 text-primary" />
            Feature Flags
          </h1>
          <p className="text-muted-foreground mt-1">
            Control Just Talk features remotely
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingChanges.size > 0 && (
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
              {pendingChanges.size} unsaved changes
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshFlags}
            disabled={loading}
            className="border-border"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={saveChanges}
            disabled={loading || pendingChanges.size === 0}
            className="bg-primary"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-foreground font-mono">{flags.length}</div>
          <div className="text-xs text-muted-foreground">Total Flags</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-green-400 font-mono">
            {flags.filter(f => f.enabled).length}
          </div>
          <div className="text-xs text-muted-foreground">Enabled</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-yellow-400 font-mono">
            {flags.filter(f => !f.enabled).length}
          </div>
          <div className="text-xs text-muted-foreground">Disabled</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {flags.filter(f => f.rolloutPercentage > 0 && f.rolloutPercentage < 100).length}
          </div>
          <div className="text-xs text-muted-foreground">Partial Rollout</div>
        </Card>
      </div>

      {/* Empty State or Flag Groups */}
      {flags.length === 0 ? (
        <Card className="p-12 bg-card border-border text-center">
          <Inbox className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Feature Flags</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Connect to the Just Talk API to manage feature flags remotely.
            Feature flags allow you to enable/disable features without deploying code.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={refreshFlags}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Connect to Just Talk
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
            <Card key={category} className="p-4 bg-card border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                {category === "Safety" && <Shield className="w-5 h-5 text-green-400" />}
                {category === "AI" && <Brain className="w-5 h-5 text-purple-400" />}
                {category === "Payment" && <CreditCard className="w-5 h-5 text-blue-400" />}
                {category === "Development" && <FlaskConical className="w-5 h-5 text-orange-400" />}
                {category === "Voice" && <Zap className="w-5 h-5 text-yellow-400" />}
                {category === "General" && <Flag className="w-5 h-5 text-primary" />}
                {category}
              </h2>
              <div className="space-y-4">
                {categoryFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className="p-4 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getFlagIcon(flag.flagName)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{flag.flagName}</h3>
                            {pendingChanges.has(flag.flagName) && (
                              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                                Modified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {flag.description || "No description"}
                          </p>
                          {flag.environments && (
                            <div className="flex gap-1 mt-2">
                              {flag.environments.map((env) => (
                                <Badge key={env} variant="outline" className="text-xs">
                                  {env}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Rollout Slider */}
                        <div className="w-32">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Rollout</span>
                            <span>{flag.rolloutPercentage}%</span>
                          </div>
                          <Slider
                            value={[flag.rolloutPercentage]}
                            onValueChange={([value]) => updateRollout(flag.flagName, value)}
                            max={100}
                            step={5}
                            disabled={!flag.enabled}
                            className="w-full"
                          />
                        </div>
                        {/* Toggle Switch */}
                        <Switch
                          checked={flag.enabled}
                          onCheckedChange={(checked) => toggleFlag(flag.flagName, checked)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
