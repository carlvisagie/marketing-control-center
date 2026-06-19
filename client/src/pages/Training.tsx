/**
 * Just Talk Marketing Control Center - Training Page
 * Interactive training organism — 10 modules, 20 lessons, quizzes, badge
 * Designed to take an operator from ZERO to fully confident
 * JARVIS Jr. robot guide walks you through every feature
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Trophy,
  Zap,
  RotateCcw,
  Bot,
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
  // ── MODULE 1: Dashboard ───────────────────────────────────────────────────
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
        analogy: "Think of it like the scoreboard at a basketball game — it shows you the score RIGHT NOW, all in one place!",
        content: [
          "The Dashboard is the FIRST thing you see when you open the Just Talk Marketing Control Center.",
          "It's your home base — your command center — your scoreboard. Everything important is right here on one screen.",
          "You never have to go hunting for information. Revenue, robot status, platform connections, and recent activity — all visible immediately.",
        ],
        keyPoints: [
          { icon: "⏸️", text: "System Status — Shows if the marketing robots are ON (Production) or resting (Standby)" },
          { icon: "💰", text: "Revenue Tracking — Current revenue vs. your $1,000 target with a live progress bar" },
          { icon: "📊", text: "Platform Status — Which of your 8 social media accounts are connected and healthy" },
          { icon: "📝", text: "Activity Log — A live diary of everything the system did today" },
          { icon: "📬", text: "Content Queue — Posts waiting in line for your approval before going live" },
          { icon: "📈", text: "Performance Panel — Engagement Rate, Click-Through Rate, and Conversion Rate" },
          { icon: "📅", text: "Today's Summary — Posts Created, Approved, Published, and total Engagement today" },
        ],
        quiz: {
          question: "What does the Dashboard show you?",
          options: [
            "A place to write emails to your friends",
            "Everything happening in your marketing universe — money, posts, robot activity, and platform health",
            "A list of your favorite movies",
            "The weather forecast",
          ],
          correctIndex: 1,
          explanation: "The Dashboard is your command center! Revenue, system status, connected platforms, content queue, and all robot activity — all on one screen. 🎯",
        },
      },
      {
        id: "dashboard-2",
        title: "The 24/7 Attack Button",
        emoji: "⚡",
        analogy: "It's like pressing GO on a race car — once you press it, the robots start working for you non-stop, even while you sleep!",
        content: [
          "At the top of the Dashboard is a big green button called 'Launch 24/7 Attack'. This is the most important button in the whole platform.",
          "When you press it, the AI marketing robots wake up and start working around the clock — creating posts, scheduling content, and growing your audience.",
          "The system will be in STANDBY mode by default. STANDBY means the robots are resting and waiting for your command.",
          "PRODUCTION mode means the robots are fully live and actively working. Always confirm you're ready before switching to Production.",
          "Don't worry — the robots ALWAYS ask for your approval before posting anything publicly.",
        ],
        keyPoints: [
          { icon: "🟢", text: "PRODUCTION — Robots are fully live, working 24/7 on your marketing" },
          { icon: "⏸️", text: "STANDBY — Robots are resting, system is ready but not actively posting" },
          { icon: "✅", text: "You are ALWAYS the boss — every post goes through your Approval Queue first" },
          { icon: "🔄", text: "You can switch between Standby and Production at any time from the Dashboard" },
          { icon: "⏱️", text: "Time Saved counter tracks how many hours the robots have saved you" },
        ],
        quiz: {
          question: "What is the difference between STANDBY and PRODUCTION mode?",
          options: [
            "They are exactly the same thing",
            "STANDBY = robots resting and waiting. PRODUCTION = robots fully live working 24/7 on your marketing",
            "PRODUCTION means the website is broken",
            "STANDBY means the robots are posting without your approval",
          ],
          correctIndex: 1,
          explanation: "STANDBY is the safe resting state — robots are ready but not posting. PRODUCTION is the live state — robots are working around the clock. You control which mode you're in! 👑",
        },
      },
    ],
  },

  // ── MODULE 2: Social Accounts ─────────────────────────────────────────────
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
          "Once connected, you can create ONE piece of content and send it everywhere at once — saving you hours every single day.",
          "Each platform shows its connection status: Connected (green), Not Connected (grey), or Need Refresh (yellow).",
        ],
        keyPoints: [
          { icon: "📘", text: "Facebook — Connect Pages to post updates, images, and videos" },
          { icon: "📸", text: "Instagram — Connect Business accounts for posts and Reels" },
          { icon: "💼", text: "LinkedIn — Connect personal profiles and company pages" },
          { icon: "🎵", text: "TikTok — Generate content and send to your phone for posting" },
          { icon: "🐦", text: "X (Twitter) — Post tweets, threads, and media" },
          { icon: "▶️", text: "YouTube — Upload Shorts and videos to your channel" },
          { icon: "📌", text: "Pinterest — Pin images and infographics to boards" },
          { icon: "🧵", text: "Threads — Post text-based content to Meta's Threads app" },
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
        analogy: "Some platforms let the robot post FOR you automatically (OAuth). Others need you to personally press 'post' on your phone — like TikTok!",
        content: [
          "There are two ways platforms work with Just Talk.",
          "OAuth Ready means the system can post AUTOMATICALLY — Facebook, Instagram, LinkedIn, and X all support this. You connect once and the robot handles everything.",
          "Send to Phone means the system creates the content and sends it to your phone, but YOU tap 'Post' yourself — TikTok works this way due to their platform rules.",
          "If an account shows 'Need Refresh', click the Refresh button to re-authenticate. This happens every few months and is completely normal.",
          "You can add MULTIPLE accounts per platform — for example, both a personal LinkedIn and a company page.",
        ],
        keyPoints: [
          { icon: "🤖", text: "OAuth Ready = Robot posts automatically for you (Facebook, Instagram, LinkedIn, X)" },
          { icon: "📲", text: "Send to Phone = Robot writes it, you post it manually (TikTok)" },
          { icon: "🟢", text: "Connected = Platform is linked and working perfectly" },
          { icon: "🟡", text: "Need Refresh = Click Refresh to re-link the account (happens every few months)" },
          { icon: "⚫", text: "Not Connected = Platform hasn't been linked yet — click Connect to set it up" },
          { icon: "➕", text: "Add Multiple = You can connect more than one account per platform" },
        ],
        quiz: {
          question: "An account shows 'Need Refresh'. What should you do?",
          options: [
            "Delete the account and start over",
            "Panic — the account is broken forever",
            "Click the Refresh button to re-authenticate. This is normal and happens every few months.",
            "Call Facebook support",
          ],
          correctIndex: 2,
          explanation: "Need Refresh is totally normal! Social platforms expire their login tokens every few months for security. Just click Refresh, log in again, and you're good to go. 🔄✅",
        },
      },
    ],
  },

  // ── MODULE 3: Content Creation ────────────────────────────────────────────
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
        analogy: "It's like having a super-smart copywriter on staff 24/7 who knows exactly what to say — and never breaks the rules!",
        content: [
          "The Ad Copy Generator writes your Facebook and Instagram ads FOR you using 5 proven templates based on what works best for Just Talk.",
          "Every template is designed to follow Meta's advertising rules — no banned words, no medical claims, no targeting people based on mental health.",
          "Why does this matter? Using words like 'lonely', 'depressed', or 'anxious' in ads can get your entire ad account BANNED by Meta. The generator keeps you safe.",
          "You can also click 'Generate Variation' to ask the AI to create a fresh version of any template.",
          "Copy the generated text with one click and paste it directly into your Meta Ads Manager.",
        ],
        keyPoints: [
          { icon: "🌙", text: "'The 3 AM Problem' — For people who need someone to talk to late at night" },
          { icon: "📅", text: "'No Schedule Needed' — For people who hate waiting for therapy appointments" },
          { icon: "🔒", text: "'Your Private Space' — For people who value privacy and confidentiality" },
          { icon: "💵", text: "'Affordable Support' — For people worried about the cost of therapy" },
          { icon: "🎁", text: "'7-Day Trial' — For people who want to try before they buy ($7 for 7 days)" },
          { icon: "⚠️", text: "NEVER use: 'lonely', 'depressed', 'anxious', 'mental health', 'therapy' in ads" },
        ],
        quiz: {
          question: "Why does the Ad Copy Generator avoid certain words like 'lonely' or 'depressed'?",
          options: [
            "Because those words are too long to type",
            "Because Meta has strict rules against targeting people based on mental health — using those words can get your ad account permanently banned!",
            "Because the robot doesn't know those words",
            "Because they cost extra money",
          ],
          correctIndex: 1,
          explanation: "Meta has strict rules! Using words that target mental health can get your ads banned — or worse, your entire ad account shut down. The generator keeps everything safe and compliant. Smart robot! 🤖✅",
        },
      },
      {
        id: "copy-2",
        title: "TikTok Content Hub",
        emoji: "🎬",
        analogy: "It's like having a movie director in your pocket — they write the entire script, you just press record!",
        content: [
          "The TikTok Hub is a dedicated tool for creating TikTok content. TikTok is Just Talk's highest-growth platform right now.",
          "You choose a topic (or let the AI pick one), choose a content type, and choose a tone. The AI writes everything else.",
          "The AI generates a complete package: Hook (first 3 seconds), Script (what to say), Caption (post description), and Hashtags (for discovery).",
          "After reviewing, tap 'Send to Phone' and the content is delivered to your phone ready to film.",
          "Content types: Educational Tips, POV Skits, Product Demos, Founder Stories, and Day-in-the-Life.",
          "Post 1 TikTok per day at 10 AM for maximum reach — this is built into the Content Calendar.",
        ],
        keyPoints: [
          { icon: "🎣", text: "Hook — The first 3 seconds that grab attention (most important part!)" },
          { icon: "📜", text: "Script — Word-for-word what to say in the video" },
          { icon: "📝", text: "Caption — The text description that appears under the video" },
          { icon: "#️⃣", text: "Hashtags — Tags to help people discover your video" },
          { icon: "📱", text: "Send to Phone — Delivers the full content package to your phone" },
          { icon: "⏰", text: "Best time to post: 10 AM daily for maximum TikTok algorithm reach" },
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
          explanation: "The TikTok Hub gives you the FULL package — hook to grab attention, script to follow, caption to post, and hashtags to get discovered. You just film it! 🎬🌟",
        },
      },
    ],
  },

  // ── MODULE 4: Campaigns & Calendar ───────────────────────────────────────
  {
    id: "campaigns-calendar",
    number: 4,
    title: "The Master Plan",
    subtitle: "Campaigns & Content Calendar",
    emoji: "📅",
    color: "green",
    description: "Your report card and your monthly map. Track what's working and know exactly what to post every single day.",
    lessons: [
      {
        id: "campaign-1",
        title: "Campaign Tracker & KPIs",
        emoji: "📊",
        analogy: "It's like your school report card — it shows you which subjects you're acing and which ones need more work!",
        content: [
          "The Campaign Tracker shows you the 5 most important numbers (KPIs) for your marketing. These are the numbers that tell you if the business is growing.",
          "KPI stands for Key Performance Indicator — basically, the score that tells you if you're winning.",
          "The strategy section gives you a ready-made game plan based on the Sintra Marketing Playbook — a proven system for growing Just Talk.",
          "Check these numbers every Monday morning to know where to focus your energy for the week.",
        ],
        keyPoints: [
          { icon: "🎯", text: "Landing Page CVR — Target: 5% of visitors start a trial. Below 3%? Fix the landing page." },
          { icon: "💳", text: "Trial → Paid — Target: 35% of trial users become paying customers. Below 25%? Improve onboarding." },
          { icon: "💰", text: "Blended CAC — Target: $45 to acquire one subscriber. Above $60? Optimize your ads." },
          { icon: "📅", text: "D30 Retention — Target: 55% still active after 30 days. Below 40%? Improve the product experience." },
          { icon: "📆", text: "Annual Attach Rate — Target: 20% choose annual plan. Below 10%? Promote annual more aggressively." },
        ],
        quiz: {
          question: "What does 'Trial → Paid' mean in the Campaign Tracker?",
          options: [
            "How many people tried the free pizza and paid for more",
            "The percentage of people who tried Just Talk for free ($7 trial) and then became paying customers",
            "How long it takes to pay your phone bill",
            "The number of paid employees",
          ],
          correctIndex: 1,
          explanation: "Trial → Paid tracks how many people who tried Just Talk decided to keep paying! The target is 35% — meaning 35 out of every 100 trial users become real customers. 💪",
        },
      },
      {
        id: "campaign-2",
        title: "Content Calendar",
        emoji: "🗓️",
        analogy: "It's your daily chore chart — but the robots do most of the chores! You just need to make sure everything gets checked off.",
        content: [
          "The Content Calendar shows you a full 30-day schedule of what needs to be posted and when — based on the Sintra Marketing Playbook.",
          "Every single day has content planned out. You never have to wonder 'what should I post today?' — it's all right here.",
          "You can view it as a calendar (monthly view) or as a list (easier to manage day-by-day).",
          "You can also add your own custom posts by clicking 'Add Event' on any day.",
          "The calendar is colour-coded: each platform has its own colour so you can see at a glance what's going where.",
        ],
        keyPoints: [
          { icon: "🎵", text: "TikTok: 1 video per day at 10 AM — highest reach window" },
          { icon: "📸", text: "Instagram Reels: 1 per day at 12 PM — lunch scroll peak" },
          { icon: "📖", text: "Instagram Stories: 3 per day at 9 AM, 2 PM, 7 PM — catch all 3 daily scroll sessions" },
          { icon: "📘", text: "Facebook: 3 posts per week — Monday, Wednesday, Friday" },
          { icon: "💼", text: "LinkedIn: 2 posts per week — Tuesday and Thursday" },
          { icon: "👋", text: "Creator Outreach: 20 DMs per day to find content creators and collaborators" },
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
          explanation: "3 Instagram Stories per day! Timing matters — 9 AM catches morning scrollers, 2 PM gets the lunch crowd, and 7 PM reaches the evening audience. Consistency is key! 📸⏰",
        },
      },
    ],
  },

  // ── MODULE 5: A/B Tests & Live Metrics ───────────────────────────────────
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
        analogy: "It's like asking 100 people: 'Do you prefer chocolate or vanilla?' — whoever gets more votes WINS and becomes the official flavor!",
        content: [
          "A/B Testing means you make TWO versions of something (Version A and Version B) and show them to different groups of people.",
          "Whichever version gets more clicks, sign-ups, or sales — that's the WINNER! You then use the winner everywhere.",
          "Just Talk tests things like button text, ad headlines, pricing displays, and images every single week.",
          "The system tracks the results automatically and tells you when there's a statistically clear winner.",
          "Run at least one A/B test per week. Start with the biggest impact items: your main CTA button, your headline, and your pricing display.",
        ],
        keyPoints: [
          { icon: "🅰️", text: "Variant A — The control (current version, e.g., 'Start Talking Now' button)" },
          { icon: "🅱️", text: "Variant B — The challenger (new version, e.g., 'Try 7 Days for $7' button)" },
          { icon: "📈", text: "CTR (Click-Through Rate) — % of people who clicked your ad" },
          { icon: "🔄", text: "CVR (Conversion Rate) — % of people who actually signed up after clicking" },
          { icon: "🏆", text: "95% Confidence = Clear winner! Safe to roll out everywhere" },
          { icon: "⏳", text: "Below 90% Confidence = Need more data — keep the test running" },
          { icon: "📅", text: "Run each test for at least 7 days to get reliable results" },
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
          explanation: "'Try 7 Days for $7' CRUSHED it! 10% CTR vs 8%, and 7.97% CVR vs 6%. The trial offer is always more convincing than a direct CTA. Data wins over gut feelings every time! 🏆",
        },
      },
      {
        id: "ab-2",
        title: "Live Metrics",
        emoji: "📡",
        analogy: "It's like a live sports broadcast — you can see the score changing in real time as the game is happening!",
        content: [
          "Live Metrics shows you real data pulled directly from the Just Talk platform database — updated in real time.",
          "This is different from the Dashboard. The Dashboard shows marketing metrics. Live Metrics shows platform usage — how many real people are using Just Talk right now.",
          "You can see: total clients, chat sessions, calls, revenue, and crisis alerts that need immediate attention.",
          "The Recent Activity tab shows individual sessions — who chatted, who called, and who booked a session.",
          "The AI Coach Performance tab shows how well the AI coaches are performing — response quality, session length, and client satisfaction.",
          "Check Live Metrics every morning to see overnight activity and every Friday to review the week.",
        ],
        keyPoints: [
          { icon: "👥", text: "Total Clients — How many people are currently subscribed to Just Talk" },
          { icon: "💬", text: "Chat Sessions — Number of AI coaching conversations in the last 30 days" },
          { icon: "📞", text: "Calls — Number of voice calls and total minutes used" },
          { icon: "💵", text: "Revenue — Money earned in the last 30 days from subscriptions" },
          { icon: "🚨", text: "Crisis Alerts — URGENT: Safety alerts that need your immediate human attention" },
          { icon: "🤖", text: "AI Coach Performance — How well the AI is serving clients (quality scores)" },
        ],
        quiz: {
          question: "What should you do IMMEDIATELY when you see a Crisis Alert in Live Metrics?",
          options: [
            "Ignore it — the AI will handle it",
            "Screenshot it and post it on social media",
            "Give it immediate human attention — crisis alerts are safety situations that require a real person to respond",
            "Delete it to keep the dashboard clean",
          ],
          correctIndex: 2,
          explanation: "Crisis Alerts are URGENT safety situations — a real client may be in distress. These ALWAYS require immediate human attention. Never ignore a crisis alert. This is the most important rule in the platform! 🚨",
        },
      },
    ],
  },

  // ── MODULE 6: Command, Approvals & AI Insights ───────────────────────────
  {
    id: "command-approvals",
    number: 6,
    title: "You're the Boss",
    subtitle: "Command Center, Approvals & AI Insights",
    emoji: "👑",
    color: "orange",
    description: "Give orders to the robots, approve their work, and let AI tell you what's working best. You're always in charge!",
    lessons: [
      {
        id: "command-1",
        title: "Command Center",
        emoji: "🎙️",
        analogy: "It's like talking to a very obedient robot butler. You type 'Post to Facebook' and it just... does it!",
        content: [
          "The Command Center lets you type plain English commands and the system executes them instantly.",
          "You can type commands like 'Post to Facebook', 'Post to LinkedIn', 'Post to All', or 'Check Status'.",
          "There are also quick-action buttons for the most common commands — no typing needed.",
          "Every command you run is saved in the Command History so you always have a record of what was done and when.",
          "Press Ctrl+Enter (or Cmd+Enter on Mac) to execute a command after typing it.",
          "Use 'Check Status' first thing every morning to confirm all systems are running correctly.",
        ],
        keyPoints: [
          { icon: "📘", text: "'Post to Facebook' — Publishes your approved content to Facebook right now" },
          { icon: "💼", text: "'Post to LinkedIn' — Publishes your approved content to LinkedIn right now" },
          { icon: "🌐", text: "'Post to All' — Publishes to ALL connected platforms simultaneously" },
          { icon: "📊", text: "'Check Status' — Shows the current health status of all systems" },
          { icon: "⌨️", text: "Shortcut: Ctrl+Enter (Windows) or Cmd+Enter (Mac) to run a command" },
          { icon: "📜", text: "Command History — Every command ever run, with timestamps" },
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
        analogy: "The Approvals page is like being a teacher — the robots bring you their homework, and you put a gold star on the good ones before they go out to the world!",
        content: [
          "The Approval Queue shows you ALL content the AI has created that's waiting for YOUR review. Nothing goes live without your explicit approval.",
          "There are three types of approvals: Content (social media posts), Code Changes (system updates), and Config/DB Changes (database or settings changes).",
          "For each item, you can Approve (green light — it goes live) or Reject (red light — it gets discarded).",
          "AI Insights is a separate page that analyzes your real platform data and gives you smart, actionable recommendations.",
          "AI Insights tells you: the best times to post, what emotional triggers are working, what content themes are performing, and what to test next.",
          "Check the Approval Queue at least twice a day — morning and afternoon — to keep content flowing.",
        ],
        keyPoints: [
          { icon: "📝", text: "Content Approvals — Social media posts waiting for your green light" },
          { icon: "💻", text: "Code Changes — System updates that need your review before applying" },
          { icon: "🗄️", text: "Config/DB Changes — Database or settings changes needing your sign-off" },
          { icon: "🧠", text: "AI Insights — Smart recommendations based on your real platform data" },
          { icon: "⏰", text: "Best Times to Post — AI tells you exactly when your audience is most active" },
          { icon: "📋", text: "Check Approvals twice daily — morning and afternoon — to keep content flowing" },
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

  // ── MODULE 7: Activity Log ────────────────────────────────────────────────
  {
    id: "activity-log",
    number: 7,
    title: "The Robot's Diary",
    subtitle: "Activity Log",
    emoji: "📋",
    color: "teal",
    description: "See every single thing the AI has done, is doing, and why. Your complete audit trail — nothing is hidden.",
    lessons: [
      {
        id: "activity-1",
        title: "Reading the Activity Log",
        emoji: "🔍",
        analogy: "It's like a security camera recording for your entire marketing system. You can rewind and see exactly what happened, when, and why.",
        content: [
          "The Activity Log records EVERY action taken by the AI agents across your entire platform — every post, every API call, every database query, every error.",
          "This is your audit trail. If something goes wrong, the Activity Log is the first place you look to find out what happened.",
          "Each log entry has a timestamp, a category (AI, Database, API, Phone, Marketing), and a status (Success, Warning, Error, Info).",
          "You can filter by category to focus on just the area you care about — for example, filter by 'Error' to see only problems.",
          "The stats at the top show you today's totals: how many successes, warnings, and errors occurred.",
        ],
        keyPoints: [
          { icon: "✅", text: "Success (Green) — Everything worked perfectly. No action needed." },
          { icon: "⚠️", text: "Warning (Yellow) — Something needs attention but isn't broken yet. Investigate soon." },
          { icon: "❌", text: "Error (Red) — Something failed. Needs immediate attention." },
          { icon: "ℹ️", text: "Info (Blue) — General system information. Just keeping you informed." },
          { icon: "🤖", text: "AI Category — Actions taken by the AI agents (content generation, recommendations)" },
          { icon: "🗄️", text: "Database Category — Reads and writes to the Just Talk database" },
          { icon: "🔌", text: "API Category — Calls to external services (Meta, LinkedIn, TikTok, etc.)" },
          { icon: "📞", text: "Phone Category — Voice call and session activity from the Just Talk platform" },
        ],
        quiz: {
          question: "You see a RED entry in the Activity Log. What does that mean?",
          options: [
            "Everything is fine — red is just a pretty colour",
            "The system is in Christmas mode",
            "An ERROR occurred — something failed and needs your immediate attention",
            "The AI is feeling angry today",
          ],
          correctIndex: 2,
          explanation: "Red = Error = Something failed! Check the error message to understand what went wrong. Common errors include expired social media tokens (fix: go to Social Accounts and refresh) or API connection issues. 🔴",
        },
      },
      {
        id: "activity-2",
        title: "Using Filters & Troubleshooting",
        emoji: "🛠️",
        analogy: "It's like using a search engine for your robot's brain — instead of reading every single entry, you filter to find exactly what you're looking for.",
        content: [
          "The Activity Log can have hundreds of entries per day. Use the filters to find what you need quickly.",
          "Filter by Type (Success/Warning/Error/Info) to focus on problems or confirm things are working.",
          "Filter by Category (AI/Database/API/Phone/Marketing) to focus on a specific part of the system.",
          "When troubleshooting, always filter by 'Error' first to see all failures in one place.",
          "If you see the same error repeating multiple times, that's a pattern — it means something needs to be fixed, not just acknowledged.",
          "The Activity Log is also your proof that the system is working. If you see hundreds of green Success entries, the robots are doing their job!",
        ],
        keyPoints: [
          { icon: "🔴", text: "Troubleshoot Step 1: Filter by 'Error' — see all failures at once" },
          { icon: "🔁", text: "Troubleshoot Step 2: Look for REPEATING errors — patterns mean systemic issues" },
          { icon: "📖", text: "Troubleshoot Step 3: Read the error message carefully — it usually tells you exactly what's wrong" },
          { icon: "🔌", text: "Most common error: 'Token expired' — go to Social Accounts and click Refresh" },
          { icon: "🌐", text: "Second most common: 'API rate limit' — the platform is throttling requests, wait 1 hour" },
          { icon: "✅", text: "Lots of green entries = robots are working hard for you!" },
        ],
        quiz: {
          question: "You see the same 'Token expired' error appearing 10 times in the Activity Log. What's the fix?",
          options: [
            "Restart your computer",
            "Go to the Social Accounts page and click Refresh on the affected platform to re-authenticate",
            "Delete the Activity Log",
            "Wait for it to fix itself",
          ],
          correctIndex: 1,
          explanation: "Token expired means your social media login has timed out. The fix is simple: go to Social Accounts, find the platform showing the error, and click Refresh. Done! 🔄✅",
        },
      },
    ],
  },

  // ── MODULE 8: Feature Flags ───────────────────────────────────────────────
  {
    id: "feature-flags",
    number: 8,
    title: "The Control Panel",
    subtitle: "Feature Flags",
    emoji: "🚦",
    color: "indigo",
    description: "Turn features on or off without touching any code. Like light switches for your platform's capabilities!",
    lessons: [
      {
        id: "flags-1",
        title: "What Are Feature Flags?",
        emoji: "🔦",
        analogy: "Imagine your house has a master control panel with switches for every room's lights. Feature Flags are like that — you can turn any feature ON or OFF instantly, without calling an electrician (developer)!",
        content: [
          "Feature Flags let you enable or disable specific features of the Just Talk platform WITHOUT needing to write or deploy any code.",
          "This is incredibly powerful — you can test new features with a small group of users before rolling them out to everyone.",
          "Flags are organised into 5 categories: Safety, AI, Payment, Development, and Voice.",
          "Each flag has a toggle (ON/OFF) and a Rollout Percentage (0% to 100%) — this controls what percentage of users see the feature.",
          "IMPORTANT: Safety flags should almost NEVER be turned off. They protect your users and your business.",
          "After making changes, click 'Save Changes' — flags are NOT saved automatically.",
        ],
        keyPoints: [
          { icon: "🛡️", text: "Safety Flags — Crisis detection, content guardrails, safety protocols. NEVER disable these." },
          { icon: "🧠", text: "AI Flags — AI coaching features, prompt variations, model settings" },
          { icon: "💳", text: "Payment Flags — Stripe integration, trial settings, pricing features" },
          { icon: "🧪", text: "Development Flags — Beta features, debug modes, experimental tools" },
          { icon: "🎙️", text: "Voice Flags — Voice call features, audio processing settings" },
          { icon: "💾", text: "ALWAYS click 'Save Changes' after modifying flags — changes are pending until saved" },
        ],
        quiz: {
          question: "You want to test a new AI coaching feature with only 10% of users before rolling it out to everyone. What do you do?",
          options: [
            "Turn the flag ON and set the Rollout Percentage to 10%",
            "Turn the flag OFF completely",
            "Delete the flag",
            "Call a developer",
          ],
          correctIndex: 0,
          explanation: "Enable the flag AND set Rollout to 10%! This means only 10% of users will see the new feature. If it works well, increase to 50%, then 100%. This is how you safely test new features. 🚦✅",
        },
      },
      {
        id: "flags-2",
        title: "Rollout Percentages & Safe Changes",
        emoji: "📊",
        analogy: "It's like opening a new restaurant. Instead of inviting the whole city on day one, you invite 10 friends first. If they love it, you invite 100. Then 1,000. Then everyone!",
        content: [
          "The Rollout Percentage controls what percentage of your users see a feature. 0% = nobody sees it. 100% = everyone sees it.",
          "The golden rule of feature flags: NEVER go from 0% to 100% in one step. Always ramp up gradually: 10% → 25% → 50% → 100%.",
          "Watch the Activity Log and Live Metrics closely after each increase. If errors spike or metrics drop, roll back immediately (set to 0%).",
          "Flags marked as 'Modified' (yellow badge) have unsaved changes. Click 'Save Changes' to apply them.",
          "If you're unsure about a flag, hover over it to read the description. When in doubt, don't change it — ask first.",
          "The 'Partial Rollout' counter at the top shows how many flags are currently between 1% and 99%.",
        ],
        keyPoints: [
          { icon: "📈", text: "Safe rollout order: 10% → 25% → 50% → 75% → 100% (wait 24h between each step)" },
          { icon: "👀", text: "After each increase: check Activity Log for errors and Live Metrics for drops" },
          { icon: "🔙", text: "If problems appear: immediately set rollout back to 0% to protect users" },
          { icon: "🟡", text: "'Modified' badge = unsaved change. Click Save Changes before leaving the page." },
          { icon: "🚫", text: "Never disable Safety flags — they protect users from harm" },
          { icon: "❓", text: "Unsure about a flag? Read its description. Still unsure? Leave it alone." },
        ],
        quiz: {
          question: "You enabled a new payment feature and set it to 100% rollout. Users start reporting billing errors. What do you do FIRST?",
          options: [
            "Wait and see if it fixes itself",
            "Immediately set the rollout percentage back to 0% to protect all users, then investigate the errors in the Activity Log",
            "Delete the flag entirely",
            "Send an email to all users apologising",
          ],
          correctIndex: 1,
          explanation: "Roll back FIRST, investigate SECOND! Setting rollout to 0% immediately stops the problem from affecting more users. Then check the Activity Log to understand what went wrong. Speed matters here! 🔙🚨",
        },
      },
    ],
  },

  // ── MODULE 9: Settings ────────────────────────────────────────────────────
  {
    id: "settings",
    number: 9,
    title: "The Engine Room",
    subtitle: "Settings",
    emoji: "⚙️",
    color: "slate",
    description: "Configure how the whole system runs. API keys, posting rules, service health, and security — all in one place.",
    lessons: [
      {
        id: "settings-1",
        title: "System Health & Posting Rules",
        emoji: "🏥",
        analogy: "Settings is like the engine room of a ship. You don't go there every day, but when something needs adjusting, this is where you do it.",
        content: [
          "The Settings page has four main sections: System Health, 24/7 Attack Settings, API Configuration, and Notification Preferences.",
          "System Health shows you the live status of all connected services — the Just Talk Database, OpenAI API, Meta API, LinkedIn API, and TikTok API.",
          "Green = healthy. Yellow = degraded (working but slow). Red = down (not working). Check this if anything seems off.",
          "The 24/7 Attack Settings control HOW the robots post. These are the safety rules for automated posting.",
          "'Require Approval for Posts' should ALWAYS be ON. This ensures you review every post before it goes live.",
          "'Auto-post Low Risk Content' can be turned ON once you trust the system — but start with it OFF.",
        ],
        keyPoints: [
          { icon: "🟢", text: "Service Status Green = All systems healthy and running normally" },
          { icon: "🟡", text: "Service Status Yellow = Service is degraded — working but may be slow" },
          { icon: "🔴", text: "Service Status Red = Service is down — posts to that platform will fail" },
          { icon: "✅", text: "'Require Approval for Posts' — ALWAYS keep this ON. You review everything." },
          { icon: "⚡", text: "'Auto-post Low Risk Content' — Start OFF. Turn ON only after you trust the system." },
          { icon: "📱", text: "'Send to Phone First' — Sends content to your phone for review before posting" },
        ],
        quiz: {
          question: "The Meta API shows a RED status in System Health. What does this mean for your Facebook posts?",
          options: [
            "Facebook posts will work perfectly fine",
            "Facebook posts will fail because the Meta API is down — wait for it to recover before trying to post",
            "You need to create a new Facebook account",
            "The red colour is just a design choice",
          ],
          correctIndex: 1,
          explanation: "Red = Down! If the Meta API is red, any attempt to post to Facebook or Instagram will fail. Check Meta's status page (developers.facebook.com/status) and wait for them to recover. Don't keep retrying — it wastes API quota. ⏳",
        },
      },
      {
        id: "settings-2",
        title: "API Keys & Security",
        emoji: "🔑",
        analogy: "API keys are like the master keys to your kingdom. They're hidden in a vault (Render's environment variables) and should NEVER be shared or shown to anyone.",
        content: [
          "The API Configuration section shows you which external services are connected: Just Talk Database, OpenAI, Meta, LinkedIn, and TikTok.",
          "The actual key values are hidden (shown as ••••••••) for security. This is intentional — you should NEVER see or share a raw API key.",
          "API keys are stored securely in Render's environment variables — NOT in the code. This is the correct and secure way to manage them.",
          "If you need to update an API key (e.g., if it expires or gets compromised), go to your Render dashboard → Environment Variables, NOT this Settings page.",
          "NEVER put API keys in emails, Slack messages, screenshots, or code files. If a key is exposed, rotate it immediately.",
          "Each key has a label showing which environment variable it uses — e.g., OPENAI_API_KEY, META_APP_ID.",
        ],
        keyPoints: [
          { icon: "🔒", text: "API keys are stored in Render environment variables — never in the code" },
          { icon: "🚫", text: "NEVER share API keys via email, Slack, screenshots, or messages" },
          { icon: "🔄", text: "To update a key: go to Render Dashboard → Your Service → Environment → Edit" },
          { icon: "⚠️", text: "If a key is accidentally exposed: rotate it IMMEDIATELY in the provider's dashboard" },
          { icon: "📋", text: "Key names: JUST_TALK_DATABASE_URL, OPENAI_API_KEY, META_APP_ID, META_APP_SECRET" },
          { icon: "🛡️", text: "Regular security practice: rotate API keys every 90 days" },
        ],
        quiz: {
          question: "Someone asks you to send them the OpenAI API key via WhatsApp. What do you do?",
          options: [
            "Send it — they probably need it for something important",
            "NEVER send API keys via any messaging platform. If they legitimately need access, add them to Render with proper permissions instead.",
            "Take a screenshot of the Settings page and send that",
            "Write the key on a sticky note and mail it to them",
          ],
          correctIndex: 1,
          explanation: "NEVER share API keys via messages! If someone needs access to the system, add them as a collaborator in Render with the appropriate permission level. API keys shared via messages can be intercepted and used to rack up massive bills or steal data. 🔐",
        },
      },
    ],
  },

  // ── MODULE 10: Daily Workflow & Troubleshooting ───────────────────────────
  {
    id: "daily-workflow",
    number: 10,
    title: "The Operator's Bible",
    subtitle: "Daily Workflow & Troubleshooting",
    emoji: "📖",
    color: "rose",
    description: "Your complete daily operating guide. What to do every morning, every afternoon, every week — and how to fix anything that breaks.",
    lessons: [
      {
        id: "workflow-1",
        title: "Your Daily Operating Routine",
        emoji: "☀️",
        analogy: "Running this platform is like being the captain of a ship. Every morning you check the instruments, every afternoon you check the crew, and every evening you log the day's progress.",
        content: [
          "Consistency is the secret to success with this platform. Follow this routine every day and the system will grow reliably.",
          "MORNING ROUTINE (15 minutes): Check Dashboard → Check Activity Log for errors → Check Approval Queue → Run 'Check Status' in Command Center.",
          "AFTERNOON ROUTINE (10 minutes): Check Approval Queue again → Review any new AI Insights → Confirm today's Content Calendar posts went out.",
          "WEEKLY ROUTINE (Monday, 30 minutes): Review Campaign Tracker KPIs → Check A/B Test results → Review Live Metrics weekly summary → Plan any new A/B tests.",
          "MONTHLY ROUTINE (1st of month, 1 hour): Full platform health review → Update Content Calendar for the new month → Review and rotate any expiring API keys → Check Feature Flags for any pending changes.",
        ],
        keyPoints: [
          { icon: "🌅", text: "Every Morning: Dashboard → Activity Log → Approvals → Command Center status check" },
          { icon: "☀️", text: "Every Afternoon: Approvals → AI Insights → Confirm posts went live" },
          { icon: "📅", text: "Every Monday: KPIs → A/B Tests → Live Metrics → Plan new tests" },
          { icon: "📆", text: "Every Month: Full health review → Calendar update → API key rotation → Feature Flags review" },
          { icon: "🚨", text: "Anytime: If you see a Crisis Alert in Live Metrics — respond IMMEDIATELY" },
          { icon: "🔴", text: "Anytime: If you see red errors in Activity Log — investigate before end of day" },
        ],
        quiz: {
          question: "It's Monday morning. What's the FIRST thing you should check?",
          options: [
            "TikTok to see if your videos got views",
            "The Dashboard — check system status, revenue progress, and overnight activity",
            "Your personal email",
            "The Feature Flags page",
          ],
          correctIndex: 1,
          explanation: "Always start with the Dashboard! It gives you the full picture in 30 seconds — system status, revenue, platform health, and what happened overnight. Then work through Activity Log → Approvals → Command Center. 🌅",
        },
      },
      {
        id: "workflow-2",
        title: "Troubleshooting Guide",
        emoji: "🔧",
        analogy: "Every machine breaks sometimes. A great operator doesn't panic — they follow a checklist. Here's your checklist for every problem you'll ever face.",
        content: [
          "PROBLEM: Posts aren't going out. SOLUTION: Check Activity Log for errors → Check Social Accounts for 'Need Refresh' → Check Settings for red service status → Run 'Check Status' in Command Center.",
          "PROBLEM: Social account shows 'Need Refresh'. SOLUTION: Go to Social Accounts → Click Refresh on the affected platform → Log in again when prompted → Done.",
          "PROBLEM: Approval Queue is empty but nothing is posting. SOLUTION: Check if system is in STANDBY mode on Dashboard → Switch to PRODUCTION if needed → Check Activity Log for AI generation errors.",
          "PROBLEM: A/B test shows no winner after 2 weeks. SOLUTION: Check if you have enough traffic (need at least 1,000 impressions per variant) → If traffic is low, increase ad spend first.",
          "PROBLEM: Live Metrics shows zero clients. SOLUTION: Check if the Just Talk Database connection is healthy in Settings → Check Activity Log for database errors → This may require contacting technical support.",
          "PROBLEM: Feature flag change caused errors. SOLUTION: Immediately set the rollout back to 0% → Check Activity Log for specific error messages → Investigate before re-enabling.",
        ],
        keyPoints: [
          { icon: "📭", text: "Posts not going out → Activity Log errors → Social Account refresh → Service status check" },
          { icon: "🔄", text: "Account 'Need Refresh' → Social Accounts page → Click Refresh → Log in again" },
          { icon: "😴", text: "Nothing posting → Check if system is in STANDBY mode → Switch to PRODUCTION" },
          { icon: "📊", text: "No A/B winner → Need 1,000+ impressions per variant → Increase traffic first" },
          { icon: "🚦", text: "Flag caused errors → Set rollout to 0% immediately → Investigate → Re-enable carefully" },
          { icon: "🆘", text: "Database issues → Check Settings service health → Contact technical support if red" },
        ],
        quiz: {
          question: "It's 9 AM and no posts went out overnight. You check the Activity Log and see 'Token expired' errors for Instagram. What are your next steps IN ORDER?",
          options: [
            "1. Panic. 2. Call Instagram. 3. Delete the account.",
            "1. Go to Social Accounts. 2. Click Refresh on Instagram. 3. Log in again. 4. Run 'Post to Instagram' in Command Center to catch up.",
            "1. Wait until tomorrow. 2. Hope it fixes itself.",
            "1. Turn off the whole system. 2. Restart everything.",
          ],
          correctIndex: 1,
          explanation: "Perfect troubleshooting flow! Token expired = go refresh it. Then manually trigger the missed posts via Command Center. The whole fix takes under 5 minutes. You're a pro! 🔧✅",
        },
      },
    ],
  },
];

const TOTAL_LESSONS = MODULES.reduce((acc, m) => acc + m.lessons.length, 0);

// ─── Color helpers ────────────────────────────────────────────────────────────

const colorMap: Record<string, { text: string; bg: string; border: string; badgeBg: string; badgeText: string }> = {
  cyan:   { text: "text-cyan-400",    bg: "bg-cyan-400/10",    border: "border-cyan-400/30",    badgeBg: "bg-cyan-400",    badgeText: "text-slate-900" },
  pink:   { text: "text-pink-400",    bg: "bg-pink-400/10",    border: "border-pink-400/30",    badgeBg: "bg-pink-400",    badgeText: "text-slate-900" },
  yellow: { text: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/30",  badgeBg: "bg-yellow-400",  badgeText: "text-slate-900" },
  green:  { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", badgeBg: "bg-emerald-400", badgeText: "text-slate-900" },
  purple: { text: "text-purple-400",  bg: "bg-purple-400/10",  border: "border-purple-400/30",  badgeBg: "bg-purple-400",  badgeText: "text-slate-900" },
  orange: { text: "text-orange-400",  bg: "bg-orange-400/10",  border: "border-orange-400/30",  badgeBg: "bg-orange-400",  badgeText: "text-slate-900" },
  teal:   { text: "text-teal-400",    bg: "bg-teal-400/10",    border: "border-teal-400/30",    badgeBg: "bg-teal-400",    badgeText: "text-slate-900" },
  indigo: { text: "text-indigo-400",  bg: "bg-indigo-400/10",  border: "border-indigo-400/30",  badgeBg: "bg-indigo-400",  badgeText: "text-slate-900" },
  slate:  { text: "text-slate-300",   bg: "bg-slate-700/30",   border: "border-slate-600/40",   badgeBg: "bg-slate-500",   badgeText: "text-white" },
  rose:   { text: "text-rose-400",    bg: "bg-rose-400/10",    border: "border-rose-400/30",    badgeBg: "bg-rose-400",    badgeText: "text-slate-900" },
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
    try {
      const mods = localStorage.getItem("jt-mcc-completed-modules");
      const lessons = localStorage.getItem("jt-mcc-completed-lessons");
      if (mods) setCompletedModules(JSON.parse(mods));
      if (lessons) setCompletedLessons(JSON.parse(lessons));
    } catch {}
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
  const colors = module ? (colorMap[module.color] || colorMap.cyan) : colorMap.cyan;
  const progressPercent = Math.round((completedModules.length / MODULES.length) * 100);
  const nextModuleIndex = MODULES.findIndex(m => !completedModules.includes(m.id));

  // ─── HOME ────────────────────────────────────────────────────────────────────
  if (phase === "home") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
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
                onClick={() => {
                  if (completedModules.length === MODULES.length) {
                    setPhase("all-complete");
                  } else {
                    startModule(nextModuleIndex >= 0 ? nextModuleIndex : 0);
                  }
                }}
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

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: "Modules", value: MODULES.length.toString(), icon: "📚" },
              { label: "Lessons", value: TOTAL_LESSONS.toString(), icon: "🧠" },
              { label: "Minutes", value: "~40", icon: "⏱️" },
              { label: "Badge", value: "1", icon: "🏆" },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-800/60 rounded-lg p-3 text-center">
                <div className="text-lg">{stat.icon}</div>
                <div className="text-white font-bold text-lg">{stat.value}</div>
                <div className="text-slate-500 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Progress */}
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
              "We have <strong className="text-white">10 modules</strong> covering every single feature of the platform — from the Dashboard all the way to your Daily Workflow and Troubleshooting guide.
              Each lesson has a <strong className="text-white">real-world analogy</strong> to make it click, plus a <strong className="text-white">quiz</strong> to lock it in.
              Finish all 10 and earn your <strong className="text-yellow-400">Marketing Commander Badge</strong>! 🏆 Let's go!"
            </p>
          </div>
        </div>

        {/* Module list */}
        <div className="space-y-2">
          <h2 className="text-slate-400 text-xs font-semibold tracking-wider uppercase px-1">Your Learning Path — 10 Modules</h2>
          {MODULES.map((mod, index) => {
            const isCompleted = completedModules.includes(mod.id);
            const isNext = !isCompleted && completedModules.length === index;
            const isLocked = !isCompleted && !isNext;
            const c = colorMap[mod.color] || colorMap.cyan;

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
                    : "bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm",
                    isCompleted ? "bg-emerald-500 text-slate-900" : isNext ? cn(c.badgeBg, c.badgeText) : "bg-slate-800 text-slate-500"
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : mod.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{mod.emoji}</span>
                      <span className={cn("font-semibold text-sm", isCompleted ? "text-emerald-400" : "text-white")}>
                        {mod.title}
                      </span>
                      {isNext && (
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", c.badgeBg, c.badgeText)}>
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
            ALL 10 MODULES COMPLETE!
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            You're officially a<br />
            <span className="text-yellow-400">Marketing Commander!</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            You've mastered all 10 modules of the Just Talk Marketing Control Center.
            You now know every feature, every workflow, and how to fix anything that breaks.
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
              const c = colorMap[mod.color] || colorMap.cyan;
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

          {/* Daily Routine Quick Reference */}
          <div className="bg-slate-800/60 rounded-xl p-4 mb-6 text-left">
            <div className="text-cyan-400 text-xs font-bold tracking-wider mb-3">📋 YOUR DAILY OPERATOR ROUTINE</div>
            <div className="space-y-2">
              {[
                { time: "🌅 Every Morning", tasks: "Dashboard → Activity Log → Approvals → Command Center status" },
                { time: "☀️ Every Afternoon", tasks: "Approvals → AI Insights → Confirm posts went live" },
                { time: "📅 Every Monday", tasks: "KPIs → A/B Tests → Live Metrics → Plan new tests" },
                { time: "📆 Every Month", tasks: "Full health review → Calendar → API keys → Feature Flags" },
                { time: "🚨 Anytime", tasks: "Crisis Alert → Respond IMMEDIATELY with human attention" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <span className="text-slate-400 font-semibold flex-shrink-0 w-36">{item.time}</span>
                  <span className="text-slate-500">{item.tasks}</span>
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
    const nc = nextMod ? (colorMap[nextMod.color] || colorMap.cyan) : colorMap.cyan;
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4 py-8" key={slideKey}>
        <div className={cn("bg-slate-900 border rounded-xl p-8", colors.border)}>
          <div className="text-5xl mb-3">{module.emoji}</div>
          <div className={cn("inline-block rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-4", colors.badgeBg, colors.badgeText)}>
            ✓ MODULE {module.number} COMPLETE!
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            You crushed <span className={colors.text}>{module.title}</span>!
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Amazing work! You now know everything about <strong className="text-white">{module.subtitle}</strong>.
            {nextMod ? ` Up next: ${nextMod.emoji} ${nextMod.title}` : " You've completed ALL modules!"}
          </p>

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
            {nextMod ? (
              <Button onClick={handleNextModule} className={cn("font-bold", nc.badgeBg, nc.badgeText)}>
                {nextMod.emoji} {nextMod.title} <ChevronRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button onClick={() => setPhase("all-complete")} className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold">
                <Trophy className="h-4 w-4 mr-1.5" /> Claim Your Badge!
              </Button>
            )}
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
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase("home")} className="text-slate-500 hover:text-slate-300 px-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Progress value={stepProgress} className="h-2" />
          </div>
          <span className="text-slate-500 text-xs whitespace-nowrap">
            Module {module.number}/{MODULES.length} · Lesson {activeLessonIndex + 1}/{module.lessons.length}
          </span>
        </div>

        <div className="flex justify-center">
          <div className={cn("rounded-full px-4 py-1.5 text-xs font-bold border", colors.text, colors.bg, colors.border)}>
            {module.emoji} MODULE {module.number}: {module.title.toUpperCase()}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">{lesson.emoji}</div>
            <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-5">
            <p className="text-yellow-300 text-sm italic text-center">💡 {lesson.analogy}</p>
          </div>

          <div className="space-y-2 mb-5">
            {lesson.content.map((para, i) => (
              <p key={i} className="text-slate-300 text-sm leading-relaxed">{para}</p>
            ))}
          </div>

          <div className="space-y-2 mb-6">
            <div className="text-slate-500 text-xs font-bold tracking-wider">KEY THINGS TO KNOW</div>
            {lesson.keyPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-slate-800/60 rounded-lg p-2.5">
                <span className="text-base flex-shrink-0">{point.icon}</span>
                <span className="text-slate-300 text-sm leading-relaxed">{point.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg rounded-tl-none p-2.5 text-slate-300 text-sm italic">
              Got it? Let's test what you learned with one quick question! 😊
            </div>
          </div>

          <Button onClick={goToQuiz} className={cn("w-full font-bold", colors.badgeBg, colors.badgeText)}>
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
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase("lesson")} className="text-slate-500 hover:text-slate-300 px-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Progress value={stepProgress} className="h-2" />
          </div>
          <span className="text-slate-500 text-xs whitespace-nowrap">
            Module {module.number}/{MODULES.length} · Quiz {activeLessonIndex + 1}/{module.lessons.length}
          </span>
        </div>

        <div className="flex justify-center">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 text-yellow-400 text-xs font-bold">
            🧠 QUICK QUIZ — {module.emoji} {module.title}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-9 w-9 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-white font-semibold text-base leading-snug">{lesson.quiz.question}</h2>
          </div>

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
            <Button onClick={handleNext} className={cn("w-full font-bold", colors.badgeBg, colors.badgeText)}>
              {activeLessonIndex < module.lessons.length - 1 ? (
                <>Next Lesson <ChevronRight className="h-4 w-4 ml-1.5" /></>
              ) : activeModuleIndex < MODULES.length - 1 ? (
                <>Complete Module! 🎉</>
              ) : (
                <>Claim Your Badge! 🏆</>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
