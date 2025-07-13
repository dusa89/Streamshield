import { supabase } from "@/lib/supabaseClient";
import { Track } from "@/types/track";

// Types for Supabase data
interface UserHistoryRecord {
  id: string;
  user_profile_id: string;
  track_id: string;
  track_name: string;
  artist_name: string;
  artist_id?: string;
  album_name: string;
  album_id?: string;
  album_art_url?: string;
  duration_ms?: number;
  played_at: string;
  created_at: string;
}

interface UserShieldSessionRecord {
  id: string;
  user_profile_id: string;
  session_start: string;
  session_end?: string;
  created_at: string;
}

interface UserTimeRuleRecord {
  id: string;
  user_profile_id: string;
  rule_id: string;
  rule_name: string;
  days: string[];
  start_time: string;
  end_time: string;
  enabled: boolean;
  created_at: string;
}

interface UserDeviceRuleRecord {
  id: string;
  user_profile_id: string;
  rule_id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  enabled: boolean;
  auto_shield: boolean;
  shield_duration?: number;
  created_at: string;
}

class CloudSyncService {
  private userProfileId: string | null = null;

  /**
   * Get or create user profile
   */
  async ensureUserProfile(spotifyUserId: string): Promise<string> {
    if (this.userProfileId) {
      return this.userProfileId;
    }

    // Try to get existing profile
    const { data } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("spotify_user_id", spotifyUserId)
      .single();

    if (data) {
      this.userProfileId = data.id;
      return data.id;
    }

    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from("user_profiles")
      .insert({
        spotify_user_id: spotifyUserId,
        last_sync_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError) {
      throw new Error(`Failed to create user profile: ${createError.message}`);
    }

    if (!newProfile?.id) {
      throw new Error("Failed to create user profile: No ID returned");
    }

    this.userProfileId = newProfile.id;
    return newProfile.id;
  }

  /**
   * Sync user history to cloud
   */
  async syncHistory(spotifyUserId: string, tracks: Track[]): Promise<void> {
    const profileId = await this.ensureUserProfile(spotifyUserId);

    // Convert tracks to history records
    const historyRecords: Omit<
      UserHistoryRecord,
      "id" | "user_profile_id" | "created_at"
    >[] = tracks.map((track) => ({
      track_id: track.id,
      track_name: track.name,
      artist_name: track.artist,
      artist_id: track.artistId,
      album_name: track.album,
      album_id: track.albumId,
      album_art_url: track.albumArt,
      duration_ms: track.duration,
      played_at: track.timestamp
        ? new Date(track.timestamp).toISOString()
        : new Date().toISOString(),
    }));

    if (historyRecords.length === 0) return;

    // Insert history records (ignore conflicts due to unique constraint)
    const { error } = await supabase.from("user_history").upsert(
      historyRecords.map((record) => ({
        ...record,
        user_profile_id: profileId,
      })),
      { onConflict: "user_profile_id,track_id,played_at" },
    );

    if (error) {
      throw new Error(`Failed to sync history: ${error.message}`);
    }

    // Update last sync time
    await this.updateLastSync(profileId);
  }

  /**
   * Fetch user history from cloud
   */
  async fetchHistory(
    spotifyUserId: string,
    limit: number = 50,
  ): Promise<Track[]> {
    const profileId = await this.ensureUserProfile(spotifyUserId);

    const { data, error } = await supabase
      .from("user_history")
      .select("*")
      .eq("user_profile_id", profileId)
      .order("played_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }

    return data.map((record) => ({
      id: record.track_id,
      name: record.track_name,
      artist: record.artist_name,
      artistId: record.artist_id,
      album: record.album_name,
      albumId: record.album_id,
      albumArt: record.album_art_url ?? "",
      duration: record.duration_ms ?? 0,
      timestamp: new Date(record.played_at).getTime(),
    }));
  }



  /**
   * Sync shield sessions to cloud
   */
  async syncShieldSessions(
    spotifyUserId: string,
    sessions: { start: number; end: number | null }[],
  ): Promise<void> {
    const profileId = await this.ensureUserProfile(spotifyUserId);

    // Convert sessions to records
    const sessionRecords: Omit<
      UserShieldSessionRecord,
      "id" | "user_profile_id" | "created_at"
    >[] = sessions.map((session) => ({
      session_start: new Date(session.start).toISOString(),
      session_end: session.end
        ? new Date(session.end).toISOString()
        : undefined,
    }));

    if (sessionRecords.length === 0) return;

    // Insert session records
    const { error } = await supabase.from("user_shield_sessions").upsert(
      sessionRecords.map((record) => ({
        ...record,
        user_profile_id: profileId,
      })),
    );

    if (error) {
      throw new Error(`Failed to sync shield sessions: ${error.message}`);
    }

    // Update last sync time
    await this.updateLastSync(profileId);
  }

  /**
   * Fetch shield sessions from cloud
   */
  async fetchShieldSessions(
    spotifyUserId: string,
  ): Promise<{ start: number; end: number | null }[]> {
    const profileId = await this.ensureUserProfile(spotifyUserId);

    const { data, error } = await supabase
      .from("user_shield_sessions")
      .select("*")
      .eq("user_profile_id", profileId)
      .order("session_start", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch shield sessions: ${error.message}`);
    }

    return data.map((record) => ({
      start: new Date(record.session_start).getTime(),
      end: record.session_end ? new Date(record.session_end).getTime() : null,
    }));
  }

  /**
   * Merge local and cloud data for history
   */
  async mergeHistoryData(
    spotifyUserId: string,
    localTracks: Track[],
  ): Promise<Track[]> {
    try {
      // Fetch more tracks from cloud to ensure we can complete the 50-track list
      const cloudTracks = await this.fetchHistory(spotifyUserId, 200);

      // Merge all tracks
      const allTracks = [...localTracks, ...cloudTracks];

      // Deduplicate by id, keeping only the most recent timestamp
      const trackMap = new Map<string, Track>();
      for (const track of allTracks) {
        if (!track.id) continue;
        const existing = trackMap.get(track.id);
        if (!existing ?? (track.timestamp ?? 0) > (existing.timestamp ?? 0)) {
          trackMap.set(track.id, track);
        }
      }

      // Sort by timestamp desc and return
      return Array.from(trackMap.values())
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
        .slice(0, 50);
    } catch (error) {
      console.error("Failed to merge history data:", error);
      return localTracks; // Fallback to local data
    }
  }

  /**
   * Update last sync timestamp
   */
  private async updateLastSync(profileId: string): Promise<void> {
    const { error } = await supabase
      .from("user_profiles")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", profileId);

    if (error) {
      console.error("Failed to update last sync time:", error);
    }
  }

  /**
   * Sync rules to cloud
   */
  async syncRules(
    spotifyUserId: string,
    timeRules: Array<{
      id: string;
      name: string;
      days: string[];
      startTime: string;
      endTime: string;
      enabled: boolean;
    }>,
    deviceRules: Array<{
      id: string;
      deviceId: string;
      deviceName: string;
      deviceType: string;
      enabled: boolean;
      autoShield: boolean;
      shieldDuration?: number;
    }>,
  ): Promise<void> {
    const profileId = await this.ensureUserProfile(spotifyUserId);

    // Convert time rules to records
    const timeRuleRecords: Omit<
      UserTimeRuleRecord,
      "id" | "user_profile_id" | "created_at"
    >[] = timeRules.map((rule) => ({
      rule_id: rule.id,
      rule_name: rule.name,
      days: rule.days,
      start_time: rule.startTime,
      end_time: rule.endTime,
      enabled: rule.enabled,
    }));

    // Convert device rules to records
    const deviceRuleRecords: Omit<
      UserDeviceRuleRecord,
      "id" | "user_profile_id" | "created_at"
    >[] = deviceRules.map((rule) => ({
      rule_id: rule.id,
      device_id: rule.deviceId,
      device_name: rule.deviceName,
      device_type: rule.deviceType,
      enabled: rule.enabled,
      auto_shield: rule.autoShield,
      shield_duration: rule.shieldDuration,
    }));

    // Clear existing rules and insert new ones
    const { error: clearTimeError } = await supabase
      .from("user_time_rules")
      .delete()
      .eq("user_profile_id", profileId);

    if (clearTimeError) {
      throw new Error(`Failed to clear time rules: ${clearTimeError.message}`);
    }

    const { error: clearDeviceError } = await supabase
      .from("user_device_rules")
      .delete()
      .eq("user_profile_id", profileId);

    if (clearDeviceError) {
      throw new Error(`Failed to clear device rules: ${clearDeviceError.message}`);
    }

    // Insert time rules
    if (timeRuleRecords.length > 0) {
      const { error: timeError } = await supabase
        .from("user_time_rules")
        .insert(
          timeRuleRecords.map((record) => ({
            ...record,
            user_profile_id: profileId,
          })),
        );

      if (timeError) {
        throw new Error(`Failed to sync time rules: ${timeError.message}`);
      }
    }

    // Insert device rules
    if (deviceRuleRecords.length > 0) {
      const { error: deviceError } = await supabase
        .from("user_device_rules")
        .insert(
          deviceRuleRecords.map((record) => ({
            ...record,
            user_profile_id: profileId,
          })),
        );

      if (deviceError) {
        throw new Error(`Failed to sync device rules: ${deviceError.message}`);
      }
    }

    // Update last sync time
    await this.updateLastSync(profileId);
  }

  /**
   * Fetch rules from cloud
   */
  async fetchRules(spotifyUserId: string): Promise<{
    timeRules: Array<{
      id: string;
      name: string;
      days: string[];
      startTime: string;
      endTime: string;
      enabled: boolean;
    }>;
    deviceRules: Array<{
      id: string;
      deviceId: string;
      deviceName: string;
      deviceType: string;
      enabled: boolean;
      autoShield: boolean;
      shieldDuration?: number;
    }>;
  } | null> {
    const profileId = await this.ensureUserProfile(spotifyUserId);

    // Fetch time rules
    const { data: timeRulesData, error: timeError } = await supabase
      .from("user_time_rules")
      .select("*")
      .eq("user_profile_id", profileId);

    if (timeError) {
      throw new Error(`Failed to fetch time rules: ${timeError.message}`);
    }

    // Fetch device rules
    const { data: deviceRulesData, error: deviceError } = await supabase
      .from("user_device_rules")
      .select("*")
      .eq("user_profile_id", profileId);

    if (deviceError) {
      throw new Error(`Failed to fetch device rules: ${deviceError.message}`);
    }

    // Convert time rules
    const timeRules = timeRulesData.map((record) => ({
      id: record.rule_id,
      name: record.rule_name,
      days: record.days,
      startTime: record.start_time,
      endTime: record.end_time,
      enabled: record.enabled,
    }));

    // Convert device rules
    const deviceRules = deviceRulesData.map((record) => ({
      id: record.rule_id,
      deviceId: record.device_id,
      deviceName: record.device_name,
      deviceType: record.device_type,
      enabled: record.enabled,
      autoShield: record.auto_shield,
      shieldDuration: record.shield_duration,
    }));

    return {
      timeRules,
      deviceRules,
    };
  }

  /**
   * Clear user data (for testing or account deletion)
   */
  async clearUserData(spotifyUserId: string): Promise<void> {
    const profileId = await this.ensureUserProfile(spotifyUserId);

    // Delete all user data
    const { error } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", profileId);

    if (error) {
      throw new Error(`Failed to clear user data: ${error.message}`);
    }

    this.userProfileId = null;
  }
}

export const cloudSync = new CloudSyncService();
