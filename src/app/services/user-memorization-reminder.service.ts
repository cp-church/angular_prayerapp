import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UserSessionService } from './user-session.service';
import type { UserMemorizationHourReminderSlot } from '../types/user-memorization-hour-reminder';

/** Revalidate cache in background after this many ms (stale-while-revalidate). */
const STALE_MS = 10 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class UserMemorizationReminderService {
  /** Bumped on mutations and new fetches so stale in-flight responses are ignored. */
  private fetchGeneration = 0;

  constructor(
    private supabase: SupabaseService,
    private userSession: UserSessionService
  ) {}

  /**
   * Return cached slots if fresh; if stale, return cache and refresh in background.
   * If never loaded, fetches from Supabase and updates session cache.
   */
  async ensureLoaded(forceRefresh = false): Promise<UserMemorizationHourReminderSlot[]> {
    const session = this.userSession.getCurrentSession();
    if (!session?.email?.trim()) {
      return [];
    }
    const email = session.email.trim();
    const cached = session.memorizationHourReminders;
    const fetchedAt = session.memorizationHourRemindersFetchedAt ?? 0;
    const age = Date.now() - fetchedAt;

    if (!forceRefresh && cached !== undefined && age < STALE_MS) {
      return cached;
    }
    if (!forceRefresh && cached !== undefined && age >= STALE_MS) {
      void this.fetchAndUpdateSession(email).catch(() => undefined);
      return cached;
    }
    return this.fetchAndUpdateSession(email);
  }

  private async fetchAndUpdateSession(
    email: string
  ): Promise<UserMemorizationHourReminderSlot[]> {
    const generation = ++this.fetchGeneration;
    const { data, error } = await this.supabase.client
      .from('user_memorization_hour_reminders')
      .select('id, iana_timezone, local_hour')
      .eq('user_email', email)
      .order('local_hour', { ascending: true });

    if (error) {
      throw error;
    }
    const slots = (data ?? []) as UserMemorizationHourReminderSlot[];
    if (
      generation !== this.fetchGeneration ||
      !this.sessionStillMatches(email)
    ) {
      return slots;
    }
    await this.userSession.updateUserSession({
      memorizationHourReminders: slots,
      memorizationHourRemindersFetchedAt: Date.now(),
    });
    return slots;
  }

  /** Ignore stale fetches after logout or account switch. */
  private sessionStillMatches(email: string): boolean {
    const current = this.userSession.getCurrentSession()?.email?.trim();
    return !!current && current === email.trim();
  }

  async addSlot(
    email: string,
    ianaTimezone: string,
    localHour: number
  ): Promise<UserMemorizationHourReminderSlot[]> {
    this.fetchGeneration++;
    const { error } = await this.supabase.client.from('user_memorization_hour_reminders').insert({
      user_email: email.trim(),
      iana_timezone: ianaTimezone,
      local_hour: localHour,
    });
    if (error) {
      throw error;
    }
    return this.fetchAndUpdateSession(email.trim());
  }

  async removeSlot(email: string, id: string): Promise<UserMemorizationHourReminderSlot[]> {
    this.fetchGeneration++;
    const { error } = await this.supabase.client
      .from('user_memorization_hour_reminders')
      .delete()
      .eq('id', id)
      .eq('user_email', email.trim());
    if (error) {
      throw error;
    }
    return this.fetchAndUpdateSession(email.trim());
  }
}
