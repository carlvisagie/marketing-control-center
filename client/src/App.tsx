import { Switch, Route } from "wouter";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import CommandCenter from "./pages/CommandCenter";
import ApprovalQueue from "./pages/ApprovalQueue";
import ActivityLog from "./pages/ActivityLog";
import Settings from "./pages/Settings";
import FeatureFlags from "./pages/FeatureFlags";
import LiveMetrics from "./pages/LiveMetrics";
import AIInsights from "./pages/AIInsights";
import TikTok from "./pages/TikTok";
import CampaignTracker from "./pages/CampaignTracker";
import AdCopyGenerator from "./pages/AdCopyGenerator";
import ContentCalendar from "./pages/ContentCalendar";
import ABTestManager from "./pages/ABTestManager";
import SocialAccounts from "./pages/SocialAccounts";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <ErrorBoundary>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/live" component={LiveMetrics} />
            <Route path="/ai" component={AIInsights} />
            <Route path="/command" component={CommandCenter} />
            <Route path="/approvals" component={ApprovalQueue} />
            <Route path="/activity" component={ActivityLog} />
            <Route path="/settings" component={Settings} />
            <Route path="/flags" component={FeatureFlags} />
            <Route path="/tiktok" component={TikTok} />
            <Route path="/campaigns" component={CampaignTracker} />
            <Route path="/ad-copy" component={AdCopyGenerator} />
            <Route path="/calendar" component={ContentCalendar} />
            <Route path="/ab-tests" component={ABTestManager} />
            <Route path="/accounts" component={SocialAccounts} />
            <Route>
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400">Page not found</p>
              </div>
            </Route>
          </Switch>
        </DashboardLayout>
        <Toaster />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
