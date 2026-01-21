/**
 * Settings Page
 * 
 * Configure the Control Center and connected services.
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
  Database,
  Key,
  Globe,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Save,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface ServiceConnection {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "error";
  lastChecked: Date;
}

export default function Settings() {
  const [saving, setSaving] = useState(false);
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    whatsapp: true,
    sms: true,
    email: false,
    criticalOnly: false,
  });

  // Connected services
  const [services] = useState<ServiceConnection[]>([
    { id: "justtalk", name: "Just Talk (Render)", status: "connected", lastChecked: new Date() },
    { id: "database", name: "PostgreSQL Database", status: "connected", lastChecked: new Date() },
    { id: "openai", name: "OpenAI API", status: "connected", lastChecked: new Date() },
    { id: "twilio", name: "Twilio (Voice/SMS)", status: "connected", lastChecked: new Date() },
    { id: "stripe", name: "Stripe Payments", status: "disconnected", lastChecked: new Date() },
  ]);

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
            Configure your Control Center and connected services
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

      {/* Connected Services */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Connected Services</h2>
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

      {/* API Keys Section */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">API Configuration</h2>
            <p className="text-sm text-muted-foreground">Manage your API keys and endpoints</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Render API Key</label>
            <Input
              type="password"
              defaultValue="rnd_V9gSWbG56h9ItGaHMF9HX7eMwwRE"
              className="mt-1 bg-background border-border font-mono"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Just Talk URL</label>
            <Input
              defaultValue="https://purposefullivecoaching.com"
              className="mt-1 bg-background border-border font-mono"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Database URL</label>
            <Input
              type="password"
              defaultValue="postgresql://purposeful_user:***@dpg-***-a.oregon-postgres.render.com/purposeful"
              className="mt-1 bg-background border-border font-mono"
            />
          </div>
        </div>
      </Card>

      {/* Security Section */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
            <p className="text-sm text-muted-foreground">Security and access settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div>
              <div className="font-medium text-foreground">Require Approval for Code Changes</div>
              <div className="text-xs text-muted-foreground">All code changes must be approved before deployment</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div>
              <div className="font-medium text-foreground">Require Approval for Database Changes</div>
              <div className="text-xs text-muted-foreground">All database migrations must be approved</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div>
              <div className="font-medium text-foreground">Auto-approve Marketing Content</div>
              <div className="text-xs text-muted-foreground">Marketing posts can be published without approval</div>
            </div>
            <Switch />
          </div>
        </div>
      </Card>
    </div>
  );
}
