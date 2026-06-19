/**
 * Just Talk Marketing Control Center - Training Page
 * Interactive training organism — 6 modules, 12 lessons, quizzes, badge
 * Designed to be so simple a 3-year-old could follow along
 * JARVIS Jr. robot guide walks you through every feature
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Trophy,
  BookOpen,
  Zap,
  RotateCcw,
  ExternalLink,
  Bot,
  Star,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Training Data ────────────────────────────────────────────────────────────

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Lesson {
  id: string;
  title: string;
  emoji: string;
  analogy: string;
  content: string[];
  keyPoints: { icon: string; text: string }[];
  quiz: QuizQuestion;
}

interface TrainingModule {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  description: string;
  lessons: Lesson[];
}

const MODULES: TrainingModule[] = [
  {
    id: "dashboard",
    number: 1,
    title: "Mission Control",
    subtitle: "The Dashboard",
    emoji: "🚀",
    color: "cyan",
    description: "Your command center. See everything happening in your Just Talk universe at a glance.",
    lessons: [
      {
        id: "dashboard-1",
        title: "What is the Dashboard?",
        emoji: "🎮",
        analogy: "Think of it like the scoreboard at a basketball game — it shows you the score RIGHT NOW!",
        content: [
          "The Dashboard is the FIRST thing you see when you open the Just Talk Marketing Control Center.",
          "It's your home base — your command center — your scoreboard!",
          "Everything important is right here on one screen, so you never have to go hunting for information.",
        ],
        keyPoints: [
          { icon: "⏸️", text: "System Status — Shows if the marketing robots are ON or on STANDBY" },
          { icon: "💰", text: "Revenue Tracking — Shows money coming in and your $1,000 target" },
          { icon: "📊", text: "Platform Status — Shows which social media accounts are connected" },
          { icon: "📝", text: "Activity Log — Everything the system did today, like a diary" },
          { icon: "📬", text: "Content Queue — Posts waiting to be approved before going live" },
        ],
        quiz: {
          question: "What does the Dashboard show you?",
          options: [
            "A place to write emails to your friends",
            "Everything happening in your marketing universe — money, posts, and robot activity",
            "A list of your favorite movies",
            "The weather forecast",
          ],
          correctIndex: 1,
          explanation: "The Dashboard is your command center! It shows revenue, system status, connected platforms, and all the activity from your marketing robots. 🎯",
        },
      },
      {
        id: "dashboard-2",
        title: "The 24/7 Attack Button",
        emoji: "⚡",
        analogy: "It's like pressing GO on a race car — once you press it, the robots start working for you non-stop!",
        content: [
          "At the top of the Dashboard, there's a big button called 'Launch 24/7 Attack'.",
          "When you press this button, the AI marketing robots wake up and start working around the clock.",
          "They create posts, schedule content, and help grow your audience — even while you sleep!",
          "But don't worry — the robots always ask for your approval before posting anything.",
        ],
        keyPoints: [
          { icon: "🤖", text: "The robots work 24 hours a day, 7 days a week — even at 3 AM!" },
          { icon: "✅", text: "You are always the boss — you approve everything before it goes live" },
          { icon: "🔒", text: "Production Mode means the system is live and real" },
          { icon: "⏸️", text: "Standby Mode means the robots are resting and waiting for you" },
        ],
        quiz: {
          question: "What happens when you press 'Launch 24/7 Attack'?",
          options: [
            "The computer explodes 💥",
            "You get a pizza delivered 🍕",
            "The AI robots wake up and start working on your marketing non-stop",
            "Your social media accounts get deleted",
          ],
          correctIndex: 2,
          explanation: "The 24/7 Attack launches your AI marketing robots! They work around the clock — but YOU still approve everything. You're the boss! 👑",
        },
      },
    ],
  },
  {
    id: "social-accounts",
    number: 2,
    title: "Your Megaphones",
    subtitle: "Social Accounts",
    emoji: "📢",
    color: "pink",
    description: "Connect all your social media accounts. Post to 8 platforms at once with just one click!",
    lessons: [
      {
        id: "social-1",
        title: "Connecting Your Platforms",
        emoji: "🔌",
        analogy: "Imagine you have 8 different megaphones. Instead of shouting into each one separately, you speak into ONE and all 8 shout at the same time!",
        content: [
          "The Social Accounts page is where you plug in all your social media platforms.",
          "Just Talk supports 8 platforms: Facebook, Instagram, LinkedIn, TikTok, X (Twitter), YouTube, Pinterest, and Threads.",
          "Once connected, you can create ONE piece of content and send it everywhere at once!",
          "This saves you HOURS of copying and pasting the same post to different apps.",
        ],
        keyPoints: [
          { icon: "📘", text: "Facebook — Connect Pages to post updates, images, and videos" },
          { icon: "📸", text: "Instagram — Connect Business accounts for posts and Reels" },
          { icon: "💼", text: "LinkedIn — Connect personal profiles and company pages" },
          { icon: "🎵", text: "TikTok — Generate content and send to your phone for posting" },
          { icon: "🐦", text: "X (Twitter) — Post tweets, threads, and media" },
          { icon: "▶️", text: "YouTube — Upload Shorts and videos to your channel" },
        ],
        quiz: {
          question: "How many social media platforms can you connect in Just Talk?",
          options: [
            "Just 1 — only Facebook",
            "3 platforms",
            "8 platforms — Facebook, Instagram, LinkedIn, TikTok, X, YouTube, Pinterest, and Threads",
            "100 platforms",
          ],
          correctIndex: 2,
          explanation: "Just Talk connects to 8 platforms! Post everywhere at once — saving you hours every single day. 🎉",
        },
      },
      {
        id: "social-2",
        title: "OAuth vs Send to Phone",
        emoji: "📱",
        analogy: "Some platforms let the robot post FOR you (OAuth). Others need you to personally press 'post' on your phone — like TikTok!",
        content: [
          "There are two ways platforms work with Just Talk.",
          "OAuth Ready means the system can post AUTOMATICALLY — Facebook, Instagram, LinkedIn, and X all support this.",
          "Send to Phone means the system creates the content and sends it to your phone, but YOU tap 'Post' yourself — TikTok works this way.",
          "TikTok has special rules that require you to post manually, but the robot still writes everything for you!",
        ],
        keyPoints: [
          { icon: "🤖", text: "OAuth Ready = Robot posts automatically for you" },
          { icon: "📲", text: "Send to Phone = Robot writes it, you post it manually" },
          { icon: "🔄", text: "You can add MULTIPLE accounts per platform" },
          { icon: "🔃", text: "Use the Refresh button if an account shows 'Need Refresh'" },
        ],
        quiz: {
          question: "What does 'Send to Phone' mean for TikTok?",
          options: [
            "TikTok calls your phone and reads the post out loud",
            "The robot writes the content and sends it to your phone, but you tap Post yourself",
            "Your phone explodes with notifications",
            "TikTok sends you a gift in the mail",
          ],
          correctIndex: 1,
          explanation: "TikTok's 'Send to Phone' means the AI writes all the content for you, sends it to your phone, and then you just tap Post! Easy peasy. 📱✨",
        },
      },
    ],
  },
  {
    id: "content-creation",
    number: 3,
    title: "The Magic Word Machine",
    subtitle: "Ad Copy Generator & TikTok Hub",
    emoji: "🪄",
    color: "yellow",
    description: "An AI robot that writes perfect, safe ads for you. It knows exactly what words make people want to try Just Talk!",
    lessons: [
      {
        id: "copy-1",
        title: "Ad Copy Generator",
        emoji: "✍️",
        analogy: "It's like having a super-smart parrot that knows exactly what to say — and it never says anything naughty!",
        content: [
          "The Ad Copy Generator writes your Facebook and Instagram ads FOR you using proven templates.",
          "It has 5 ready-made templates based on what works best for Just Talk.",
          "Every template is designed to follow Meta's rules — no banned words, no medical claims.",
          "You can also ask the AI to create custom variations of any template!",
        ],
        keyPoints: [
          { icon: "🌙", text: "'The 3 AM Problem' — For people who need someone to talk to late at night" },
          { icon: "📅", text: "'No Schedule Needed' — For people who hate waiting for appointments" },
          { icon: "🔒", text: "'Your Private Space' — For people who value privacy" },
          { icon: "💵", text: "'Affordable Support' — For people worried about cost" },
          { icon: "🎁", text: "'7-Day Trial' — For people who want to try before they buy ($7 for 7 days)" },
        ],
        quiz: {
          question: "Why does the Ad Copy Generator avoid certain words like 'lonely' or 'depressed'?",
          options: [
            "Because those words are too long to type",
            "Because Meta has rules against targeting people based on mental health — it could get your ads banned!",
            "Because the robot doesn't know those words",
            "Because they cost extra money",
          ],
          correctIndex: 1,
          explanation: "Meta has strict rules! Using words that target mental health can get your ads banned. The generator keeps everything safe and compliant. Smart robot! 🤖✅",
        },
      },
      {
        id: "copy-2",
        title: "TikTok Content Hub",
        emoji: "🎬",
        analogy: "It's like having a movie director in your pocket — they write the script, you just film it!",
        content: [
          "The TikTok Hub is a special tool just for creating TikTok content.",
          "You choose a topic (or let the AI pick one), choose a content type, and choose a tone.",
          "The AI then writes a complete hook, script, caption, and hashtags for you!",
          "You review it, then tap 'Send to Phone' and film the video yourself.",
        ],
        keyPoints: [
          { icon: "🎣", text: "Hook — The first 3 seconds that grab attention" },
          { icon: "📜", text: "Script — What to say in the video" },
          { icon: "📝", text: "Caption — The text description under the video" },
          { icon: "#️⃣", text: "Hashtags — Tags to help people find your video" },
          { icon: "📱", text: "Send to Phone — Delivers everything to your phone ready to film" },
        ],
        quiz: {
          question: "What does the TikTok Content Hub give you when you generate content?",
          options: [
            "Just a hashtag",
            "A complete package: hook, script, caption, AND hashtags — everything you need to film a great video",
            "A dance tutorial",
            "A list of TikTok celebrities to contact",
          ],
          correctIndex: 1,
          explanation: "The TikTok Hub gives you the FULL package — hook, script, caption, and hashtags. You just film it! 🎬🌟",
        },
      },
    ],
  },
  {
    id: "campaigns-calendar",
    number: 4,
    title: "The Master Plan",
    subtitle: "Campaigns & Content Calendar",
    emoji: "📅",
    color: "green",
    description: "Your map for the month and your report card. Track what's working and plan what's coming next!",
    lessons: [
      {
        id: "campaign-1",
        title: "Campaign Tracker",
        emoji: "📊",
        analogy: "It's like your school report card — it shows you which subjects you're acing and which ones need more work!",
        content: [
          "The Campaign Tracker shows you the most important numbers (KPIs) for your marketing.",
          "It tells you how many website visitors are becoming trial users, and how many trial users are becoming paying customers.",
          "It also shows your Blended CAC (how much it costs to get one new customer) and your D30 Retention.",
          "The strategy section gives you a ready-made game plan based on the Sintra Marketing Playbook.",
        ],
        keyPoints: [
          { icon: "🎯", text: "Landing Page CVR — Target: 5% of visitors start a trial" },
          { icon: "💳", text: "Trial → Paid — Target: 35% of trial users become paying customers" },
          { icon: "💰", text: "Blended CAC — Target: $45 to acquire one new subscriber" },
          { icon: "📅", text: "D30 Retention — Target: 55% of users still active after 30 days" },
          { icon: "📆", text: "Annual Attach Rate — Target: 20% of new subscribers choose annual plan" },
        ],
        quiz: {
          question: "What does 'Trial → Paid' mean in the Campaign Tracker?",
          options: [
            "How many people tried the free pizza and paid for more",
            "The percentage of people who tried Just Talk for free and then became paying customers",
            "How long it takes to pay your phone bill",
            "The number of paid employees",
          ],
          correctIndex: 1,
          explanation: "Trial → Paid tracks how many people who tried Just Talk ($7 trial) decided to keep paying! The target is 35%. 💪",
        },
      },
      {
        id: "campaign-2",
        title: "Content Calendar",
        emoji: "🗓️",
        analogy: "It's your daily chore chart — but the robots do most of the chores! You just need to make sure everything gets done.",
        content: [
          "The Content Calendar shows you a full 30-day schedule of what needs to be posted and when.",
          "It's based on the Sintra Marketing Playbook — a proven strategy for growing Just Talk's audience.",
          "Every single day has content planned out, so you never wonder 'what should I post today?'",
          "You can view it as a calendar or as a list, and you can add your own custom posts too.",
        ],
        keyPoints: [
          { icon: "🎵", text: "TikTok: 1 video per day at 10 AM (optimal time)" },
          { icon: "📸", text: "Instagram Reels: 1 per day at 12 PM (optimal time)" },
          { icon: "📖", text: "Instagram Stories: 3 per day at 9 AM, 2 PM, and 7 PM" },
          { icon: "📘", text: "Facebook: 3 posts per week on Monday, Wednesday, Friday" },
          { icon: "💼", text: "LinkedIn: 2 posts per week on Tuesday and Thursday" },
          { icon: "👋", text: "Creator Outreach: 20 DMs per day to find content creators" },
        ],
        quiz: {
          question: "According to the Sintra Playbook, how many Instagram Stories should you post per day?",
          options: [
            "Zero — Instagram is old news",
            "1 Story per day",
            "3 Stories per day — at 9 AM, 2 PM, and 7 PM",
            "100 Stories — more is always better!",
          ],
          correctIndex: 2,
          explanation: "3 Instagram Stories per day! Timing matters — 9 AM, 2 PM, and 7 PM to catch different audiences. Consistency is key! 📸⏰",
        },
      },
    ],
  },
  {
    id: "ab-tests-live",
    number: 5,
    title: "The Science Lab",
    subtitle: "A/B Tests & Live Metrics",
    emoji: "🔬",
    color: "purple",
    description: "Test two versions of your ads to find out which one works better. Let the numbers decide — no guessing!",
    lessons: [
      {
        id: "ab-1",
        title: "A/B Testing",
        emoji: "⚖️",
        analogy: "It's like asking 100 people: 'Do you prefer chocolate or vanilla?' — whoever gets more votes WINS!",
        content: [
          "A/B Testing means you make TWO versions of something (Version A and Version B) and show them to different people.",
          "Whichever version gets more clicks, sign-ups, or sales — that's the WINNER!",
          "Just Talk tests things like button text, ad headlines, pricing, and images every single week.",
          "The system tracks the results automatically and tells you when there's a clear winner.",
        ],
        keyPoints: [
          { icon: "🅰️", text: "Variant A — The first version (e.g., 'Start Talking Now' button)" },
          { icon: "🅱️", text: "Variant B — The second version (e.g., 'Try 7 Days for $7' button)" },
          { icon: "📈", text: "CTR (Click-Through Rate) — How many people clicked the ad" },
          { icon: "🔄", text: "CVR (Conversion Rate) — How many people actually signed up" },
          { icon: "🏆", text: "95% Confidence = Clear winner! Safe to use everywhere" },
        ],
        quiz: {
          question: "In the real A/B test shown in the system, which CTA button WON?",
          options: [
            "'Start Talking Now' — it sounds more urgent",
            "'Try 7 Days for $7' — it won with 95% confidence and a higher CVR of 7.97%",
            "They tied — both were equally good",
            "Neither worked — both were deleted",
          ],
          correctIndex: 1,
          explanation: "'Try 7 Days for $7' CRUSHED it! It had a 10% CTR vs 8%, and a 7.97% CVR vs 6%. The trial offer wins every time. 🏆",
        },
      },
      {
        id: "ab-2",
        title: "Live Metrics",
        emoji: "📡",
        analogy: "It's like a live sports broadcast — you can see the score changing in real time as the game is happening!",
        content: [
          "Live Metrics shows you real data from the Just Talk platform — right now, as it happens.",
          "It shows total clients, chat sessions, calls, revenue, and crisis alerts.",
          "This page connects directly to the Just Talk database, so the numbers are always up to date.",
          "You can also see recent activity: who chatted, who called, and who booked a session.",
        ],
        keyPoints: [
          { icon: "👥", text: "Total Clients — How many people are currently using Just Talk" },
          { icon: "💬", text: "Chat Sessions — Number of conversations in the last 30 days" },
          { icon: "📞", text: "Calls — Number of voice calls and total minutes" },
          { icon: "💵", text: "Revenue — Money earned in the last 30 days" },
          { icon: "🚨", text: "Crisis Alerts — Important safety alerts that need immediate attention" },
        ],
        quiz: {
          question: "What does the Live Metrics page show you?",
          options: [
            "Live sports scores from around the world",
            "Real-time data from the Just Talk platform — clients, chats, calls, and revenue happening RIGHT NOW",
            "The weather in different cities",
            "A live video feed of the office",
          ],
          correctIndex: 1,
          explanation: "Live Metrics is your real-time window into the Just Talk platform! See exactly how many clients are active and how much revenue is coming in. 📡💰",
        },
      },
    ],
  },
  {
    id: "command-approvals",
    number: 6,
    title: "You're the Boss",
    subtitle: "Command Center, Approvals & AI Insights",
    emoji: "👑",
    color: "orange",
    description: "Give orders to the robots, approve their work, and let AI tell you what's working best. You're in charge!",
    lessons: [
      {
        id: "command-1",
        title: "Command Center",
        emoji: "🎙️",
        analogy: "It's like talking to a very obedient robot butler. You say 'Post to Facebook' and it just... does it!",
        content: [
          "The Command Center lets you type plain English commands and the system executes them.",
          "You can type things like 'Post to Facebook', 'Post to LinkedIn', 'Post to All', or 'Check Status'.",
          "There are also quick action buttons for the most common commands.",
          "Every command you run is saved in the Command History so you can see what was done.",
        ],
        keyPoints: [
          { icon: "📘", text: "'Post to Facebook' — Publishes your approved content to Facebook" },
          { icon: "💼", text: "'Post to LinkedIn' — Publishes your approved content to LinkedIn" },
          { icon: "🌐", text: "'Post to All' — Publishes to ALL connected platforms at once" },
          { icon: "📊", text: "'Check Status' — Shows you the current status of all systems" },
          { icon: "📜", text: "Command History — A log of every command that was run" },
        ],
        quiz: {
          question: "What keyboard shortcut runs a command in the Command Center?",
          options: [
            "Ctrl + Z (Undo)",
            "Ctrl + Enter (or Cmd + Enter on Mac)",
            "Ctrl + Alt + Delete",
            "Just yell at the screen",
          ],
          correctIndex: 1,
          explanation: "Ctrl+Enter (or Cmd+Enter on Mac) executes your command! Type what you want, press the magic shortcut, and the robot does it. No yelling required! 😄⌨️",
        },
      },
      {
        id: "command-2",
        title: "Approvals & AI Insights",
        emoji: "✅",
        analogy: "The Approvals page is like being a teacher — the robots bring you their homework, and you put a gold star on the good ones!",
        content: [
          "The Approval Queue shows you all the content the AI has created that's waiting for YOUR review.",
          "There are three types of approvals: Content (social media posts), Code Changes, and Config/DB changes.",
          "You can approve or reject each item — nothing goes live without your say-so!",
          "AI Insights analyzes your real data and gives you smart recommendations on what's working.",
        ],
        keyPoints: [
          { icon: "📝", text: "Content Approvals — Social media posts waiting for your green light" },
          { icon: "💻", text: "Code Changes — System updates that need your approval" },
          { icon: "🗄️", text: "Config/DB Changes — Database or settings changes needing review" },
          { icon: "🧠", text: "AI Insights — Smart recommendations based on your real platform data" },
          { icon: "⏰", text: "Best Times to Post — AI tells you exactly when your audience is most active" },
        ],
        quiz: {
          question: "What happens to AI-generated content BEFORE it gets posted to social media?",
          options: [
            "It gets posted immediately without anyone seeing it",
            "It goes to the Approval Queue where YOU review and approve it first — nothing goes live without your permission",
            "It gets sent to a random stranger for review",
            "The robot decides on its own whether to post it",
          ],
          correctIndex: 1,
          explanation: "YOU are always in control! Every piece of AI-generated content goes to the Approval Queue first. You say YES, then it goes live. The robot works for you! 👑✅",
        },
      },
    ],
  },
];

const TOTAL_LESSONS = MODULES.reduce((acc, m) => acc + m.lessons.length, 0);

// ─── Color helpers ────────────────────────────────────────────────────────────

const colorMap: Record<string, { text: string; bg: string; border: string; badge: string }> = {
  cyan:   { text: "text-cyan-400",   bg: "bg-cyan-400/10",   border: "border-cyan-400/30",   badge: "bg-cyan-400 text-slate-900" },
  pink:   { text: "text-pink-400",   bg: "bg-pink-400/10",   border: "border-pink-400/30",   badge: "bg-pink-400 text-slate-900" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", badge: "bg-yellow-400 text-slate-900" },
  green:  { text: "text-emerald-400",bg: "bg-emerald-400/10",border: "border-emerald-400/30",badge: "bg-emerald-400 text-slate-900" },
  purple: { text: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30", badge: "bg-purple-400 text-slate-900" },
  orange: { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", badge: "bg-orange-400 text-slate-900" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

type Phase = "home" | "lesson" | "quiz" | "module-complete" | "all-complete";

export default function Training() {
  const [phase, setPhase] = useState<Phase>("home");
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [slideKey, setSlideKey] = useState(0);

  useEffect(() => {
    const mods = localStorage.getItem("jt-mcc-completed-modules");
    const lessons = localStorage.getItem("jt-mcc-completed-lessons");
    if (mods) setCompletedModules(JSON.parse(mods));
    if (lessons) setCompletedLessons(JSON.parse(lessons));
  }, []);

  const saveModule = useCallback((id: string) => {
    setCompletedModules(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem("jt-mcc-completed-modules", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const saveLesson = useCallback((id: string) => {
    setCompletedLessons(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem("jt-mcc-completed-lessons", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetProgress = () => {
    localStorage.removeItem("jt-mcc-completed-modules");
    localStorage.removeItem("jt-mcc-completed-lessons");
    setCompletedModules([]);
    setCompletedLessons([]);
    setPhase("home");
    toast.success("Progress reset! Ready to start fresh. 🔄");
  };

  const startModule = (moduleIndex: number) => {
    setActiveModuleIndex(moduleIndex);
    setActiveLessonIndex(0);
    setPhase("lesson");
    setSelectedAnswer(null);
    setIsAnswered(false);
    setSlideKey(k => k + 1);
  };

  const goToQuiz = () => {
    setPhase("quiz");
    setSelectedAnswer(null);
    setIsAnswered(false);
    setSlideKey(k => k + 1);
  };

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    const lesson = MODULES[activeModuleIndex].lessons[activeLessonIndex];
    if (index === lesson.quiz.correctIndex) {
      saveLesson(lesson.id);
      toast.success("Correct! 🎉");
    } else {
      toast.error("Not quite — but check the explanation below! 💪");
    }
  };

  const handleNext = () => {
    const module = MODULES[activeModuleIndex];
    if (activeLessonIndex < module.lessons.length - 1) {
      setActiveLessonIndex(i => i + 1);
      setPhase("lesson");
      setSelectedAnswer(null);
      setIsAnswered(false);
      setSlideKey(k => k + 1);
    } else {
      saveModule(module.id);
      if (activeModuleIndex < MODULES.length - 1) {
        setPhase("module-complete");
        setSlideKey(k => k + 1);
      } else {
        setPhase("all-complete");
        setSlideKey(k => k + 1);
      }
    }
  };

  const handleNextModule = () => {
    startModule(activeModuleIndex + 1);
  };

  const module = MODULES[activeModuleIndex];
  const lesson = module?.lessons[activeLessonIndex];
  const colors = module ? colorMap[module.color] : colorMap.cyan;
  const progressPercent = Math.round((completedModules.length / MODULES.length) * 100);
  const nextModuleIndex = MODULES.findIndex(m => !completedModules.includes(m.id));

  // ─── HOME ────────────────────────────────────────────────────────────────────
  if (phase === "home") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Marketing Academy</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Master every feature of the Control Center — guided by JARVIS Jr. 🤖
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {completedModules.length > 0 && (
                <Button variant="ghost" size="sm" onClick={resetProgress} className="text-slate-500 hover:text-slate-300">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              )}
              <Button
                onClick={() => startModule(nextModuleIndex >= 0 ? nextModuleIndex : 0)}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold"
              >
                {completedModules.length === 0 ? (
                  <><Zap className="h-4 w-4 mr-1.5" /> Start Training</>
                ) : completedModules.length === MODULES.length ? (
                  <><Trophy className="h-4 w-4 mr-1.5" /> View Badge</>
                ) : (
                  <><ChevronRight className="h-4 w-4 mr-1.5" /> Continue</>
                )}
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: "Modules", value: MODULES.length.toString(), icon: "📚" },
              { label: "Lessons", value: TOTAL_LESSONS.toString(), icon: "🧠" },
              { label: "Minutes", value: "~20", icon: "⏱️" },
              { label: "Badge", value: "1", icon: "🏆" },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-800/60 rounded-lg p-3 text-center">
                <div className="text-lg">{stat.icon}</div>
                <div className="text-white font-bold text-lg">{stat.value}</div>
                <div className="text-slate-500 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {completedModules.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Overall Progress</span>
                <span className="text-cyan-400 font-semibold">{completedModules.length}/{MODULES.length} modules complete</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}
        </div>

        {/* JARVIS says */}
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 flex gap-3">
          <div className="h-9 w-9 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Bot className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-cyan-400 text-xs font-bold tracking-wider mb-1">JARVIS JR. SAYS:</div>
            <p className="text-slate-300 text-sm leading-relaxed">
              "Here's the plan: we'll go through <strong className="text-white">6 short modules</strong> together. 
              Each one covers a different part of the Control Center. After each lesson, I'll ask you 
              <strong className="text-white"> one quick question</strong> to make sure it clicked. 
              Finish all 6 and earn your official <strong className="text-yellow-400">Marketing Commander Badge</strong>! 🏆"
            </p>
          </div>
        </div>

        {/* Module list */}
        <div className="space-y-2">
          <h2 className="text-slate-400 text-xs font-semibold tracking-wider uppercase px-1">Your Learning Path</h2>
          {MODULES.map((mod, index) => {
            const isCompleted = completedModules.includes(mod.id);
            const isNext = !isCompleted && completedModules.length === index;
            const isLocked = !isCompleted && !isNext;
            const c = colorMap[mod.color];

            return (
              <button
                key={mod.id}
                onClick={() => !isLocked && startModule(index)}
                disabled={isLocked}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all duration-150",
                  isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50"
                    : isNext
                    ? cn("border-2 hover:opacity-90", c.bg, c.border)
                    : "bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Step circle */}
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm",
                    isCompleted ? "bg-emerald-500 text-slate-900" : isNext ? cn(c.badge) : "bg-slate-800 text-slate-500"
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : mod.number}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{mod.emoji}</span>
                      <span className={cn("font-semibold text-sm", isCompleted ? "text-emerald-400" : "text-white")}>
                        {mod.title}
                      </span>
                      {isNext && (
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", c.badge)}>
                          UP NEXT
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-900">
                          ✓ DONE
                        </span>
                      )}
                    </div>
                    <div className={cn("text-xs mt-0.5", isCompleted ? "text-emerald-400/70" : c.text)}>
                      {mod.subtitle}
                    </div>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">{mod.description}</p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className={cn("h-4 w-4 flex-shrink-0", isCompleted ? "text-emerald-400" : isNext ? c.text : "text-slate-700")} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── ALL COMPLETE ────────────────────────────────────────────────────────────
  if (phase === "all-complete") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-8" key={slideKey}>
        <div className="bg-slate-900 border border-yellow-500/30 rounded-xl p-8">
          <div className="text-6xl mb-4">🏆</div>
          <div className="inline-block bg-yellow-500/20 border border-yellow-500/40 rounded-full px-4 py-1.5 text-yellow-400 text-xs font-bold tracking-wider mb-4">
            TRAINING COMPLETE!
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            You're officially a<br />
            <span className="text-yellow-400">Marketing Commander!</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            You've mastered all 6 modules of the Just Talk Marketing Control Center. 
            JARVIS Jr. is SO proud of you! 🤖❤️
          </p>

          {/* Badge */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6 mb-6 inline-block">
            <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-2" />
            <div className="text-yellow-400 font-bold text-sm">Marketing Commander</div>
            <div className="text-slate-500 text-xs">Just Talk Academy Graduate</div>
          </div>

          {/* Completed modules grid */}
          <div className="grid grid-cols-2 gap-2 mb-6 text-left">
            {MODULES.map(mod => {
              const c = colorMap[mod.color];
              return (
                <div key={mod.id} className={cn("rounded-lg p-3 border flex items-center gap-2", c.bg, c.border)}>
                  <span className="text-lg">{mod.emoji}</span>
                  <div>
                    <div className="text-white text-xs font-semibold">{mod.title}</div>
                    <div className="text-emerald-400 text-xs">✓ Complete</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick cheat sheet */}
          <div className="bg-slate-800/60 rounded-xl p-4 mb-6 text-left">
            <div className="text-cyan-400 text-xs font-bold tracking-wider mb-3">🚀 QUICK REFERENCE CHEAT SHEET</div>
            <div className="space-y-1.5">
              {[
                { emoji: "🏠", text: "Dashboard — Scoreboard. Check revenue, status, and activity." },
                { emoji: "📢", text: "Social Accounts — Connect 8 platforms, post everywhere at once." },
                { emoji: "🪄", text: "Ad Copy Generator — 5 proven templates, all Meta-safe." },
                { emoji: "📅", text: "Content Calendar — 30-day plan: 1 TikTok + 1 Reel + 3 Stories daily." },
                { emoji: "📊", text: "Campaigns — Track CVR (5%), Trial→Paid (35%), CAC ($45)." },
                { emoji: "⚖️", text: "A/B Tests — Test weekly: Hook → CTA → Visual → Offer." },
                { emoji: "🎙️", text: "Command Center — Type 'Post to All' and it happens." },
                { emoji: "✅", text: "Approvals — YOU approve everything before it goes live." },
              ].map((item, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="flex-shrink-0">{item.emoji}</span>
                  <span className="text-slate-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={() => setPhase("home")} variant="outline" className="border-slate-700 text-slate-300">
              <ChevronLeft className="h-4 w-4 mr-1.5" /> Back to Academy
            </Button>
            <Button onClick={resetProgress} variant="outline" className="border-slate-700 text-slate-300">
              <RotateCcw className="h-4 w-4 mr-1.5" /> Retake Training
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MODULE COMPLETE ─────────────────────────────────────────────────────────
  if (phase === "module-complete") {
    const nextMod = MODULES[activeModuleIndex + 1];
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4 py-8" key={slideKey}>
        <div className={cn("bg-slate-900 border rounded-xl p-8", colors.border)}>
          <div className="text-5xl mb-3">{module.emoji}</div>
          <div className={cn("inline-block rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-4", colors.badge)}>
            ✓ MODULE {module.number} COMPLETE!
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            You crushed <span className={colors.text}>{module.title}</span>!
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Amazing work! You now know everything about <strong className="text-white">{module.subtitle}</strong>.
            {nextMod ? " Ready for the next challenge?" : " You've completed ALL modules!"}
          </p>

          {/* What you learned */}
          <div className="bg-slate-800/60 rounded-xl p-4 mb-6 text-left">
            <div className="text-slate-500 text-xs font-bold tracking-wider mb-3">WHAT YOU LEARNED</div>
            {module.lessons.map(l => (
              <div key={l.id} className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{l.title}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={() => setPhase("home")} variant="outline" className="border-slate-700 text-slate-300">
              <ChevronLeft className="h-4 w-4 mr-1.5" /> Back to Academy
            </Button>
            <Button
              onClick={handleNextModule}
              className={cn("font-bold text-slate-900", nextMod ? `bg-${nextMod.color}-400 hover:bg-${nextMod.color}-300` : "bg-yellow-400 hover:bg-yellow-300")}
              style={{ background: nextMod ? undefined : "#FBBF24" }}
            >
              {nextMod ? (
                <>{nextMod.emoji} {nextMod.title} <ChevronRight className="h-4 w-4 ml-1.5" /></>
              ) : (
                <><Trophy className="h-4 w-4 mr-1.5" /> Claim Your Badge!</>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LESSON ──────────────────────────────────────────────────────────────────
  if (phase === "lesson") {
    const totalSteps = module.lessons.length * 2;
    const currentStep = activeLessonIndex * 2;
    const stepProgress = Math.round((currentStep / totalSteps) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-4" key={slideKey}>
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase("home")} className="text-slate-500 hover:text-slate-300 px-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Progress value={stepProgress} className="h-2" />
          </div>
          <span className="text-slate-500 text-xs">{currentStep}/{totalSteps}</span>
        </div>

        {/* Module badge */}
        <div className="flex justify-center">
          <div className={cn("rounded-full px-4 py-1.5 text-xs font-bold border", colors.text, colors.bg, colors.border)}>
            {module.emoji} MODULE {module.number}: {module.title.toUpperCase()}
          </div>
        </div>

        {/* Lesson card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">{lesson.emoji}</div>
            <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
          </div>

          {/* Analogy */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-5">
            <p className="text-yellow-300 text-sm italic text-center">💡 {lesson.analogy}</p>
          </div>

          {/* Content */}
          <div className="space-y-2 mb-5">
            {lesson.content.map((para, i) => (
              <p key={i} className="text-slate-300 text-sm leading-relaxed">{para}</p>
            ))}
          </div>

          {/* Key points */}
          <div className="space-y-2 mb-6">
            <div className="text-slate-500 text-xs font-bold tracking-wider">KEY THINGS TO KNOW</div>
            {lesson.keyPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-slate-800/60 rounded-lg p-2.5">
                <span className="text-base flex-shrink-0">{point.icon}</span>
                <span className="text-slate-300 text-sm leading-relaxed">{point.text}</span>
              </div>
            ))}
          </div>

          {/* JARVIS message */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg rounded-tl-none p-2.5 text-slate-300 text-sm italic">
              Got it? Let's test what you learned! I'll ask you one quick question. 😊
            </div>
          </div>

          <Button onClick={goToQuiz} className={cn("w-full font-bold text-slate-900", colors.badge)}>
            Got it! Quiz Time <ChevronRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── QUIZ ────────────────────────────────────────────────────────────────────
  if (phase === "quiz") {
    const isCorrect = selectedAnswer === lesson.quiz.correctIndex;
    const totalSteps = module.lessons.length * 2;
    const currentStep = activeLessonIndex * 2 + 1;
    const stepProgress = Math.round((currentStep / totalSteps) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-4" key={slideKey}>
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase("lesson")} className="text-slate-500 hover:text-slate-300 px-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Progress value={stepProgress} className="h-2" />
          </div>
          <span className="text-slate-500 text-xs">{currentStep}/{totalSteps}</span>
        </div>

        {/* Quiz badge */}
        <div className="flex justify-center">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 text-yellow-400 text-xs font-bold">
            🧠 QUICK QUIZ — {module.emoji} {module.title}
          </div>
        </div>

        {/* Quiz card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-white font-semibold text-base leading-snug">{lesson.quiz.question}</h2>
          </div>

          {/* Options */}
          <div className="space-y-2.5 mb-5">
            {lesson.quiz.options.map((option, i) => {
              let optStyle = "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500";
              if (isAnswered) {
                if (i === lesson.quiz.correctIndex) {
                  optStyle = "bg-emerald-500/15 border-emerald-500/50 text-emerald-300";
                } else if (i === selectedAnswer) {
                  optStyle = "bg-red-500/15 border-red-500/50 text-red-300";
                } else {
                  optStyle = "bg-slate-800/30 border-slate-800 text-slate-500";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={isAnswered}
                  className={cn(
                    "w-full text-left rounded-lg border p-3.5 text-sm font-medium transition-all duration-150",
                    optStyle,
                    !isAnswered && "cursor-pointer"
                  )}
                >
                  <span className="text-slate-500 mr-2">{["A", "B", "C", "D"][i]}.</span>
                  {option}
                  {isAnswered && i === lesson.quiz.correctIndex && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 inline ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {isAnswered && (
            <div className={cn(
              "rounded-lg p-4 mb-5 flex gap-3",
              isCorrect ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-orange-500/10 border border-orange-500/30"
            )}>
              <span className="text-2xl flex-shrink-0">{isCorrect ? "🎉" : "💪"}</span>
              <div>
                <div className={cn("font-bold text-sm mb-1", isCorrect ? "text-emerald-400" : "text-orange-400")}>
                  {isCorrect ? "Correct! Amazing! 🌟" : "Not quite — but that's okay!"}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{lesson.quiz.explanation}</p>
              </div>
            </div>
          )}

          {isAnswered && (
            <Button onClick={handleNext} className={cn("w-full font-bold text-slate-900", colors.badge)}>
              {activeLessonIndex < module.lessons.length - 1 ? (
                <>Next Lesson <ChevronRight className="h-4 w-4 ml-1.5" /></>
              ) : (
                <>Complete Module! 🎉</>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
