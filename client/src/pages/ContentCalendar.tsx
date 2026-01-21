/**
 * Content Calendar
 * 
 * 30-day content calendar based on Sintra marketing strategy:
 * - TikTok: 1/day
 * - IG Reels: 1/day
 * - IG Stories: 3/day
 * - FB posts: 3/week
 * - LinkedIn: 2/week
 */

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Facebook,
  Instagram,
  Linkedin,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface ScheduledPost {
  id: string;
  date: Date;
  time: string;
  platform: "tiktok" | "instagram" | "instagram_story" | "facebook" | "linkedin";
  contentType: string;
  topic: string;
  status: "scheduled" | "posted" | "draft";
}

interface DaySchedule {
  date: Date;
  posts: ScheduledPost[];
}

// Content themes for the week
const WEEKLY_THEMES = [
  "Stress Management",
  "Self-Care Sunday",
  "Mindful Monday",
  "Transformation Tuesday",
  "Wellness Wednesday",
  "Thankful Thursday",
  "Feel-Good Friday",
  "Saturday Reset",
];

// Generate schedule based on Sintra strategy
const generateMonthSchedule = (startDate: Date): DaySchedule[] => {
  const schedule: DaySchedule[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + i);
    
    const dayOfWeek = date.getDay();
    const posts: ScheduledPost[] = [];
    const theme = WEEKLY_THEMES[dayOfWeek];
    
    // TikTok: 1/day
    posts.push({
      id: `tiktok-${i}`,
      date,
      time: "10:00 AM",
      platform: "tiktok",
      contentType: "Short-form video",
      topic: theme,
      status: "draft",
    });
    
    // IG Reels: 1/day
    posts.push({
      id: `ig-reel-${i}`,
      date,
      time: "12:00 PM",
      platform: "instagram",
      contentType: "Reel",
      topic: theme,
      status: "draft",
    });
    
    // IG Stories: 3/day
    ["9:00 AM", "2:00 PM", "7:00 PM"].forEach((time, idx) => {
      posts.push({
        id: `ig-story-${i}-${idx}`,
        date,
        time,
        platform: "instagram_story",
        contentType: "Story",
        topic: idx === 0 ? "Morning motivation" : idx === 1 ? "Behind the scenes" : "Evening reflection",
        status: "draft",
      });
    });
    
    // FB posts: 3/week (Mon, Wed, Fri)
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
      posts.push({
        id: `fb-${i}`,
        date,
        time: "11:00 AM",
        platform: "facebook",
        contentType: "Post",
        topic: theme,
        status: "draft",
      });
    }
    
    // LinkedIn: 2/week (Tue, Thu)
    if (dayOfWeek === 2 || dayOfWeek === 4) {
      posts.push({
        id: `linkedin-${i}`,
        date,
        time: "8:00 AM",
        platform: "linkedin",
        contentType: "Article/Post",
        topic: `Professional: ${theme}`,
        status: "draft",
      });
    }
    
    schedule.push({ date, posts });
  }
  
  return schedule;
};

