import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AnalyticsStats {
  todayPageViews: number;
  weekPageViews: number;
  monthPageViews: number;
  totalPageViews: number;
  totalPrayers: number;
  totalSubscribers: number;
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Track a page view by recording it to the analytics table
   * Should be called from main site pages only, not from admin routes
   */
  async trackPageView(): Promise<void> {
    try {
      const insertData = {
        event_type: 'page_view',
        event_data: {
          timestamp: new Date().toISOString(),
          path: window.location.pathname,
          hash: window.location.hash
        }
      };
      
      const result = await this.supabase.client.from('analytics').insert(insertData);
      
      if (result.error) {
        console.error('[Analytics] Insert error:', result.error);
      }
    } catch (error) {
      console.error('[Analytics] Tracking failed:', error);
    }
  }

  async getStats(): Promise<AnalyticsStats> {
    const stats: AnalyticsStats = {
      todayPageViews: 0,
      weekPageViews: 0,
      monthPageViews: 0,
      totalPageViews: 0,
      totalPrayers: 0,
      totalSubscribers: 0,
      loading: false
    };

    try {
      // Use UTC dates for consistency with database (which stores created_at in UTC)
      const now = new Date();
      
      // Today's start in UTC (midnight UTC)
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      
      // Week start (7 days ago from now, in UTC)
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Month start (30 days ago from now, in UTC)
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Execute all queries in parallel for better performance
      const [
        totalResult,
        todayResult,
        weekResult,
        monthResult,
        prayersResult,
        subscribersResult
      ] = await Promise.all([
        // Total page views
        this.supabase.client
          .from('analytics')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'page_view'),

        // Today's page views
        this.supabase.client
          .from('analytics')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'page_view')
          .gte('created_at', todayStart.toISOString()),

        // Week's page views
        this.supabase.client
          .from('analytics')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'page_view')
          .gte('created_at', weekStart.toISOString()),

        // Month's page views
        this.supabase.client
          .from('analytics')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'page_view')
          .gte('created_at', monthStart.toISOString()),

        // Total prayers count
        this.supabase.client
          .from('prayers')
          .select('*', { count: 'exact', head: true }),

        // Total subscribers
        this.supabase.client
          .from('email_subscribers')
          .select('*', { count: 'exact', head: true })
      ]);

      // Process results
      if (totalResult.error) {
        console.error('Error fetching total page views:', totalResult.error);
      } else {
        stats.totalPageViews = totalResult.count || 0;
      }

      if (todayResult.error) {
        console.error('Error fetching today page views:', todayResult.error);
      } else {
        stats.todayPageViews = todayResult.count || 0;
      }

      if (weekResult.error) {
        console.error('Error fetching week page views:', weekResult.error);
      } else {
        stats.weekPageViews = weekResult.count || 0;
      }

      if (monthResult.error) {
        console.error('Error fetching month page views:', monthResult.error);
      } else {
        stats.monthPageViews = monthResult.count || 0;
      }

      if (prayersResult.error) {
        console.error('Error fetching prayers count:', prayersResult.error);
      } else {
        stats.totalPrayers = prayersResult.count || 0;
      }

      if (subscribersResult.error) {
        console.error('Error fetching subscribers count:', subscribersResult.error);
      } else {
        stats.totalSubscribers = subscribersResult.count || 0;
      }

    } catch (error) {
      console.error('Error fetching analytics stats:', error);
    }

    return stats;
  }
}
