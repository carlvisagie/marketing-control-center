/**
 * Self-Reporting Router - Autonomous Notifications & Summaries
 * 
 * Generates and sends daily/weekly marketing performance summaries.
 * This is the "self-reporting" component of the autonomous marketing engine.
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { queryJustTalk } from "../_core/justTalkDb";
import { sql } from "drizzle-orm";
import { invokeLLM } from "../_core/openai";

// Helper to extract string content from LLM response
function extractContent(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    const textPart = content.find(p => p.type === "text" && p.text);
    return textPart?.text || "";
  }
  return "";
}

export const reportingRouter = router({
  /**
   * Generate daily performance summary
   */
  generateDailySummary: publicProcedure.mutation(async () => {
    // Get today's metrics from Just Talk
    const todayMetrics = await queryJustTalk(async (db) => {
      const result = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM ai_chat_conversations WHERE DATE(created_at) = CURRENT_DATE) as chats_today,
          (SELECT COUNT(*) FROM call_logs WHERE DATE(created_at) = CURRENT_DATE) as calls_today,
          (SELECT COUNT(*) FROM clients WHERE DATE(created_at) = CURRENT_DATE) as new_clients_today,
          (SELECT COUNT(*) FROM subscriptions WHERE DATE(created_at) = CURRENT_DATE) as new_subscriptions_today
      `);
      return result;
    });

    // Get yesterday's metrics for comparison
    const yesterdayMetrics = await queryJustTalk(async (db) => {
      const result = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM ai_chat_conversations WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day') as chats_yesterday,
          (SELECT COUNT(*) FROM call_logs WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day') as calls_yesterday,
          (SELECT COUNT(*) FROM clients WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day') as new_clients_yesterday,
          (SELECT COUNT(*) FROM subscriptions WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day') as new_subscriptions_yesterday
      `);
      return result;
    });

    // Calculate changes
    const today = (todayMetrics as any)?.[0] || {};
    const yesterday = (yesterdayMetrics as any)?.[0] || {};

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const summary = {
      date: new Date().toISOString().split('T')[0],
      metrics: {
        chats: {
          today: Number(today.chats_today) || 0,
          yesterday: Number(yesterday.chats_yesterday) || 0,
          change: calculateChange(
            Number(today.chats_today) || 0,
            Number(yesterday.chats_yesterday) || 0
          ),
        },
        calls: {
          today: Number(today.calls_today) || 0,
          yesterday: Number(yesterday.calls_yesterday) || 0,
          change: calculateChange(
            Number(today.calls_today) || 0,
            Number(yesterday.calls_yesterday) || 0
          ),
        },
        newClients: {
          today: Number(today.new_clients_today) || 0,
          yesterday: Number(yesterday.new_clients_yesterday) || 0,
          change: calculateChange(
            Number(today.new_clients_today) || 0,
            Number(yesterday.new_clients_yesterday) || 0
          ),
        },
        subscriptions: {
          today: Number(today.new_subscriptions_today) || 0,
          yesterday: Number(yesterday.new_subscriptions_yesterday) || 0,
          change: calculateChange(
            Number(today.new_subscriptions_today) || 0,
            Number(yesterday.new_subscriptions_yesterday) || 0
          ),
        },
      },
    };

    // Generate AI insights
    const prompt = `You are a marketing analyst for "Just Talk" mental health coaching platform.

Based on today's performance data, provide a brief daily summary:

Today's Metrics:
- Chat Sessions: ${summary.metrics.chats.today} (${summary.metrics.chats.change > 0 ? '+' : ''}${summary.metrics.chats.change}% vs yesterday)
- Voice Calls: ${summary.metrics.calls.today} (${summary.metrics.calls.change > 0 ? '+' : ''}${summary.metrics.calls.change}% vs yesterday)
- New Clients: ${summary.metrics.newClients.today} (${summary.metrics.newClients.change > 0 ? '+' : ''}${summary.metrics.newClients.change}% vs yesterday)
- New Subscriptions: ${summary.metrics.subscriptions.today} (${summary.metrics.subscriptions.change > 0 ? '+' : ''}${summary.metrics.subscriptions.change}% vs yesterday)

Provide a brief, actionable summary in JSON format:
{
  "headline": "One-line summary of the day",
  "highlights": ["Key positive points"],
  "concerns": ["Any areas needing attention"],
  "recommendation": "One key action for tomorrow"
}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a concise marketing analyst. Respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      });

      const content = extractContent(response.choices[0]?.message?.content || "");
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return {
          ...summary,
          aiInsights: JSON.parse(jsonMatch[0]),
        };
      }

      return summary;
    } catch (error) {
      console.error("[Reporting] AI summary error:", error);
      return summary;
    }
  }),

  /**
   * Generate weekly performance report
   */
  generateWeeklyReport: publicProcedure.mutation(async () => {
    // Get this week's metrics
    const weekMetrics = await queryJustTalk(async (db) => {
      const result = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as chats
        FROM ai_chat_conversations
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);
      return result;
    });

    const callMetrics = await queryJustTalk(async (db) => {
      const result = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as calls
        FROM call_logs
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);
      return result;
    });

    const clientMetrics = await queryJustTalk(async (db) => {
      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as total_new_clients,
          COUNT(DISTINCT DATE(created_at)) as active_days
        FROM clients
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      `);
      return result;
    });

    // Get last week's totals for comparison
    const lastWeekTotals = await queryJustTalk(async (db) => {
      const result = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM ai_chat_conversations WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days') as chats_last_week,
          (SELECT COUNT(*) FROM call_logs WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days') as calls_last_week,
          (SELECT COUNT(*) FROM clients WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days') as clients_last_week
      `);
      return result;
    });

    const thisWeekChats = (weekMetrics as any[])?.reduce((sum: number, row: any) => sum + Number(row.chats || 0), 0) || 0;
    const thisWeekCalls = (callMetrics as any[])?.reduce((sum: number, row: any) => sum + Number(row.calls || 0), 0) || 0;
    const thisWeekClients = Number((clientMetrics as any)?.[0]?.total_new_clients) || 0;
    
    const lastWeek = (lastWeekTotals as any)?.[0] || {};

    const report = {
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      totals: {
        chats: thisWeekChats,
        calls: thisWeekCalls,
        newClients: thisWeekClients,
      },
      comparison: {
        chatsChange: lastWeek.chats_last_week 
          ? Math.round(((thisWeekChats - Number(lastWeek.chats_last_week)) / Number(lastWeek.chats_last_week)) * 100)
          : 0,
        callsChange: lastWeek.calls_last_week
          ? Math.round(((thisWeekCalls - Number(lastWeek.calls_last_week)) / Number(lastWeek.calls_last_week)) * 100)
          : 0,
        clientsChange: lastWeek.clients_last_week
          ? Math.round(((thisWeekClients - Number(lastWeek.clients_last_week)) / Number(lastWeek.clients_last_week)) * 100)
          : 0,
      },
      dailyBreakdown: {
        chats: weekMetrics || [],
        calls: callMetrics || [],
      },
    };

    return report;
  }),

  /**
   * Check for anomalies and generate alerts
   */
  checkAnomalies: publicProcedure.query(async () => {
    const alerts: Array<{
      type: "warning" | "critical" | "info";
      category: string;
      message: string;
      metric: string;
      value: number;
      threshold: number;
    }> = [];

    // Check for sudden drops in engagement
    const recentActivity = await queryJustTalk(async (db) => {
      const result = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM ai_chat_conversations WHERE created_at >= NOW() - INTERVAL '1 hour') as chats_last_hour,
          (SELECT COUNT(*) FROM ai_chat_conversations WHERE created_at >= NOW() - INTERVAL '2 hours' AND created_at < NOW() - INTERVAL '1 hour') as chats_prev_hour,
          (SELECT AVG(hourly_count) FROM (
            SELECT COUNT(*) as hourly_count 
            FROM ai_chat_conversations 
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE_TRUNC('hour', created_at)
          ) as hourly_avg) as avg_hourly_chats
      `);
      return result;
    });

    const activity = (recentActivity as any)?.[0] || {};
    const lastHourChats = Number(activity.chats_last_hour) || 0;
    const avgHourlyChats = Number(activity.avg_hourly_chats) || 0;

    // Alert if current hour is significantly below average
    if (avgHourlyChats > 0 && lastHourChats < avgHourlyChats * 0.3) {
      alerts.push({
        type: "warning",
        category: "engagement",
        message: `Chat activity is ${Math.round((1 - lastHourChats/avgHourlyChats) * 100)}% below average`,
        metric: "chats_per_hour",
        value: lastHourChats,
        threshold: avgHourlyChats * 0.3,
      });
    }

    // Check for high crisis detection rate
    const crisisRate = await queryJustTalk(async (db) => {
      const result = await db.execute(sql`
        SELECT 
          COUNT(*) FILTER (WHERE emotion_detected IN ('crisis', 'distress', 'suicidal')) as crisis_count,
          COUNT(*) as total_messages
        FROM ai_chat_messages
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `);
      return result;
    });

    const crisis = (crisisRate as any)?.[0] || {};
    const crisisCount = Number(crisis.crisis_count) || 0;
    const totalMessages = Number(crisis.total_messages) || 1;
    const crisisPercentage = (crisisCount / totalMessages) * 100;

    if (crisisPercentage > 10) {
      alerts.push({
        type: "critical",
        category: "safety",
        message: `High crisis detection rate: ${crisisPercentage.toFixed(1)}% of messages`,
        metric: "crisis_rate",
        value: crisisPercentage,
        threshold: 10,
      });
    }

    // Check for no activity (system might be down)
    if (lastHourChats === 0 && avgHourlyChats > 2) {
      alerts.push({
        type: "critical",
        category: "system",
        message: "No chat activity in the last hour - system may be down",
        metric: "chats_per_hour",
        value: 0,
        threshold: 1,
      });
    }

    return {
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.type === "critical").length,
        warnings: alerts.filter(a => a.type === "warning").length,
      },
      checkedAt: new Date().toISOString(),
    };
  }),

  /**
   * Format summary for SMS/WhatsApp notification
   */
  formatForNotification: publicProcedure
    .input(z.object({
      summary: z.object({
        date: z.string(),
        metrics: z.object({
          chats: z.object({ today: z.number(), change: z.number() }),
          calls: z.object({ today: z.number(), change: z.number() }),
          newClients: z.object({ today: z.number(), change: z.number() }),
          subscriptions: z.object({ today: z.number(), change: z.number() }),
        }),
        aiInsights: z.object({
          headline: z.string(),
          recommendation: z.string(),
        }).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const { summary } = input;
      const m = summary.metrics;

      const formatChange = (change: number) => {
        if (change > 0) return `↑${change}%`;
        if (change < 0) return `↓${Math.abs(change)}%`;
        return "→";
      };

      const message = `📊 Just Talk Daily Summary (${summary.date})

💬 Chats: ${m.chats.today} ${formatChange(m.chats.change)}
📞 Calls: ${m.calls.today} ${formatChange(m.calls.change)}
👤 New Clients: ${m.newClients.today} ${formatChange(m.newClients.change)}
💳 Subscriptions: ${m.subscriptions.today} ${formatChange(m.subscriptions.change)}

${summary.aiInsights?.headline || ""}

💡 ${summary.aiInsights?.recommendation || "Keep up the good work!"}`;

      return {
        message,
        characterCount: message.length,
        segments: Math.ceil(message.length / 160), // SMS segments
      };
    }),
});
