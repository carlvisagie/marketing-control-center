/**
 * Command Center Page
 * 
 * REAL command execution - generates content with OpenAI, posts to social media.
 * No more fake delays or simulations.
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
  Facebook,
  Linkedin,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Command {
  id: string;
  text: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  timestamp: Date;
}

// Quick commands that actually work
const quickCommands = [
  { label: "Check Status", command: "Check status", icon: RefreshCw },
  { label: "Post to Facebook", command: "Post to Facebook about 24/7 emotional support", icon: Facebook },
  { label: "Post to LinkedIn", command: "Post to LinkedIn about work-life balance", icon: Linkedin },
  { label: "Post to All", command: "Post to all platforms about needing someone to talk to", icon: Zap },
];

export default function CommandCenter() {
  const [command, setCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<Command[]>([]);

  const executeMutation = trpc.commands.execute.useMutation({
    onSuccess: (data, variables) => {
      setCommandHistory(prev => 
        prev.map(c => 
          c.status === "running" && c.text === variables.command
            ? { 
                ...c, 
                status: data.success ? "completed" : "failed", 
                result: data.message 
              }
            : c
        )
      );
      
      if (data.success) {
        toast.success("Command executed successfully");
      } else {
        toast.error(data.message);
      }
    },
    onError: (error, variables) => {
      setCommandHistory(prev => 
        prev.map(c => 
          c.status === "running" && c.text === variables.command
            ? { ...c, status: "failed", result: error.message }
            : c
        )
      );
      toast.error(`Command failed: ${error.message}`);
    },
  });

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
    const cmdText = command;
    setCommand("");

    // Execute the real command
    executeMutation.mutate({ command: cmdText });
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
          Real commands. Real posts. Type what you want and it happens.
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
                placeholder="Examples:
• Post to Facebook about 24/7 support
• Post to LinkedIn about work stress
• Post to all platforms
• Check status"
                className="min-h-[100px] bg-background border-border text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    executeCommand();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Press Ctrl+Enter to execute
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap gap-2">
              {quickCommands.map((qc, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCommand(qc.command);
                  }}
                  className="text-xs border-border hover:bg-accent"
                >
                  <qc.icon className="w-3 h-3 mr-1" />
                  {qc.label}
                </Button>
              ))}
            </div>

            <Button
              onClick={executeCommand}
              disabled={executeMutation.isPending || !command.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {executeMutation.isPending ? (
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => {
            setCommand("Post to Facebook about needing someone to listen");
            setTimeout(executeCommand, 100);
          }}
          disabled={executeMutation.isPending}
        >
          <Facebook className="w-6 h-6 text-blue-500" />
          <span className="text-xs">Post to Facebook</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => {
            setCommand("Post to LinkedIn about work-life balance and mental wellness");
            setTimeout(executeCommand, 100);
          }}
          disabled={executeMutation.isPending}
        >
          <Linkedin className="w-6 h-6 text-blue-600" />
          <span className="text-xs">Post to LinkedIn</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => {
            setCommand("Post to all platforms about 24/7 emotional support");
            setTimeout(executeCommand, 100);
          }}
          disabled={executeMutation.isPending}
        >
          <Zap className="w-6 h-6 text-yellow-500" />
          <span className="text-xs">Post to All</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => {
            setCommand("Check status");
            setTimeout(executeCommand, 100);
          }}
          disabled={executeMutation.isPending}
        >
          <RefreshCw className="w-6 h-6 text-green-500" />
          <span className="text-xs">Check Status</span>
        </Button>
      </div>

      {/* Command History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Command History</h2>
        
        {commandHistory.length === 0 ? (
          <Card className="p-8 bg-card border-border text-center">
            <Terminal className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No commands yet. Click a quick action or type a command above.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {commandHistory.map((cmd) => (
              <Card key={cmd.id} className="p-4 bg-card border-border">
                <div className="flex items-start gap-3">
                  {getStatusIcon(cmd.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cmd.result}</p>
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
