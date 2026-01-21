/**
 * A/B Test Manager
 * 
 * Weekly A/B testing based on Sintra strategy:
 * - Week 1: Hook styles
 * - Week 2: CTA variants
 * - Week 3: Visual styles
 * - Week 4: Offer framing
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FlaskConical,
  Play,
  Pause,
  BarChart3,
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

interface ABTest {
  id: string;
  name: string;
  category: "hook" | "cta" | "visual" | "offer";
  status: "draft" | "running" | "completed" | "paused";
  startDate: string;
  endDate?: string;
  variantA: {
    name: string;
    description: string;
    impressions: number;
    clicks: number;
    conversions: number;
  };
  variantB: {
    name: string;
    description: string;
    impressions: number;
    clicks: number;
    conversions: number;
  };
  winner?: "A" | "B" | "tie";
  confidence?: number;
}

// Sample tests based on Sintra strategy
const SAMPLE_TESTS: ABTest[] = [
  {
    id: "test-1",
    name: "Hook Style Test",
    category: "hook",
    status: "running",
    startDate: "2025-01-15",
    variantA: {
      name: "Question Hook",
      description: "It's 3 AM. Who can you call?",
      impressions: 12500,
      clicks: 875,
      conversions: 42,
    },
    variantB: {
      name: "Statement Hook",
      description: "You don't have to wait until morning.",
      impressions: 12300,
      clicks: 738,
      conversions: 35,
    },
    confidence: 78,
  },
  {
    id: "test-2",
    name: "CTA Button Test",
    category: "cta",
    status: "completed",
    startDate: "2025-01-08",
    endDate: "2025-01-14",
    variantA: {
      name: "Start Talking Now",
      description: "Direct action CTA",
      impressions: 15000,
      clicks: 1200,
      conversions: 72,
    },
    variantB: {
      name: "Try 7 Days for $7",
      description: "Trial offer CTA",
      impressions: 14800,
      clicks: 1480,
      conversions: 118,
    },
    winner: "B",
    confidence: 95,
  },
  {
    id: "test-3",
    name: "Offer Framing Test",
    category: "offer",
    status: "draft",
    startDate: "2025-01-22",
    variantA: {
      name: "Monthly Subscription",
      description: "$29/month - Cancel anytime",
      impressions: 0,
      clicks: 0,
      conversions: 0,
    },
    variantB: {
      name: "Annual Savings",
      description: "$290/year - Save 2 months",
      impressions: 0,
      clicks: 0,
      conversions: 0,
    },
  },
];

// Test ideas from Sintra strategy
const TEST_IDEAS = [
  {
    category: "hook",
    ideas: [
      "Question vs Statement hooks",
      "Problem-focused vs Solution-focused",
      "Personal vs Universal",
      "Short (5 words) vs Long (15 words)",
    ],
  },
  {
    category: "cta",
    ideas: [
      "Start Now vs Try Free",
      "Action verb vs Benefit statement",
      "Urgency vs No urgency",
      "Button color variations",
    ],
  },
  {
    category: "visual",
    ideas: [
      "Face vs No face in thumbnail",
      "Text overlay vs Clean image",
      "Bright vs Dark color scheme",
      "Static vs Motion preview",
    ],
  },
  {
    category: "offer",
    ideas: [
      "Monthly vs Annual framing",
      "Trial price points ($1 vs $7)",
      "Discount % vs $ amount",
      "Limited time vs Always available",
    ],
  },
];

export default function ABTestManager() {
  const [tests, setTests] = useState<ABTest[]>(SAMPLE_TESTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  const calculateCVR = (conversions: number, clicks: number) => {
    if (clicks === 0) return 0;
    return ((conversions / clicks) * 100).toFixed(2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "completed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "paused":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/30";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "hook":
        return "bg-purple-500/10 text-purple-500";
      case "cta":
        return "bg-blue-500/10 text-blue-500";
      case "visual":
        return "bg-pink-500/10 text-pink-500";
      case "offer":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const filteredTests = selectedCategory === "all" 
    ? tests 
    : tests.filter(t => t.category === selectedCategory);

  const runningTests = tests.filter(t => t.status === "running").length;
  const completedTests = tests.filter(t => t.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            A/B Test Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Weekly testing based on Sintra strategy
          </p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => toast.info("Create test feature coming soon!")}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Test
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Play className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{runningTests}</p>
              <p className="text-sm text-muted-foreground">Running Tests</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedTests}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {tests.filter(t => t.winner).length}
              </p>
              <p className="text-sm text-muted-foreground">Winners Found</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {tests.reduce((acc, t) => acc + t.variantA.impressions + t.variantB.impressions, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Impressions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "hook", "cta", "visual", "offer"].map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? "" : ""}
          >
            {cat === "all" ? "All Tests" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {filteredTests.map(test => (
          <Card key={test.id} className="p-6 bg-card border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-foreground">{test.name}</h3>
                  <Badge className={getCategoryColor(test.category)}>
                    {test.category}
                  </Badge>
                  <Badge className={getStatusColor(test.status)}>
                    {test.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Started: {test.startDate}
                  {test.endDate && ` • Ended: ${test.endDate}`}
                </p>
              </div>
              
              {test.status === "running" && (
                <Button variant="outline" size="sm">
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </Button>
              )}
              {test.status === "draft" && (
                <Button className="bg-primary hover:bg-primary/90" size="sm">
                  <Play className="w-4 h-4 mr-1" />
                  Start Test
                </Button>
              )}
            </div>

            {/* Variants Comparison */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Variant A */}
              <div className={`p-4 rounded-lg border ${test.winner === "A" ? "border-green-500 bg-green-500/5" : "border-border"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">Variant A</span>
                  {test.winner === "A" && (
                    <Badge className="bg-green-500/10 text-green-500">
                      <Trophy className="w-3 h-3 mr-1" />
                      Winner
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{test.variantA.name}</p>
                <p className="text-xs text-muted-foreground mb-3">"{test.variantA.description}"</p>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{test.variantA.impressions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Impressions</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{calculateCTR(test.variantA.clicks, test.variantA.impressions)}%</p>
                    <p className="text-xs text-muted-foreground">CTR</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{calculateCVR(test.variantA.conversions, test.variantA.clicks)}%</p>
                    <p className="text-xs text-muted-foreground">CVR</p>
                  </div>
                </div>
              </div>

              {/* Variant B */}
              <div className={`p-4 rounded-lg border ${test.winner === "B" ? "border-green-500 bg-green-500/5" : "border-border"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">Variant B</span>
                  {test.winner === "B" && (
                    <Badge className="bg-green-500/10 text-green-500">
                      <Trophy className="w-3 h-3 mr-1" />
                      Winner
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{test.variantB.name}</p>
                <p className="text-xs text-muted-foreground mb-3">"{test.variantB.description}"</p>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{test.variantB.impressions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Impressions</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{calculateCTR(test.variantB.clicks, test.variantB.impressions)}%</p>
                    <p className="text-xs text-muted-foreground">CTR</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{calculateCVR(test.variantB.conversions, test.variantB.clicks)}%</p>
                    <p className="text-xs text-muted-foreground">CVR</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence Level */}
            {test.confidence && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Statistical Confidence</span>
                  <span className="text-sm font-medium text-foreground">{test.confidence}%</span>
                </div>
                <Progress value={test.confidence} className="h-2" />
                {test.confidence >= 95 && (
                  <p className="text-xs text-green-500 mt-1">
                    ✓ Statistically significant (95%+ confidence)
                  </p>
                )}
                {test.confidence < 95 && test.confidence >= 80 && (
                  <p className="text-xs text-yellow-500 mt-1">
                    ⚠ Approaching significance, continue testing
                  </p>
                )}
                {test.confidence < 80 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Need more data for statistical significance
                  </p>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Test Ideas */}
      <Card className="p-6 bg-card border-border">
        <h3 className="font-semibold text-foreground mb-4">Weekly Test Ideas (Sintra Strategy)</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TEST_IDEAS.map(category => (
            <div key={category.category} className="space-y-2">
              <h4 className={`text-sm font-medium capitalize ${getCategoryColor(category.category).split(" ")[1]}`}>
                {category.category} Tests
              </h4>
              <ul className="space-y-1">
                {category.ideas.map((idea, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Testing Schedule */}
      <Card className="p-6 bg-card border-border">
        <h3 className="font-semibold text-foreground mb-4">Recommended Testing Schedule</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <h4 className="font-medium text-purple-400 mb-1">Week 1</h4>
            <p className="text-sm text-muted-foreground">Hook Styles</p>
            <p className="text-xs text-purple-400/80 mt-2">Test different opening lines</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <h4 className="font-medium text-blue-400 mb-1">Week 2</h4>
            <p className="text-sm text-muted-foreground">CTA Variants</p>
            <p className="text-xs text-blue-400/80 mt-2">Test button text & urgency</p>
          </div>
          <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
            <h4 className="font-medium text-pink-400 mb-1">Week 3</h4>
            <p className="text-sm text-muted-foreground">Visual Styles</p>
            <p className="text-xs text-pink-400/80 mt-2">Test thumbnails & colors</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <h4 className="font-medium text-green-400 mb-1">Week 4</h4>
            <p className="text-sm text-muted-foreground">Offer Framing</p>
            <p className="text-xs text-green-400/80 mt-2">Test pricing & trials</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
