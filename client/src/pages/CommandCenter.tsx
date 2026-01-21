/**
 * Command Center Page
 * 
 * Give instructions to the AI in plain English.
 * The AI executes tasks across all your projects.
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface Command {
  id: string;
  text: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  timestamp: Date;
}

// Example commands for quick access
const quickCommands = [
  { label: "Check Just Talk Status", command: "Check if Just Talk is running and healthy" },
  { label: "View Recent Errors", command: "Show me the last 10 errors from Just Talk" },
  { label: "Generate Marketing Post", command: "Generate a marketing post about sleep coaching" },
  { label: "Check Database Health", command: "Check the database connection and recent queries" },
];

export default function CommandCenter() {
  const [command, setCommand] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<Command[]>([
    {
      id: "1",
      text: "Check Just Talk status",
      status: "completed",
      result: "✅ Just Talk is running. Last health check: 2 minutes ago. No errors in the last hour.",
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: "2",
      text: "Generate 3 marketing posts about stress management",
      status: "completed",
      result: "Generated 3 posts. Added to approval queue.",
      timestamp: new Date(Date.now() - 600000),
    },
  ]);

  const executeCommand = async () => {
    if (!command.trim()) {
      toast.error("Please enter a command");
      return;
    }

    const newCommand: Command = {
      id: Date.now().toString(),
      text: command,
      status: "running",
      timestamp: new Date(),
    };

    setCommandHistory(prev => [newCommand, ...prev]);
    setCommand("");
    setIsExecuting(true);

    // Simulate command execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    setCommandHistory(prev => 
      prev.map(c => 
        c.id === newCommand.id 
          ? { ...c, status: "completed", result: "Command executed successfully. Check the activity log for details." }
          : c
      )
    );
    setIsExecuting(false);
    toast.success("Command executed");
  };

  const getStatusIcon = (status: Command["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Terminal className="w-6 h-6 text-primary" />
          Command Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Give instructions in plain English. The AI handles the technical work.
        </p>
      </div>

      {/* Command Input */}
      <Card className="p-6 bg-card border-border">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-primary mt-1" />
            <div className="flex-1">
              <Textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Tell me what you want to do... (e.g., 'Check why Just Talk is slow' or 'Post about sleep tips on all platforms')"
                className="min-h-[100px] bg-background border-border text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) {
                    executeCommand();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Press ⌘+Enter to execute
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {quickCommands.map((qc, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setCommand(qc.command)}
                  className="text-xs border-border hover:bg-accent"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {qc.label}
                </Button>
              ))}
            </div>

            <Button
              onClick={executeCommand}
              disabled={isExecuting || !command.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Command History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Recent Commands</h2>
        
        {commandHistory.length === 0 ? (
          <Card className="p-8 bg-card border-border text-center">
            <Terminal className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No commands yet. Start by typing a command above.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {commandHistory.map((cmd) => (
              <Card key={cmd.id} className="p-4 bg-card border-border">
                <div className="flex items-start gap-3">
                  {getStatusIcon(cmd.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{cmd.text}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          cmd.status === "completed" ? "border-green-500/50 text-green-400" :
                          cmd.status === "failed" ? "border-red-500/50 text-red-400" :
                          cmd.status === "running" ? "border-blue-500/50 text-blue-400" :
                          "border-yellow-500/50 text-yellow-400"
                        }`}
                      >
                        {cmd.status}
                      </Badge>
                    </div>
                    {cmd.result && (
                      <p className="text-sm text-muted-foreground">{cmd.result}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {cmd.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
