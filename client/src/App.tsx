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

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <ErrorBoundary>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/command" component={CommandCenter} />
            <Route path="/approvals" component={ApprovalQueue} />
            <Route path="/activity" component={ActivityLog} />
            <Route path="/settings" component={Settings} />
            <Route path="/flags" component={FeatureFlags} />
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
