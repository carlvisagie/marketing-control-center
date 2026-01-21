/**
 * Approval Queue Page
 * 
 * Review and approve/reject AI-generated content and changes.
 * Nothing risky goes live without your approval.
 * 
 * NOTE: This page will show real items when the autonomous marketing
 * agents are active and generating content for approval.
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  FileText,
  Code,
  MessageSquare,
  AlertTriangle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

interface ApprovalItem {
  id: string;
  type: "content" | "code" | "config";
  title: string;
  description: string;
  preview?: string;
  risk: "low" | "medium" | "high";
  createdAt: Date;
  source: string;
}

export default function ApprovalQueue() {
  // Start with empty array - real items will come from the autonomous agents
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);

  const approveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success("Approved and queued for execution");
  };

  const rejectItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.info("Rejected and removed from queue");
  };

  const getTypeIcon = (type: ApprovalItem["type"]) => {
    switch (type) {
      case "content":
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case "code":
        return <Code className="w-5 h-5 text-purple-400" />;
      case "config":
        return <FileText className="w-5 h-5 text-orange-400" />;
    }
  };

  const getRiskBadge = (risk: ApprovalItem["risk"]) => {
    switch (risk) {
      case "low":
        return <Badge variant="outline" className="border-green-500/50 text-green-400">Low Risk</Badge>;
      case "medium":
        return <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">Medium Risk</Badge>;
      case "high":
        return <Badge variant="outline" className="border-red-500/50 text-red-400">High Risk</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Approval Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Review AI-generated content and changes before they go live
          </p>
        </div>
        <Badge variant="outline" className="border-primary text-primary">
          {items.length} pending
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground font-mono">
                {items.filter(i => i.type === "content").length}
              </div>
              <div className="text-xs text-muted-foreground">Content</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Code className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground font-mono">
                {items.filter(i => i.type === "code").length}
              </div>
              <div className="text-xs text-muted-foreground">Code Changes</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground font-mono">
                {items.filter(i => i.type === "config").length}
              </div>
              <div className="text-xs text-muted-foreground">Config/DB</div>
            </div>
          </div>
        </Card>
      </div>

      {/* High Risk Warning */}
      {items.some(i => i.risk === "high") && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400">High Risk Items Pending</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Some items require extra attention. Review carefully before approving.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State or Approval Items */}
      {items.length === 0 ? (
        <Card className="p-12 bg-card border-border text-center">
          <Inbox className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Pending Approvals</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            When the autonomous marketing agents generate content or propose changes, 
            they'll appear here for your review before going live.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 bg-card border-border">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-accent">
                  {getTypeIcon(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    {getRiskBadge(item.risk)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  
                  {/* Preview */}
                  {item.preview && (
                    <div className="bg-background rounded-lg p-3 border border-border mb-3">
                      <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                        {item.preview}
                      </pre>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>From: {item.source}</span>
                    <span>{item.createdAt.toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveItem(item.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectItem(item.id)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedItem(item)}
                    className="text-muted-foreground"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
