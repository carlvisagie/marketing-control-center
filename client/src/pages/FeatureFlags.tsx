/**
 * Feature Flags Management Page
 * 
 * Control Center for managing Just Talk feature flags.
 * Enable/disable features, set rollout percentages, and test safely.
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

// Mock data - in production this would come from the Just Talk API
const mockFlags: FeatureFlag[] = [
  {
    id: "flag_enhanced_guardrails_1",
    flagName: "enhanced_guardrails",
    description: "Enable enhanced safety guardrails",
    enabled: true,
    rolloutPercentage: 100,
    targetUserIds: null,
    targetRoles: null,
    environments: ["production"],
    lastModifiedBy: "system",
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T00:00:00Z",
  },
  {
    id: "flag_new_ai_model_1",
    flagName: "new_ai_model",
    description: "Use newer AI model for conversations",
    enabled: false,
    rolloutPercentage: 0,
    targetUserIds: null,
    targetRoles: null,
    environments: ["production"],
    lastModifiedBy: null,
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T00:00:00Z",
  },
  {
    id: "flag_enhanced_prompts_1",
    flagName: "enhanced_prompts",
    description: "Use enhanced system prompts",
    enabled: false,
    rolloutPercentage: 0,
    targetUserIds: null,
    targetRoles: null,
    environments: ["production"],
    lastModifiedBy: null,
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T00:00:00Z",
  },
  {
    id: "flag_voice_improvements_1",
    flagName: "voice_improvements",
    description: "Enable voice quality improvements",
    enabled: false,
    rolloutPercentage: 0,
    targetUserIds: null,
    targetRoles: null,
    environments: ["production"],
    lastModifiedBy: null,
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T00:00:00Z",
  },
  {
    id: "flag_new_payment_flow_1",
    flagName: "new_payment_flow",
    description: "Use new payment flow",
    enabled: false,
    rolloutPercentage: 0,
    targetUserIds: null,
    targetRoles: null,
    environments: ["production"],
    lastModifiedBy: null,
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T00:00:00Z",
  },
  {
    id: "flag_crisis_detection_v2_1",
    flagName: "crisis_detection_v2",
    description: "Use improved crisis detection",
    enabled: false,
    rolloutPercentage: 0,
    targetUserIds: null,
    targetRoles: null,
    environments: ["production"],
    lastModifiedBy: null,
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T00:00:00Z",
  },
  {
    id: "flag_debug_mode_1",
    flagName: "debug_mode",
    description: "Enable debug logging",
    enabled: false,
    rolloutPercentage: 0,
    targetUserIds: null,
    targetRoles: null,
    environments: ["development"],
    lastModifiedBy: null,
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T00:00:00Z",
  },
  {
    id: "flag_beta_features_1",
    flagName: "beta_features",
    description: "Enable beta features for testing",
    enabled: false,
    rolloutPercentage: 0,
    targetUserIds: null,
    targetRoles: null,
    environments: ["development"],
    lastModifiedBy: null,
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T00:00:00Z",
  },
];

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
  const [flags, setFlags] = useState<FeatureFlag[]>(mockFlags);
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
    toast.success("Feature flags refreshed");
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
    toast.info(`Saving ${pendingChanges.size} changes...`);
    
    // In production, this would call the Just Talk API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setPendingChanges(new Map());
    setLoading(false);
    toast.success("All changes saved successfully!");
  };

  // Group flags by category
  const groupedFlags = flags.reduce((acc, flag) => {
    const category = getFlagCategory(flag.flagName);
    if (!acc[category]) acc[category] = [];
    acc[category].push(flag);
    return acc;
  }, {} as Record<string, FeatureFlag[]>);

  const categoryOrder = ["Safety", "AI", "Voice", "Payment", "Development", "General"];

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
            Control Just Talk features safely with gradual rollouts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingChanges.size > 0 && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-400">
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
            className="bg-primary hover:bg-primary/90"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-foreground font-mono">
            {flags.length}
          </div>
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
            {flags.filter(f => f.enabled && f.rolloutPercentage < 100).length}
          </div>
          <div className="text-xs text-muted-foreground">Partial Rollout</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-red-400 font-mono">
            {flags.filter(f => !f.enabled).length}
          </div>
          <div className="text-xs text-muted-foreground">Disabled</div>
        </Card>
      </div>

      {/* Warning Banner */}
      <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-400">Safe Deployment Strategy</h3>
            <p className="text-sm text-muted-foreground mt-1">
              New features start <strong>disabled</strong>. Test with your phone number first (add to Target Users), 
              then gradually increase rollout percentage: 10% → 25% → 50% → 100%.
              If anything breaks, flip the switch OFF instantly.
            </p>
          </div>
        </div>
      </Card>

      {/* Flag Groups */}
      {categoryOrder.map(category => {
        const categoryFlags = groupedFlags[category];
        if (!categoryFlags || categoryFlags.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {category === "Safety" && <Shield className="w-5 h-5 text-green-400" />}
              {category === "AI" && <Brain className="w-5 h-5 text-purple-400" />}
              {category === "Voice" && <Zap className="w-5 h-5 text-yellow-400" />}
              {category === "Payment" && <CreditCard className="w-5 h-5 text-blue-400" />}
              {category === "Development" && <FlaskConical className="w-5 h-5 text-orange-400" />}
              {category === "General" && <Flag className="w-5 h-5 text-primary" />}
              {category}
            </h2>

            <div className="grid gap-3">
              {categoryFlags.map(flag => (
                <Card 
                  key={flag.id} 
                  className={`p-4 bg-card border-border transition-all ${
                    pendingChanges.has(flag.flagName) ? 'border-yellow-500/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getFlagIcon(flag.flagName)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-foreground">
                            {flag.flagName}
                          </span>
                          {flag.environments?.includes("development") && (
                            <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                              DEV ONLY
                            </Badge>
                          )}
                          {pendingChanges.has(flag.flagName) && (
                            <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                              MODIFIED
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {flag.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Rollout Percentage */}
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Rollout</span>
                          <span className="text-xs font-mono text-foreground">
                            {flag.rolloutPercentage}%
                          </span>
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

                      {/* Enable/Disable Switch */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${flag.enabled ? 'text-green-400' : 'text-muted-foreground'}`}>
                          {flag.enabled ? 'ON' : 'OFF'}
                        </span>
                        <Switch
                          checked={flag.enabled}
                          onCheckedChange={(checked) => toggleFlag(flag.flagName, checked)}
                        />
                      </div>

                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFlag(flag);
                          setIsEditDialogOpen(true);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details (if enabled with partial rollout) */}
                  {flag.enabled && flag.rolloutPercentage < 100 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Gradual rollout active
                        </span>
                        <span>
                          {flag.rolloutPercentage}% of users will see this feature
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFlag && getFlagIcon(selectedFlag.flagName)}
              Edit Feature Flag
            </DialogTitle>
            <DialogDescription>
              Configure advanced settings for this feature flag
            </DialogDescription>
          </DialogHeader>

          {selectedFlag && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground">Flag Name</label>
                <Input
                  value={selectedFlag.flagName}
                  disabled
                  className="mt-1 bg-muted font-mono"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={selectedFlag.description || ""}
                  placeholder="Describe what this flag controls..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Target User IDs</label>
                <p className="text-xs text-muted-foreground mb-1">
                  Comma-separated list of user IDs to test with (e.g., your phone number)
                </p>
                <Input
                  value={selectedFlag.targetUserIds?.join(", ") || ""}
                  placeholder="+1234567890, user_123"
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Environments</label>
                <div className="flex gap-2 mt-1">
                  {["development", "staging", "production"].map(env => (
                    <Badge
                      key={env}
                      variant={selectedFlag.environments?.includes(env) ? "default" : "outline"}
                      className="cursor-pointer"
                    >
                      {env}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setIsEditDialogOpen(false);
              toast.success("Flag settings updated (pending save)");
            }}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
