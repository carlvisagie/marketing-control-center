/**
 * TikTok Content Hub - Generate & Send to Phone
 * 
 * Features:
 * - AI-powered content generation
 * - Trending topics and hashtags
 * - One-click send-to-phone for easy posting
 * - Weekly content planning
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  Phone,
  TrendingUp,
  Calendar,
  Clock,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Hash,
  Zap,
  AlertCircle,
  Loader2,
} from "lucide-react";

// Content types for generation
const contentTypes = [
  { value: "educational", label: "Educational", description: "Tips, how-tos, explanations" },
  { value: "storytelling", label: "Storytelling", description: "Personal stories, testimonials" },
  { value: "trending_audio", label: "Trending Audio", description: "Using trending sounds" },
  { value: "behind_scenes", label: "Behind the Scenes", description: "Day in the life, process" },
  { value: "transformation", label: "Transformation", description: "Before/after, progress" },
  { value: "myth_busting", label: "Myth Busting", description: "Debunking misconceptions" },
  { value: "quick_tips", label: "Quick Tips", description: "3-second tips, hacks" },
];

const tones = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "inspiring", label: "Inspiring" },
  { value: "educational", label: "Educational" },
  { value: "relatable", label: "Relatable" },
];

export default function TikTok() {
  const [activeTab, setActiveTab] = useState("generate");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Form state for content generation
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState<string>("educational");
  const [tone, setTone] = useState<string>("relatable");
  
  // Generated content state
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  // Mutations
  const generateContent = trpc.tiktok.generateContent.useMutation({
    onSuccess: (data) => {
      if (data.success && data.content) {
        setGeneratedContent(data.content);
        toast.success("Content Generated! Your TikTok content is ready.");
      } else {
        toast.error(data.error || "Failed to generate content");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sendToPhone = trpc.tiktok.sendToPhone.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Sent to Phone! 📱 Check your SMS/WhatsApp.");
      } else {
        toast.error(data.error || "Failed to send to phone");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const generateWeeklyPlan = trpc.tiktok.generateWeeklyPlan.useMutation();

  // Queries
  const { data: trends, isLoading: trendsLoading, refetch: refetchTrends } = trpc.tiktok.getTrendingTopics.useQuery();
  const { data: postingTimes } = trpc.tiktok.getOptimalPostingTimes.useQuery();
  const { data: notificationStatus } = trpc.tiktok.getNotificationStatus.useQuery();

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${field} copied to clipboard`);
  };

  // Handle content generation
  const handleGenerate = () => {
    generateContent.mutate({
      topic: topic || undefined,
      contentType: contentType as any,
      tone: tone as any,
      includeHook: true,
      includeCTA: true,
    });
  };

  // Handle send to phone
  const handleSendToPhone = () => {
    if (!generatedContent) return;
    
    sendToPhone.mutate({
      content: {
        hook: generatedContent.hook,
        script: generatedContent.script,
        caption: generatedContent.caption,
        hashtags: generatedContent.hashtags,
        postingTip: generatedContent.postingTip,
        audioSuggestion: generatedContent.audioSuggestion,
      },
      method: "both",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📱</span> TikTok Content Hub
          </h1>
          <p className="text-slate-400 mt-1">
            Generate AI-powered content and send directly to your phone for posting
          </p>
        </div>
        {notificationStatus && (
          <Badge variant={notificationStatus.configured ? "default" : "destructive"}>
            {notificationStatus.configured ? "📱 Phone Ready" : "⚠️ Configure Twilio"}
          </Badge>
        )}
      </div>

      {/* Notification Status Warning */}
      {notificationStatus && !notificationStatus.configured && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-amber-200 font-medium">Send-to-Phone Not Configured</p>
                <p className="text-amber-200/70 text-sm mt-1">
                  Add these environment variables to enable one-click send-to-phone:
                </p>
                <ul className="text-amber-200/70 text-sm mt-2 space-y-1">
                  <li>• TWILIO_ACCOUNT_SID</li>
                  <li>• TWILIO_AUTH_TOKEN</li>
                  <li>• TWILIO_PHONE_NUMBER</li>
                  <li>• OWNER_PHONE_NUMBER</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="generate" className="data-[state=active]:bg-slate-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Content
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-slate-700">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-slate-700">
            <Calendar className="h-4 w-4 mr-2" />
            Best Times
          </TabsTrigger>
        </TabsList>

        {/* Generate Content Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generation Form */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Content Generator
                </CardTitle>
                <CardDescription>
                  AI will create engaging TikTok content for Just Talk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Topic (optional)</label>
                  <Input
                    placeholder="e.g., managing anxiety at work"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-slate-900/50 border-slate-600"
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave empty for AI to suggest a topic</p>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Content Type</label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <span>{type.label}</span>
                            <span className="text-slate-500 ml-2 text-xs">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Tone</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generateContent.isPending}
                  className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600"
                >
                  {generateContent.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Content Preview */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Generated Content
                  </span>
                  {generatedContent && (
                    <Button
                      size="sm"
                      onClick={handleSendToPhone}
                      disabled={sendToPhone.isPending || !notificationStatus?.configured}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {sendToPhone.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Phone className="h-4 w-4 mr-2" />
                          Send to Phone
                        </>
                      )}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedContent ? (
                  <div className="space-y-4">
                    {/* Hook */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm text-slate-400">🎣 Hook (First 3 seconds)</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.hook, "Hook")}
                        >
                          {copiedField === "Hook" ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg text-white text-sm">
                        {generatedContent.hook}
                      </div>
                    </div>

                    {/* Script */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm text-slate-400">📝 Script</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.script, "Script")}
                        >
                          {copiedField === "Script" ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg text-white text-sm max-h-32 overflow-y-auto">
                        {generatedContent.script}
                      </div>
                    </div>

                    {/* Caption */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm text-slate-400">✏️ Caption</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.caption, "Caption")}
                        >
                          {copiedField === "Caption" ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg text-white text-sm">
                        {generatedContent.caption}
                      </div>
                    </div>

                    {/* Hashtags */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm text-slate-400">#️⃣ Hashtags</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            generatedContent.hashtags.map((h: string) => h.startsWith("#") ? h : `#${h}`).join(" "),
                            "Hashtags"
                          )}
                        >
                          {copiedField === "Hashtags" ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.hashtags?.map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-slate-700">
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                      {generatedContent.postingTip && (
                        <div className="text-xs">
                          <span className="text-slate-500">⏰ Best time:</span>
                          <p className="text-slate-300 mt-1">{generatedContent.postingTip}</p>
                        </div>
                      )}
                      {generatedContent.audioSuggestion && (
                        <div className="text-xs">
                          <span className="text-slate-500">🎵 Audio:</span>
                          <p className="text-slate-300 mt-1">{generatedContent.audioSuggestion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generate content to see preview</p>
                    <p className="text-sm mt-1">AI will create hook, script, caption & hashtags</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Trending in Mental Health
                  </CardTitle>
                  <CardDescription>
                    AI-analyzed trends for the wellness niche
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchTrends()}
                  disabled={trendsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${trendsLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                </div>
              ) : trends?.success && trends.trends ? (
                <div className="space-y-6">
                  {/* Weekly Focus */}
                  {trends.trends.weeklyFocus && (
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-lg border border-blue-500/30">
                      <h3 className="text-white font-medium mb-1">📌 This Week's Focus</h3>
                      <p className="text-slate-300">{trends.trends.weeklyFocus}</p>
                    </div>
                  )}

                  {/* Trending Topics */}
                  {trends.trends.trendingTopics && (
                    <div>
                      <h3 className="text-white font-medium mb-3">🔥 Trending Topics</h3>
                      <div className="grid gap-3">
                        {trends.trends.trendingTopics.map((topic: any, i: number) => (
                          <div key={i} className="bg-slate-900/50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{topic.topic}</span>
                              <Badge variant={
                                topic.relevance === "high" ? "default" :
                                topic.relevance === "medium" ? "secondary" : "outline"
                              }>
                                {topic.relevance}
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-sm">{topic.description}</p>
                            {topic.contentIdea && (
                              <p className="text-blue-400 text-sm mt-2">💡 {topic.contentIdea}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Hashtags */}
                  {trends.trends.trendingHashtags && (
                    <div>
                      <h3 className="text-white font-medium mb-3">#️⃣ Trending Hashtags</h3>
                      <div className="flex flex-wrap gap-2">
                        {trends.trends.trendingHashtags.map((tag: any, i: number) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className={`cursor-pointer ${
                              tag.relevance === "high" ? "bg-green-500/20 text-green-300" :
                              tag.relevance === "medium" ? "bg-yellow-500/20 text-yellow-300" :
                              "bg-slate-700"
                            }`}
                            onClick={() => copyToClipboard(tag.hashtag, tag.hashtag)}
                          >
                            {tag.hashtag}
                            {tag.estimatedViews && (
                              <span className="ml-1 opacity-70">({tag.estimatedViews})</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Audios */}
                  {trends.trends.trendingAudios && (
                    <div>
                      <h3 className="text-white font-medium mb-3">🎵 Trending Audio Types</h3>
                      <div className="grid gap-2">
                        {trends.trends.trendingAudios.map((audio: any, i: number) => (
                          <div key={i} className="bg-slate-900/50 p-3 rounded-lg flex items-start gap-3">
                            <span className="text-2xl">🎶</span>
                            <div>
                              <p className="text-white">{audio.description}</p>
                              <p className="text-slate-400 text-sm">{audio.useCase}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Failed to load trends</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => refetchTrends()}>
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Best Times Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Optimal Posting Times
              </CardTitle>
              <CardDescription>
                Best times to post for maximum engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {postingTimes?.success && postingTimes.schedule ? (
                <div className="space-y-6">
                  {/* Frequency Recommendation */}
                  {postingTimes.schedule.frequencyRecommendation && (
                    <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/30">
                      <h3 className="text-orange-300 font-medium mb-1">📊 Recommended Frequency</h3>
                      <p className="text-slate-300">{postingTimes.schedule.frequencyRecommendation}</p>
                    </div>
                  )}

                  {/* Daily Schedule */}
                  {postingTimes.schedule.bestTimes && (
                    <div>
                      <h3 className="text-white font-medium mb-3">📅 Daily Schedule</h3>
                      <div className="grid gap-3">
                        {postingTimes.schedule.bestTimes.map((day: any, i: number) => (
                          <div key={i} className="bg-slate-900/50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{day.day}</span>
                              <Badge className="bg-green-500/20 text-green-300">
                                Best: {day.bestTime}
                              </Badge>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {day.times?.map((time: string, j: number) => (
                                <Badge key={j} variant="outline" className="text-slate-300">
                                  {time}
                                </Badge>
                              ))}
                            </div>
                            {day.reason && (
                              <p className="text-slate-400 text-sm mt-2">{day.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General Tips */}
                  {postingTimes.schedule.generalTips && (
                    <div>
                      <h3 className="text-white font-medium mb-3">💡 Posting Tips</h3>
                      <ul className="space-y-2">
                        {postingTimes.schedule.generalTips.map((tip: string, i: number) => (
                          <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Times to Avoid */}
                  {postingTimes.schedule.worstTimes && (
                    <div>
                      <h3 className="text-white font-medium mb-3">⚠️ Times to Avoid</h3>
                      <div className="flex gap-2 flex-wrap">
                        {postingTimes.schedule.worstTimes.map((time: string, i: number) => (
                          <Badge key={i} variant="destructive" className="bg-red-500/20 text-red-300">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Loading posting schedule...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
