/**
 * Social Accounts Management Page
 * 
 * Connect and manage multiple accounts across all social platforms.
 * Supports: Facebook, Instagram, LinkedIn, TikTok, X/Twitter, YouTube, Pinterest, Threads
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Send,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// Platform icons
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.333-3.022.812-.672 1.927-1.09 3.22-1.208.929-.085 1.785-.036 2.55.142-.087-.627-.262-1.136-.527-1.514-.375-.535-.966-.81-1.755-.82h-.028c-.627.005-1.14.162-1.59.49l-1.12-1.69c.702-.497 1.59-.772 2.66-.822h.045c1.503.022 2.65.542 3.41 1.547.67.885 1.036 2.074 1.09 3.536l.003.168c1.12.57 2.005 1.39 2.543 2.39.745 1.382.88 3.108.38 4.871-.58 2.043-1.833 3.703-3.725 4.94-1.678 1.095-3.805 1.678-6.323 1.733zm.603-7.39c-.296 0-.596.016-.896.05-.94.087-1.67.34-2.168.752-.465.385-.685.857-.655 1.406.03.54.288.987.768 1.33.528.377 1.236.558 2.106.538 1.07-.058 1.9-.455 2.468-1.18.46-.588.77-1.406.92-2.428-.64-.302-1.462-.468-2.543-.468z"/>
  </svg>
);

interface PlatformConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  oauthSupported: boolean;
  sendToPhone: boolean;
}

interface ConnectedAccount {
  id: string;
  platform: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  connectedAt: Date;
  expiresAt?: Date;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook className="w-5 h-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Connect Facebook Pages to post updates, images, and videos",
    oauthSupported: true,
    sendToPhone: false,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="w-5 h-5" />,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    description: "Connect Instagram Business accounts for posts and reels",
    oauthSupported: true,
    sendToPhone: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
    description: "Connect personal profiles and company pages",
    oauthSupported: true,
    sendToPhone: false,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <TikTokIcon className="w-5 h-5" />,
    color: "text-foreground",
    bgColor: "bg-foreground/10",
    description: "Generate content and send to phone for posting",
    oauthSupported: false,
    sendToPhone: true,
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: <Twitter className="w-5 h-5" />,
    color: "text-foreground",
    bgColor: "bg-foreground/10",
    description: "Post tweets, threads, and media to X",
    oauthSupported: true,
    sendToPhone: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: <Youtube className="w-5 h-5" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    description: "Upload Shorts and videos to YouTube channels",
    oauthSupported: true,
    sendToPhone: true,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: <PinterestIcon className="w-5 h-5" />,
    color: "text-red-600",
    bgColor: "bg-red-600/10",
    description: "Pin images and ideas to boards",
    oauthSupported: true,
    sendToPhone: true,
  },
  {
    id: "threads",
    name: "Threads",
    icon: <ThreadsIcon className="w-5 h-5" />,
    color: "text-foreground",
    bgColor: "bg-foreground/10",
    description: "Post to Threads via Instagram connection",
    oauthSupported: true,
    sendToPhone: true,
  },
];

export default function SocialAccounts() {
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  // Get connected platforms from API
  const { data: connectedAccounts, refetch: refetchAccounts } = trpc.social.getConnectedPlatforms.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

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
      toast.success("Account disconnected");
      refetchAccounts();
    },
    onError: (error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  const handleConnect = (platformId: string) => {
    setConnectingPlatform(platformId);
    const redirectUri = `${window.location.origin}/api/oauth/${platformId === "linkedin" ? "linkedin" : "meta"}/callback`;

    if (platformId === "facebook" || platformId === "instagram") {
      connectMetaMutation.mutate({ redirectUri });
    } else if (platformId === "linkedin") {
      connectLinkedInMutation.mutate({ redirectUri });
    } else if (platformId === "tiktok") {
      toast.info("TikTok uses send-to-phone workflow. Go to the TikTok page to generate content.");
      setConnectingPlatform(null);
    } else if (platformId === "twitter") {
      toast.info("X/Twitter integration coming soon! Use send-to-phone for now.");
      setConnectingPlatform(null);
    } else if (platformId === "youtube") {
      toast.info("YouTube integration coming soon! Use send-to-phone for now.");
      setConnectingPlatform(null);
    } else if (platformId === "pinterest") {
      toast.info("Pinterest integration coming soon! Use send-to-phone for now.");
      setConnectingPlatform(null);
    } else if (platformId === "threads") {
      toast.info("Threads posts through Instagram. Connect Instagram first.");
      setConnectingPlatform(null);
    } else {
      toast.info("This platform integration is coming soon!");
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = (platformId: string, accountId?: string) => {
    if (confirm(`Are you sure you want to disconnect this account?`)) {
      const platform = platformId as "facebook" | "instagram" | "linkedin" | "tiktok";
      disconnectMutation.mutate({ platform });
    }
  };

  const getAccountsForPlatform = (platformId: string) => {
    if (!connectedAccounts) return [];
    return connectedAccounts.filter(acc => acc.platform === platformId);
  };

  const getTotalConnectedAccounts = () => {
    if (!connectedAccounts) return 0;
    return connectedAccounts.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Social Accounts
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect and manage multiple accounts across all platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {getTotalConnectedAccounts()} accounts connected
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAccounts()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-foreground">{getTotalConnectedAccounts()}</div>
          <div className="text-sm text-muted-foreground">Total Accounts</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-green-400">
            {connectedAccounts?.filter(a => !a.needsRefresh).length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-yellow-400">
            {connectedAccounts?.filter(a => a.needsRefresh).length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Need Refresh</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-2xl font-bold text-foreground">{PLATFORMS.length}</div>
          <div className="text-sm text-muted-foreground">Platforms Available</div>
        </Card>
      </div>

      {/* Platform Cards */}
      <div className="grid gap-4">
        {PLATFORMS.map((platform) => {
          const accounts = getAccountsForPlatform(platform.id);
          const isExpanded = expandedPlatform === platform.id;

          return (
            <Card key={platform.id} className="bg-card border-border overflow-hidden">
              {/* Platform Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${platform.bgColor}`}>
                    <div className={platform.color}>{platform.icon}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {platform.name}
                      {accounts.length > 0 && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {accounts.length} connected
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{platform.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {platform.sendToPhone && (
                    <Badge variant="outline" className="text-xs">
                      <Send className="w-3 h-3 mr-1" />
                      Send to Phone
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnect(platform.id);
                    }}
                    disabled={connectingPlatform === platform.id}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {connectingPlatform === platform.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Account
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Connected Accounts (Expanded) */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/30 p-4">
                  {accounts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No {platform.name} accounts connected yet</p>
                      <p className="text-sm">Click "Add Account" to connect your first account</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {accounts.map((account, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${platform.bgColor}`}>
                              <div className={platform.color}>{platform.icon}</div>
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{account.pageName}</div>
                              <div className="text-xs text-muted-foreground">
                                ID: {account.pageId}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {account.needsRefresh ? (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Needs Refresh
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Post to this account</span>
                              <Switch defaultChecked />
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleDisconnect(platform.id, account.pageId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">How Multi-Account Posting Works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-background border border-border">
            <div className="text-2xl mb-2">1️⃣</div>
            <div className="font-medium text-foreground">Connect Accounts</div>
            <div className="text-sm text-muted-foreground">
              Click "Add Account" to connect as many accounts as you want per platform
            </div>
          </div>
          <div className="p-4 rounded-lg bg-background border border-border">
            <div className="text-2xl mb-2">2️⃣</div>
            <div className="font-medium text-foreground">Select Active Accounts</div>
            <div className="text-sm text-muted-foreground">
              Toggle which accounts should receive posts when you publish content
            </div>
          </div>
          <div className="p-4 rounded-lg bg-background border border-border">
            <div className="text-2xl mb-2">3️⃣</div>
            <div className="font-medium text-foreground">Post Everywhere</div>
            <div className="text-sm text-muted-foreground">
              Create content once and it automatically posts to all selected accounts
            </div>
          </div>
        </div>
      </Card>

      {/* Platform Status */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Platform Integration Status</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {PLATFORMS.map((platform) => (
            <div key={platform.id} className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div className="flex items-center gap-2">
                <div className={platform.color}>{platform.icon}</div>
                <span className="text-foreground">{platform.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {platform.oauthSupported ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    OAuth Ready
                  </Badge>
                ) : (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Send to Phone
                  </Badge>
                )}
                {platform.sendToPhone && platform.oauthSupported && (
                  <Badge variant="outline" className="text-xs">
                    + Manual
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