export default function ContentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  
  const schedule = useMemo(() => generateMonthSchedule(currentMonth), [currentMonth]);
  
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "tiktok":
        return <TikTokIcon className="w-4 h-4" />;
      case "instagram":
      case "instagram_story":
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case "facebook":
        return <Facebook className="w-4 h-4 text-blue-500" />;
      case "linkedin":
        return <Linkedin className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };
  
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "tiktok":
        return "bg-foreground/10 text-foreground";
      case "instagram":
      case "instagram_story":
        return "bg-pink-500/10 text-pink-500";
      case "facebook":
        return "bg-blue-500/10 text-blue-500";
      case "linkedin":
        return "bg-blue-600/10 text-blue-600";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "scheduled":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };
  
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentMonth(newDate);
  };
  
  // Calculate daily stats
  const getDayStats = (posts: ScheduledPost[]) => {
    const platforms = new Set(posts.map(p => p.platform.replace("_story", "")));
    return {
      total: posts.length,
      platforms: platforms.size,
      posted: posts.filter(p => p.status === "posted").length,
    };
  };
  
  // Weekly summary
  const weeklySummary = useMemo(() => {
    const summary = {
      tiktok: 0,
      instagram: 0,
      instagram_story: 0,
      facebook: 0,
      linkedin: 0,
    };
    
    schedule.slice(0, 7).forEach(day => {
      day.posts.forEach(post => {
        if (post.platform in summary) {
          summary[post.platform as keyof typeof summary]++;
        }
      });
    });
    
    return summary;
  }, [schedule]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Content Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            30-day content schedule based on Sintra strategy
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-background rounded-lg border border-border p-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              List
            </button>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Post
          </Button>
        </div>
      </div>

      {/* Weekly Summary */}
      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">This Week's Schedule</h3>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <TikTokIcon className="w-4 h-4" />
            <span className="text-sm text-foreground">{weeklySummary.tiktok} TikToks</span>
          </div>
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            <span className="text-sm text-foreground">{weeklySummary.instagram} Reels</span>
          </div>
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            <span className="text-sm text-foreground">{weeklySummary.instagram_story} Stories</span>
          </div>
          <div className="flex items-center gap-2">
            <Facebook className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-foreground">{weeklySummary.facebook} FB Posts</span>
          </div>
          <div className="flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-foreground">{weeklySummary.linkedin} LinkedIn</span>
          </div>
        </div>
      </Card>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <h2 className="text-lg font-semibold text-foreground">
          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {viewMode === "calendar" ? (
        /* Calendar View */
        <div className="grid gap-2 grid-cols-7">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {schedule.map((day, idx) => {
            const stats = getDayStats(day.posts);
            const isToday = day.date.toDateString() === new Date().toDateString();
            
            return (
              <Card
                key={idx}
                className={`p-2 min-h-[100px] cursor-pointer transition-all hover:border-primary/50 ${
                  isToday ? "border-primary bg-primary/5" : "border-border"
                } ${selectedDay?.date.toDateString() === day.date.toDateString() ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedDay(day)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isToday ? "text-primary" : "text-foreground"}`}>
                    {day.date.getDate()}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {stats.total}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {day.posts.slice(0, 4).map(post => (
                    <div
                      key={post.id}
                      className={`w-2 h-2 rounded-full ${getPlatformColor(post.platform).split(" ")[0]}`}
                      title={`${post.platform}: ${post.topic}`}
                    />
                  ))}
                  {day.posts.length > 4 && (
                    <span className="text-xs text-muted-foreground">+{day.posts.length - 4}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {schedule.slice(0, 14).map((day, idx) => (
            <Card key={idx} className="p-4 bg-card border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">{formatDate(day.date)}</h3>
                <Badge variant="outline">{day.posts.length} posts</Badge>
              </div>
              
              <div className="space-y-2">
                {day.posts.map(post => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-background border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${getPlatformColor(post.platform)}`}>
                        {getPlatformIcon(post.platform)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{post.topic}</div>
                        <div className="text-xs text-muted-foreground">
                          {post.contentType} • {post.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(post.status)}
                      <Button variant="ghost" size="sm">
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Day Detail */}
      {selectedDay && (
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {formatDate(selectedDay.date)}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
              Close
            </Button>
          </div>
          
          <div className="space-y-3">
            {selectedDay.posts.map(post => (
              <div
                key={post.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getPlatformColor(post.platform)}`}>
                    {getPlatformIcon(post.platform)}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{post.topic}</div>
                    <div className="text-sm text-muted-foreground">
                      {post.platform.replace("_", " ")} • {post.contentType} • {post.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(post.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Generate content feature coming soon!")}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Generate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strategy Notes */}
      <Card className="p-6 bg-card border-border">
        <h3 className="font-semibold text-foreground mb-4">Posting Strategy (Sintra Playbook)</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-primary">Daily Requirements</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• TikTok: 1 video/day (10 AM optimal)</li>
              <li>• Instagram Reels: 1/day (12 PM optimal)</li>
              <li>• Instagram Stories: 3/day (9 AM, 2 PM, 7 PM)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-primary">Weekly Requirements</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Facebook: 3 posts/week (Mon, Wed, Fri)</li>
              <li>• LinkedIn: 2 posts/week (Tue, Thu)</li>
              <li>• Creator Outreach: 20 DMs/day</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
