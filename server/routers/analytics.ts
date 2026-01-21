/**
 * Analytics Router - Real Data from Just Talk Database
 * 
 * READ-ONLY access to Just Talk platform data for marketing analytics.
 * This router provides real-time metrics without affecting Just Talk operations.
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { queryJustTalk, testJustTalkConnection } from "../_core/justTalkDb";
import { sql } from "drizzle-orm";

export const analyticsRouter = router({
  /**
   * Test connection to Just Talk database
   */
  testConnection: protectedProcedure.query(async () => {
    const connected = await testJustTalkConnection();
    return {
      connected,
      message: connected 
        ? "Connected to Just Talk database (READ-ONLY)" 
        : "Not connected - check JUST_TALK_DATABASE_URL",
    };
  }),

  /**
   * Get overview metrics - calls, chats, payments, clients
   */
  getOverview: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const startDate = input?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = input?.endDate || new Date().toISOString();

      // Get total clients
      const clientsResult = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT COUNT(*) as count FROM clients
        `);
      });

      // Get chat sessions count
      const chatsResult = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT COUNT(*) as count FROM ai_chat_conversations 
          WHERE created_at >= ${startDate}::timestamp 
          AND created_at <= ${endDate}::timestamp
        `);
      });

      // Get call logs count
      const callsResult = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT COUNT(*) as count, 
                 COALESCE(SUM(duration_seconds), 0) as total_duration,
                 COALESCE(SUM(cost_cents), 0) as total_cost
          FROM call_logs 
          WHERE created_at >= ${startDate}::timestamp 
          AND created_at <= ${endDate}::timestamp
        `);
      });

      // Get sessions with payments
      const sessionsResult = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT COUNT(*) as count,
                 COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN price ELSE 0 END), 0) as revenue
          FROM sessions 
          WHERE created_at >= ${startDate}::timestamp 
          AND created_at <= ${endDate}::timestamp
        `);
      });

      // Get active subscriptions
      const subscriptionsResult = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT COUNT(*) as count FROM subscriptions 
          WHERE status = 'active'
        `);
      });

      // Get crisis alerts count
      const crisisResult = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT COUNT(*) as count FROM ai_chat_messages 
          WHERE crisis_flag IS NOT NULL 
          AND crisis_flag != 'none'
          AND created_at >= ${startDate}::timestamp 
          AND created_at <= ${endDate}::timestamp
        `);
      });

      return {
        period: { startDate, endDate },
        metrics: {
          totalClients: Number((clientsResult as any)?.[0]?.count || 0),
          chatSessions: Number((chatsResult as any)?.[0]?.count || 0),
          callsCount: Number((callsResult as any)?.[0]?.count || 0),
          callDurationMinutes: Math.round(Number((callsResult as any)?.[0]?.total_duration || 0) / 60),
          callCostCents: Number((callsResult as any)?.[0]?.total_cost || 0),
          sessionsBooked: Number((sessionsResult as any)?.[0]?.count || 0),
          revenueCents: Number((sessionsResult as any)?.[0]?.revenue || 0),
          activeSubscriptions: Number((subscriptionsResult as any)?.[0]?.count || 0),
          crisisAlerts: Number((crisisResult as any)?.[0]?.count || 0),
        },
      };
    }),

  /**
   * Get daily metrics for charts
   */
  getDailyMetrics: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(30),
    }).optional())
    .query(async ({ input }) => {
      const days = input?.days || 30;

      // Get daily chat sessions
      const dailyChats = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM ai_chat_conversations
          WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `);
      });

      // Get daily calls
      const dailyCalls = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT DATE(created_at) as date, 
                 COUNT(*) as count,
                 SUM(duration_seconds) as total_duration
          FROM call_logs
          WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `);
      });

      // Get daily revenue
      const dailyRevenue = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT DATE(created_at) as date, 
                 SUM(CASE WHEN payment_status = 'paid' THEN price ELSE 0 END) as revenue
          FROM sessions
          WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `);
      });

      return {
        dailyChats: dailyChats || [],
        dailyCalls: dailyCalls || [],
        dailyRevenue: dailyRevenue || [],
      };
    }),

  /**
   * Get recent activity feed
   */
  getRecentActivity: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit || 20;

      // Get recent chat sessions
      const recentChats = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT id, title, created_at, session_id
          FROM ai_chat_conversations
          ORDER BY created_at DESC
          LIMIT ${limit}
        `);
      });

      // Get recent calls
      const recentCalls = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT id, call_type, duration_seconds, status, created_at
          FROM call_logs
          ORDER BY created_at DESC
          LIMIT ${limit}
        `);
      });

      // Get recent sessions/bookings
      const recentSessions = await queryJustTalk(async (db) => {
        return db.execute(sql`
          SELECT id, session_type, status, payment_status, price, scheduled_date, created_at
          FROM sessions
          ORDER BY created_at DESC
          LIMIT ${limit}
        `);
      });

      return {
        recentChats: recentChats || [],
        recentCalls: recentCalls || [],
        recentSessions: recentSessions || [],
      };
    }),

  /**
   * Get client insights
   */
  getClientInsights: protectedProcedure.query(async () => {
    // Get client status distribution
    const statusDistribution = await queryJustTalk(async (db) => {
      return db.execute(sql`
        SELECT status, COUNT(*) as count
        FROM clients
        GROUP BY status
      `);
    });

    // Get clients by location
    const locationDistribution = await queryJustTalk(async (db) => {
      return db.execute(sql`
        SELECT location_country, COUNT(*) as count
        FROM clients
        WHERE location_country IS NOT NULL
        GROUP BY location_country
        ORDER BY count DESC
        LIMIT 10
      `);
    });

    // Get primary goals distribution
    const goalsDistribution = await queryJustTalk(async (db) => {
      return db.execute(sql`
        SELECT 
          CASE 
            WHEN primary_goal ILIKE '%career%' THEN 'Career'
            WHEN primary_goal ILIKE '%health%' THEN 'Health'
            WHEN primary_goal ILIKE '%relationship%' THEN 'Relationships'
            WHEN primary_goal ILIKE '%finance%' OR primary_goal ILIKE '%money%' THEN 'Finance'
            WHEN primary_goal ILIKE '%stress%' OR primary_goal ILIKE '%anxiety%' THEN 'Mental Health'
            ELSE 'Other'
          END as goal_category,
          COUNT(*) as count
        FROM clients
        WHERE primary_goal IS NOT NULL
        GROUP BY goal_category
        ORDER BY count DESC
      `);
    });

    return {
      statusDistribution: statusDistribution || [],
      locationDistribution: locationDistribution || [],
      goalsDistribution: goalsDistribution || [],
    };
  }),

  /**
   * Get AI coach performance metrics
   */
  getAICoachMetrics: protectedProcedure.query(async () => {
    // Get chat feedback ratings
    const feedbackRatings = await queryJustTalk(async (db) => {
      return db.execute(sql`
        SELECT 
          AVG(rating) as avg_rating,
          COUNT(*) as total_rated,
          SUM(CASE WHEN was_helpful = 'true' THEN 1 ELSE 0 END) as helpful_count
        FROM ai_chat_conversations
        WHERE rating IS NOT NULL
      `);
    });

    // Get emotion detection distribution
    const emotionDistribution = await queryJustTalk(async (db) => {
      return db.execute(sql`
        SELECT emotion_detected, COUNT(*) as count
        FROM ai_chat_messages
        WHERE emotion_detected IS NOT NULL
        GROUP BY emotion_detected
        ORDER BY count DESC
        LIMIT 10
      `);
    });

    // Get crisis flag distribution
    const crisisDistribution = await queryJustTalk(async (db) => {
      return db.execute(sql`
        SELECT crisis_flag, COUNT(*) as count
        FROM ai_chat_messages
        WHERE crisis_flag IS NOT NULL AND crisis_flag != 'none'
        GROUP BY crisis_flag
        ORDER BY count DESC
      `);
    });

    return {
      feedbackRatings: feedbackRatings?.[0] || { avg_rating: 0, total_rated: 0, helpful_count: 0 },
      emotionDistribution: emotionDistribution || [],
      crisisDistribution: crisisDistribution || [],
    };
  }),
});
