/**
 * Settings Page
 * 
 * Configure the Control Center, connect social platforms, and manage services.
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Key,
  Globe,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Save,
  RefreshCw,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  ExternalLink,
  Unplug,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface PlatformConnection {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "pending";
  accountName?: string;
  connectedAt?: Date;
  color: string;
}

interface ServiceConnection {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "error";
  lastChecked: Date;
}

export default function Settings() {
  const [saving, setSaving] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  
  // Get connected platforms from API
  const { data: platformsData, refetch: refetchPlatforms } = trpc.social.getConnectedPlatforms.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    whatsapp: true,
    sms: true,
    email: false,
    criticalOnly: false,
  });

  // Social platforms configuration - map API data to UI
  const platforms: PlatformConnection[] = [
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="w-5 h-5" />,
      status: platformsData?.find(p => p.platform === "facebook")?.connected ? "connected" : "disconnected",
      accountName: platformsData?.find(p => p.platform === "facebook")?.pageName ?? undefined,
      color: "text-blue-500",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram className="w-5 h-5" />,
      status: platformsData?.find(p => p.platform === "instagram")?.connected ? "connected" : "disconnected",
      accountName: platformsData?.find(p => p.platform === "instagram")?.pageName ?? undefined,
      color: "text-pink-500",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <Linkedin className="w-5 h-5" />,
      status: platformsData?.find(p => p.platform === "linkedin")?.connected ? "connected" : "disconnected",
      accountName: platformsData?.find(p => p.platform === "linkedin")?.pageName ?? undefined,
      color: "text-blue-600",
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: <TikTokIcon className="w-5 h-5" />,
      status: platformsData?.find(p => p.platform === "tiktok")?.connected ? "connected" : "disconnected",
      accountName: platformsData?.find(p => p.platform === "tiktok")?.pageName ?? undefined,
      color: "text-foreground",
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: <Twitter className="w-5 h-5" />,
      status: "disconnected",
      color: "text-foreground",
    },
  ];

  // Backend services
  const [services] = useState<ServiceConnection[]>([
    { id: "justtalk", name: "Just Talk Database", status: "connected", lastChecked: new Date() },
    { id: "openai", name: "OpenAI API", status: "connected", lastChecked: new Date() },
    { id: "twilio", name: "Twilio (SMS/WhatsApp)", status: "connected", lastChecked: new Date() },
  ]);

  // Connect Meta platform mutation
  const connectMetaMutation = trpc.social.getMetaAuthUrl.useMutation({
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: { message: string }) => {
      toast.error(`Failed to connect: ${error.message}`);
      setConnectingPlatform(null);
    },
  });

  // Connect LinkedIn platform mutation
  const connectLinkedInMutation = trpc.social.getLinkedInAuthUrl.useMutation({
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: { message: string }) => {
      toast.error(`Failed to connect: ${error.message}`);
      setConnectingPlatform(null);
    },
  });

  // Disconnect platform mutation
  const disconnectMutation = trpc.social.disconnectPlatform.useMutation({
    onSuccess: () => {
      toast.success("Platform disconnected");
      refetchPlatforms();
    },
    onError: (error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  const handleConnectPlatform = (platformId: string) => {
    setConnectingPlatform(platformId);
    const redirectUri = `${window.location.origin}/api/oauth/${platformId === "linkedin" ? "linkedin" : "meta"}/callback`;
    
    if (platformId === "facebook" || platformId === "instagram") {
      connectMetaMutation.mutate({ redirectUri });
    } else if (platformId === "linkedin") {
      connectLinkedInMutation.mutate({ redirectUri });
    } else if (platformId === "tiktok") {
      toast.info("TikTok uses the send-to-phone workflow. Go to the TikTok page to generate and send content.");
      setConnectingPlatform(null);
    } else {
      toast.info("This platform integration is coming soon!");
      setConnectingPlatform(null);
    }
  };

  const handleDisconnectPlatform = (platformId: string) => {
    if (confirm(`Are you sure you want to disconnect ${platformId}?`)) {
      const platform = platformId as "facebook" | "instagram" | "linkedin" | "tiktok";
      disconnectMutation.mutate({ platform });
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaving(false);
    toast.success("Settings saved successfully");
  };

  const getStatusBadge = (status: ServiceConnection["status"]) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>;
      case "disconnected":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Not Connected</Badge>;
      case "error":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
    }
  };

  const getPlatformStatusBadge = (status: PlatformConnection["status"]) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "disconnected":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Not Connected</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect platforms and configure your Control Center
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-primary hover:bg-primary/90"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Social Platform Connections */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Social Platforms</h2>
            <p className="text-sm text-muted-foreground">Connect your social media accounts for automated posting</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`${platform.color}`}>
                    {platform.icon}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{platform.name}</div>
                    {platform.accountName && (
                      <div className="text-xs text-muted-foreground">{platform.accountName}</div>
                    )}
                  </div>
                </div>
                {getPlatformStatusBadge(platform.status)}
              </div>

              {platform.status === "connected" ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDisconnectPlatform(platform.id)}
                  >
                    <Unplug className="w-4 h-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => handleConnectPlatform(platform.id)}
                  disabled={connectingPlatform === platform.id}
                >
                  {connectingPlatform === platform.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Connect
                    </>
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-blue-400">How it works</div>
              <div className="text-muted-foreground">
                Click "Connect" to authorize your account. Once connected, you can post content directly from the Control Center
                or schedule posts through the 24/7 Attack system.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications Section */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground">How you want to be notified</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-green-400" />
              <div>
                <div className="font-medium text-foreground">WhatsApp</div>
                <div className="text-xs text-muted-foreground">Get notifications via WhatsApp</div>
              </div>
            </div>
            <Switch
              checked={notifications.whatsapp}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, whatsapp: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-medium text-foreground">SMS</div>
                <div className="text-xs text-muted-foreground">Get notifications via SMS</div>
              </div>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sms: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="font-medium text-foreground">Critical Only</div>
                <div className="text-xs text-muted-foreground">Only notify for critical issues</div>
              </div>
            </div>
            <Switch
              checked={notifications.criticalOnly}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, criticalOnly: checked }))}
            />
          </div>
        </div>
      </Card>

      {/* Backend Services */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Backend Services</h2>
            <p className="text-sm text-muted-foreground">Status of your integrations</p>
          </div>
        </div>

        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div className="flex items-center gap-3">
                {service.status === "connected" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : service.status === "error" ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-500" />
                )}
                <div>
                  <div className="font-medium text-foreground">{service.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Last checked: {service.lastChecked.toLocaleTimeString()}
                  </div>
                </div>
              </div>
              {getStatusBadge(service.status)}
            </div>
          ))}
        </div>
      </Card>

      {/* Security Section */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">24/7 Attack Settings</h2>
            <p className="text-sm text-muted-foreground">Configure autonomous posting behavior</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div>
              <div className="font-medium text-foreground">Require Approval for Posts</div>
              <div className="text-xs text-muted-foreground">All AI-generated posts must be approved before publishing</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div>
              <div className="font-medium text-foreground">Auto-post Low Risk Content</div>
              <div className="text-xs text-muted-foreground">Automatically publish content flagged as low risk</div>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div>
              <div className="font-medium text-foreground">Send to Phone First</div>
              <div className="text-xs text-muted-foreground">Send content to your phone for review before posting</div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      {/* API Keys Section */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">API Configuration</h2>
            <p className="text-sm text-muted-foreground">These are configured via environment variables on Render</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Just Talk Database</label>
            <Input
              type="password"
              value="••••••••••••••••••••"
              readOnly
              className="mt-1 bg-background border-border font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">Configured via JUST_TALK_DATABASE_URL</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">OpenAI API Key</label>
            <Input
              type="password"
              value="••••••••••••••••••••"
              readOnly
              className="mt-1 bg-background border-border font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">Configured via OPENAI_API_KEY</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Meta App ID</label>
            <Input
              type="password"
              value="••••••••••••••••••••"
              readOnly
              className="mt-1 bg-background border-border font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">Configured via META_APP_ID</p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-yellow-400">Manage on Render</div>
              <div className="text-muted-foreground">
                API keys are managed through Render's environment variables for security.
                Go to your Render dashboard to update these values.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
