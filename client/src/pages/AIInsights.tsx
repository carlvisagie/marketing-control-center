/**
 * AI Insights Page - Intelligent Marketing Recommendations
 * 
 * This page shows AI-powered content recommendations and marketing insights
 * based on real data from Just Talk platform.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Lightbulb,
  RefreshCw,
  Zap,
  Clock,
  Users,
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Play,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function AIInsights() {
  const [selectedPlatform, setSelectedPlatform] = useState<"facebook" | "instagram" | "linkedin" | "tiktok">("instagram");
  const [selectedContentType, setSelectedContentType] = useState<"emotional" | "educational" | "promotional" | "testimonial">("emotional");

  // Get AI-powered insights from Just Talk data
  const dataInsights = trpc.ai.getDataInsights.useQuery(undefined, {
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Generate content suggestions mutation
  const generateContent = trpc.ai.generateContentSuggestions.useMutation({
    onSuccess: () => {
      toast.success("Content suggestions generated!");
    },
    onError: (error) => {
      toast.error(`Failed to generate content: ${error.message}`);
    },
  });

  const handleGenerateContent = () => {
    generateContent.mutate({
      platform: selectedPlatform,
      contentType: selectedContentType,
    });
  };

  const insights = dataInsights.data?.insights;
  const suggestions = generateContent.data?.suggestions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-400" />
            AI Marketing Intelligence
          </h1>
          <p className="text-slate-400 mt-1">
            Self-learning recommendations based on real platform data
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => dataInsights.refetch()}
          disabled={dataInsights.isRefetching}
          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${dataInsights.isRefetching ? "animate-spin" : ""}`} />
          Refresh Insights
        </Button>
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="insights" className="data-[state=active]:bg-purple-500/20">
            <Lightbulb className="h-4 w-4 mr-2" />
            Data Insights
          </TabsTrigger>
          <TabsTrigger value="generate" className="data-[state=active]:bg-purple-500/20">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Content
          </TabsTrigger>
          <TabsTrigger value="strategy" className="data-[state=active]:bg-purple-500/20">
            <Target className="h-4 w-4 mr-2" />
            Strategy
          </TabsTrigger>
        </TabsList>

        {/* Data Insights Tab */}
        <TabsContent value="insights">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Best Times to Post */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-6">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                Best Times to Post
              </h3>
              <div className="space-y-3">
                {insights?.targetAudience?.bestTimeToPost?.map((time: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      {time}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-slate-500 text-sm">
                    {dataInsights.isLoading ? "Loading..." : "No data available"}
                  </p>
                )}
              </div>
            </Card>

            {/* Emotional Triggers */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-6">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                Emotional Triggers
              </h3>
              <div className="space-y-2">
                {insights?.targetAudience?.emotionalTriggers?.map((trigger: string, i: number) => (
                  <Badge key={i} className="bg-amber-500/20 text-amber-400 border-amber-500/30 mr-2 mb-2">
                    {trigger}
                  </Badge>
                )) || (
                  <p className="text-slate-500 text-sm">
                    {dataInsights.isLoading ? "Loading..." : "No data available"}
                  </p>
                )}
              </div>
            </Card>

            {/* Content Themes */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-6">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                Content Themes
              </h3>
              <div className="space-y-2">
                {insights?.targetAudience?.contentThemes?.map((theme: string, i: number) => (
                  <div key={i} className="p-2 bg-slate-800/50 rounded-lg text-slate-300 text-sm">
                    {theme}
                  </div>
                )) || (
                  <p className="text-slate-500 text-sm">
                    {dataInsights.isLoading ? "Loading..." : "No data available"}
                  </p>
                )}
              </div>
            </Card>

            {/* High Priority Content */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-6">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                High Priority Content
              </h3>
              <div className="space-y-2">
                {insights?.contentStrategy?.highPriorityContent?.map((content: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-slate-300 text-sm">{content}</span>
                  </div>
                )) || (
                  <p className="text-slate-500 text-sm">
                    {dataInsights.isLoading ? "Loading..." : "No data available"}
                  </p>
                )}
              </div>
            </Card>

            {/* Messaging Tone */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-6">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-rose-400" />
                Recommended Tone
              </h3>
              <p className="text-slate-300">
                {insights?.contentStrategy?.messagingTone || (
                  <span className="text-slate-500 text-sm">
                    {dataInsights.isLoading ? "Loading..." : "No data available"}
                  </span>
                )}
              </p>
              {insights?.contentStrategy?.callToAction && (
                <div className="mt-4 p-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
                  <p className="text-rose-400 text-sm font-medium">Best CTA Approach:</p>
                  <p className="text-slate-300 text-sm mt-1">
                    {insights.contentStrategy.callToAction}
                  </p>
                </div>
              )}
            </Card>

            {/* Campaign Ideas */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-6">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
                Campaign Ideas
              </h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {insights?.campaignIdeas?.map((campaign: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                      <p className="text-white font-medium text-sm">{campaign.name}</p>
                      <p className="text-slate-400 text-xs mt-1">{campaign.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                          {campaign.targetEmotion}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <p className="text-slate-500 text-sm">
                      {dataInsights.isLoading ? "Loading..." : "No campaign ideas available"}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        {/* Generate Content Tab */}
        <TabsContent value="generate">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Controls */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-6">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Generate Content
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Platform</label>
                  <Select value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as any)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">
                        <div className="flex items-center gap-2">
                          <Facebook className="h-4 w-4" /> Facebook
                        </div>
                      </SelectItem>
                      <SelectItem value="instagram">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" /> Instagram
                        </div>
                      </SelectItem>
                      <SelectItem value="linkedin">
                        <div className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4" /> LinkedIn
                        </div>
                      </SelectItem>
                      <SelectItem value="tiktok">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4" /> TikTok
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Content Type</label>
                  <Select value={selectedContentType} onValueChange={(v) => setSelectedContentType(v as any)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emotional">Emotional</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="testimonial">Testimonial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerateContent}
                  disabled={generateContent.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {generateContent.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Suggestions
                    </>
                  )}
                </Button>
              </div>

              {generateContent.data?.tips && (
                <div className="mt-6 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <p className="text-purple-400 text-sm font-medium mb-2">Tips:</p>
                  <ul className="space-y-1">
                    {generateContent.data.tips.map((tip: string, i: number) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Generated Suggestions */}
            <div className="md:col-span-2">
              <Card className="bg-slate-900/50 border-slate-700/50 p-6">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                  Generated Suggestions
                </h3>
                
                {suggestions ? (
                  <div className="space-y-4">
                    {suggestions.map((suggestion: any, i: number) => (
                      <div key={i} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
                        <div className="flex items-start justify-between mb-3">
                          <Badge className="bg-cyan-500/20 text-cyan-400">
                            Suggestion {i + 1}
                          </Badge>
                          <div className="flex gap-2">
                            {suggestion.hashtags?.slice(0, 3).map((tag: string, j: number) => (
                              <Badge key={j} variant="outline" className="text-xs text-slate-400">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <p className="text-white font-medium mb-2">{suggestion.headline}</p>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{suggestion.body}</p>
                        
                        <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-slate-500">Best Time</p>
                            <p className="text-slate-300">{suggestion.bestTimeToPost}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Target</p>
                            <p className="text-slate-300">{suggestion.targetAudience}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">CTA</p>
                            <p className="text-slate-300">{suggestion.callToAction}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select options and click "Generate Suggestions" to get AI-powered content ideas</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy">
          <Card className="bg-slate-900/50 border-slate-700/50 p-6">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-400" />
              Autonomous Marketing Strategy
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-slate-300 font-medium">How It Works</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-400 font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Data Collection</p>
                      <p className="text-slate-400 text-sm">Real-time metrics from Just Talk platform</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">AI Analysis</p>
                      <p className="text-slate-400 text-sm">Pattern detection and insight generation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Recommendations</p>
                      <p className="text-slate-400 text-sm">Actionable content and timing suggestions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-400 font-bold">4</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Continuous Learning</p>
                      <p className="text-slate-400 text-sm">Improves with every interaction</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-slate-300 font-medium">Autonomous Features</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-slate-300">Real-time data insights</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-slate-300">AI content generation</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <span className="text-slate-300">A/B test analysis (coming soon)</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <span className="text-slate-300">Auto-pause/boost (coming soon)</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <span className="text-slate-300">Daily summary notifications (coming soon)</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
