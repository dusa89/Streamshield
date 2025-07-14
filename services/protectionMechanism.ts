import { Track } from "@/types/track";
import * as SpotifyService from "./spotify";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { useMemo } from "react";

// This file implements the "Mechanism of Protection" for StreamShield
// Based on research of Spotify API capabilities, this implements the most effective
// approach to prevent listening activity from influencing recommendations

/**
 * RESEARCH FINDINGS ON SPOTIFY API LIMITATIONS:
 *
 * 1. Spotify does not provide a direct API to mark individual listening sessions as "private"
 *    or to exclude them from recommendation algorithms.
 *
 * 2. The "Private Session" feature in Spotify's app cannot be controlled via API.
 *
 * 3. Spotify does provide a way to mark playlists as "excluded from taste profile" in the UI,
 *    but this setting is not directly accessible via the API.
 *
 * 4. The most effective workaround appears to be:
 *    a. Create a dedicated "StreamShield" playlist that is marked as "excluded from taste profile"
 *       in the Spotify UI (one-time manual step by the user)
 *    b. When shield is active, add tracks being played to this playlist
 *    c. This creates a duplicate play record that is excluded from recommendations
 *    d. While not perfect, this approach can help dilute the impact of shielded listening
 *
 * 5. For a more robust solution, we would need Spotify to add an API endpoint for:
 *    a. Controlling "Private Session" mode
 *    b. Marking individual listening sessions as excluded from recommendations
 *    c. Retroactively removing specific listening history from recommendation algorithms
 *
 * 6. SIGNAL DILUTION EXPLANATION:
 *    When a user plays a track in Spotify, that play is recorded and influences recommendations.
 *    By adding the same track to a playlist marked as "excluded from taste profile", we create
 *    a second signal that tells Spotify "don't use this for recommendations". While the original
 *    play still exists, the exclusion signal helps dilute its impact. This is not perfect, but
 *    it's the best available approach given Spotify API limitations.
 *
 * 7. IDEAL APPROACH (if Spotify API allowed):
 *    The ideal approach would be for StreamShield to take control of playback during shielded
 *    sessions, playing tracks directly from the excluded playlist. However, this would
 *    significantly disrupt the user experience, as they would need to use StreamShield as their
 *    primary playback interface rather than the Spotify app they're familiar with.
 */

/**
 * Singleton class to manage the StreamShield protection mechanism.
 * Handles shield activation, deactivation, and playlist management to prevent
 * Spotify listening activity from influencing recommendations.
 */
class ProtectionMechanism {
  private static instance: ProtectionMechanism;
  private isActive: boolean = false;
  private activatedAt: number | null = null;
  private shieldPlaylistId: string | null = null;
  private tracksAddedDuringShield: Set<string> = new Set();
  private hasShownExclusionInstructions: boolean = false;
  private static INSTRUCTIONS_SHOWN_KEY = "streamshield:instructions_shown";
  private static playlistCheckLock: Promise<string> | null = null;
  private playlistCreationPromise: Promise<string> | null = null;
  private static duplicateRemovalLock: Promise<number> | null = null;
  private static consolidationLock: Promise<{ consolidated: boolean; message: string }> | null = null;
  private static BACKUP_KEY = "streamshield:playlist_backup";
  private static PLAYLIST_PREFIX = "StreamShield Exclusion List";

  private constructor() {}

  public static getInstance(): ProtectionMechanism {
    if (!ProtectionMechanism.instance) {
      ProtectionMechanism.instance = new ProtectionMechanism();
    }
    return ProtectionMechanism.instance;
  }

  /**
   * Gets the primary exclusion playlist, creating or consolidating if necessary.
   * This is the new centralized logic to prevent duplicate playlists.
   * @param accessToken
   * @param userId
   */
  private async getPrimaryExclusionPlaylist(
    accessToken: string,
    userId: string,
  ): Promise<string> { // This promise must resolve with a string, not null.
    if (this.playlistCreationPromise) {
      return this.playlistCreationPromise;
    }

    this.playlistCreationPromise = (async () => {
      try {
        // First, check if we have a valid, cached playlist ID that still exists
        if (this.shieldPlaylistId) {
          try {
            const playlist = await SpotifyService.findUserPlaylist(undefined, this.shieldPlaylistId);
            if (playlist) {
              return this.shieldPlaylistId; // Cached ID is valid
            }
          } catch (e) {
            console.log("Cached playlist ID no longer valid, re-evaluating.");
            this.shieldPlaylistId = null; // Invalidate cache
          }
        }

        // Get all playlists that match the StreamShield name
        const allExclusionPlaylists = await this.getAllExclusionPlaylists(accessToken, userId);

        let playlistId: string | null = null;

        if (allExclusionPlaylists.length > 1) {
          console.log(`Found ${allExclusionPlaylists.length} exclusion playlists. Consolidating...`);
          await this.consolidatePlaylists(accessToken, userId);
          // After consolidation, there should be only one primary playlist. Re-fetch to get it.
          const afterConsolidation = await this.getAllExclusionPlaylists(accessToken, userId);
          if (afterConsolidation.length > 0) {
            playlistId = afterConsolidation[0].id;
          }
        } else if (allExclusionPlaylists.length === 1) {
          console.log("Found one existing exclusion playlist.");
          playlistId = allExclusionPlaylists[0].id;
        } else {
          // If we're here, no playlists exist, so create one.
          console.log("No exclusion playlists found. Creating a new one.");
          const newPlaylist = await SpotifyService.createUserPlaylistWithRefresh(
            userId,
            ProtectionMechanism.PLAYLIST_PREFIX
          );
          playlistId = newPlaylist.id;
        }

        if (!playlistId) {
          throw new Error("Failed to find or create a StreamShield playlist.");
        }

        this.shieldPlaylistId = playlistId;
        return this.shieldPlaylistId;

      } finally {
        this.playlistCreationPromise = null; // Clear promise after completion
      }
    })();
    return this.playlistCreationPromise;
  }

  /**
   * Initializes the protection mechanism for the user.
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<boolean> indicating success
   */
  public async initialize(
    accessToken: string,
    userId: string,
  ): Promise<boolean> {
    try {
      console.log(
        `[ProtectionMechanism] Initializing protection mechanism for user: ${userId}`,
      );
      this.shieldPlaylistId = await this.getPrimaryExclusionPlaylist(accessToken, userId);
      return true;
    } catch (error) {
      console.error("Failed to initialize protection mechanism:", error);
      return false;
    }
  }

  /**
   * Checks if the exclusion instructions have been shown to the user.
   * @returns Promise<boolean>
   */
  public async hasShownInstructions(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(
        ProtectionMechanism.INSTRUCTIONS_SHOWN_KEY,
      );
      return value === "true";
    } catch {
      return false;
    }
  }

  /**
   * Marks the exclusion instructions as shown.
   * @returns Promise<void>
   */
  public async markInstructionsAsShown(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        ProtectionMechanism.INSTRUCTIONS_SHOWN_KEY,
        "true",
      );
      this.hasShownExclusionInstructions = true;
    } catch {
      // ignore
    }
  }

  /**
   * Activates the shield, starting a protected session.
   * @returns boolean indicating if activation was successful
   */
  public activate(): boolean {
    this.isActive = true;
    this.activatedAt = Date.now();
    this.tracksAddedDuringShield.clear();
    return true;
  }

  /**
   * Deactivates the shield, ending the protected session.
   * @returns boolean indicating if deactivation was successful
   */
  public deactivate(): boolean {
    this.isActive = false;
    this.activatedAt = null;
    return true;
  }

  /**
   * Checks if the shield is currently active.
   * @returns boolean
   */
  public isShieldActive(): boolean {
    return this.isActive;
  }

  /**
   * Gets the timestamp when the shield was activated.
   * @returns number | null
   */
  public getActivationTime(): number | null {
    return this.activatedAt;
  }

  /**
   * Finds all StreamShield exclusion playlists for a user, sorted by creation date (oldest first).
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<Array<{id: string, name: string, trackCount: number, creationDate: string | null}>>
   */
  public async getAllExclusionPlaylists(
    accessToken: string,  // Renamed from _accessToken to indicate usage
    _userId: string,
  ): Promise<Array<{ id: string; name: string; trackCount: number; creationDate: string | null }>> {
    try {
      const userPlaylists = await SpotifyService.getUserPlaylists();

      const exclusionPlaylistsInfo = userPlaylists
        .filter((playlist: any) =>
          playlist?.name?.startsWith(ProtectionMechanism.PLAYLIST_PREFIX),
        )
        .map((playlist: any) => ({
            id: playlist.id,
            name: playlist.name,
          trackCount: playlist.tracks?.total ?? 0,
          creationDate: null, // Will be populated below
        }));
  
      for (const p of exclusionPlaylistsInfo) {
        if (p.trackCount > 0) {
          const tracks = await SpotifyService.getFirstPlaylistTrack(accessToken, p.id);
          if (tracks.length > 0 && tracks[0].added_at) {
            p.creationDate = tracks[0].added_at;
          }
        }
      }
  
      return exclusionPlaylistsInfo.sort((a, b) => {
        if (!a.creationDate) return 1;
        if (!b.creationDate) return -1;
        return new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime();
      });
  
        } catch (error) {
      console.error(
        "[ProtectionMechanism] Error fetching all exclusion playlists:",
        error,
      );
      return [];
    }
  }

  private _getPrimaryPlaylist(
    playlists: Array<{ id: string; name: string; creationDate: string | null }>,
  ): { id: string; name: string } | null {
    if (playlists.length === 0) {
      return null;
    }
    return playlists[0];
  }

  public async getAvailablePlaylistsSorted(
    accessToken: string,
    userId: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      trackCount: number;
      availableSpace: number;
    }>
  > {
    const allPlaylists = await this.getAllExclusionPlaylists(accessToken, userId);
    const spotifyPlaylistLimit = 10000;
    return allPlaylists.map(p => ({
      ...p,
      availableSpace: spotifyPlaylistLimit - p.trackCount,
    }));
  }

  public async robustlyAddTracksToExclusionPlaylist(
    accessToken: string,
    userId: string,
    tracks: Track[],
  ): Promise<boolean> {
    if (!tracks || tracks.length === 0) {
      return true;
    }

    try {
      const trackUris = tracks.map(t => `spotify:track:${t.id}`).filter(Boolean);
      if (trackUris.length === 0) {
        return true;
      }

      let targetPlaylistId = this.shieldPlaylistId;
      if (!targetPlaylistId) {
        console.log("No shield playlist ID cached, fetching primary...");
        targetPlaylistId = await this.getPrimaryExclusionPlaylist(accessToken, userId);
        this.shieldPlaylistId = targetPlaylistId;
      }
      
      if (!targetPlaylistId) {
        throw new Error("Could not find or create a playlist.");
      }

      await SpotifyService.addTracksToPlaylistBatched(accessToken, targetPlaylistId, trackUris);
      return true;
    } catch (error) {
      console.error("Failed to robustly add tracks:", error);
      return false;
    }
  }

  public async robustlyAddTracksInBatch(
    accessToken: string,
    userId: string,
    tracks: Track[],
  ): Promise<boolean> {
    if (!tracks || tracks.length === 0) {
      console.warn(
        "[ProtectionMechanism] robustlyAddTracksInBatch called with no tracks.",
      );
      return true;
    }
    try {
      const trackUris = tracks.map(t => `spotify:track:${t.id}`).filter(Boolean);
      if (trackUris.length === 0) return true;

      const playlistId = await this.getPrimaryExclusionPlaylist(accessToken, userId);
      if (!playlistId) {
        throw new Error("Could not determine a playlist for adding tracks.");
      }

      await SpotifyService.addTracksToPlaylistBatched(accessToken, playlistId, trackUris);
      return true;
    } catch (error) {
      console.error(
        "[ProtectionMechanism] Failed to robustly add tracks in batch:",
        error,
      );
      return false;
    }
  }

  public async robustlyRemoveTracksInBatch(
    accessToken: string,
    userId: string,
    tracks: Track[],
  ): Promise<boolean> {
    if (!tracks || tracks.length === 0) {
      console.warn(
        "[ProtectionMechanism] robustlyRemoveTracksInBatch called with no tracks.",
      );
      return true;
    }
    try {
      const trackUris = tracks.map(t => `spotify:track:${t.id}`).filter(Boolean);
      if (trackUris.length === 0) return true;

      const playlistId = await this.getPrimaryExclusionPlaylist(accessToken, userId);
      if (!playlistId) {
        throw new Error("Could not determine a playlist for removing tracks.");
      }

      await SpotifyService.removeTracksFromPlaylistBatched(accessToken, playlistId, trackUris);
      return true;
    } catch (error) {
      console.error(
        "[ProtectionMechanism] Failed to robustly remove tracks in batch:",
        error,
      );
      return false;
    }
  }

  public async processCurrentTrack(
    accessToken: string,
    userId: string,
    track: Track,
  ): Promise<boolean> {
    if (!this.isActive) return false;
    const trackUri = `spotify:track:${track.id}`;
    if (this.tracksAddedDuringShield.has(trackUri)) return true;

    try {
      console.log(`[ProtectionMechanism] Processing current track: ${track.name}`);
      const success = await this.robustlyAddTracksToExclusionPlaylist(accessToken, userId, [track]);
      if (success) {
        this.tracksAddedDuringShield.add(trackUri);
      }
      return success;
    } catch (error) {
      console.error(`[ProtectionMechanism] Failed to process track ${trackUri}:`, error);
      return false;
    }
  }

  public async processRecentTracks(
    accessToken: string,
    userId: string,
    tracks: Track[],
  ): Promise<boolean> {
    if (!this.isActive || !this.activatedAt) return false;

    const tracksSinceActivation = tracks.filter(
      t => t.timestamp && t.timestamp > this.activatedAt!,
    );
    const newTracks = tracksSinceActivation.filter(
      t => !this.tracksAddedDuringShield.has(`spotify:track:${t.id}`),
    );

    if (newTracks.length === 0) return true;

    try {
      const success = await this.robustlyAddTracksToExclusionPlaylist(accessToken, userId, newTracks);
      if (success) {
        newTracks.forEach(t => this.tracksAddedDuringShield.add(`spotify:track:${t.id}`));
      }
      return success;
    } catch (error) {
      console.error("[ProtectionMechanism] Failed to process recent tracks:", error);
      return false;
    }
  }

  public async clearShieldPlaylist(
    accessToken: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const playlistId = await this.getPrimaryExclusionPlaylist(accessToken, userId);
      if (!playlistId) {
        Alert.alert("Error", "No StreamShield playlist found to clear.");
        return false;
      }
      await SpotifyService.clearPlaylist(accessToken, playlistId);
      Alert.alert("Success", "The StreamShield playlist has been cleared.");
      return true;
    } catch (error: any) {
      Alert.alert(
        "Error",
        `Failed to clear playlist: ${error.message || "Unknown error"}`,
      );
      return false;
    }
  }

  public async robustlyRemoveTracksFromExclusionPlaylist(
    accessToken: string,
    userId: string,
    tracks: Track[],
  ): Promise<boolean> {
    if (!tracks || tracks.length === 0) {
      return true;
    }

    try {
      const trackUris = tracks.map(t => `spotify:track:${t.id}`).filter(Boolean);
      if (trackUris.length === 0) {
        return true;
      }
      
      const playlistId = await this.getPrimaryExclusionPlaylist(accessToken, userId);
      if (!playlistId) {
        throw new Error("Could not find a playlist to remove tracks from.");
      }

      await SpotifyService.removeTracksFromPlaylistBatched(accessToken, playlistId, trackUris);
      return true;
    } catch (error) {
      console.error("Failed to robustly remove tracks:", error);
      return false;
    }
  }

  public async backupPlaylistContents(
    accessToken: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const allPlaylists = await this.getAllExclusionPlaylists(accessToken, userId);
      if (allPlaylists.length === 0) {
        console.log("No playlists to back up.");
        return true;
      }

      let allTracks: { uri: string; added_at: string }[] = [];
      for (const p of allPlaylists) {
        const playlistTracks = await SpotifyService.getAllTracksInPlaylist(accessToken, p.id);
        allTracks.push(...playlistTracks);
      }
      
      const uniqueTracks = Array.from(new Map(allTracks.map(t => [t.uri, t])).values())
        .sort((a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime())
        .map(t => t.uri);

      await AsyncStorage.setItem(ProtectionMechanism.BACKUP_KEY, JSON.stringify(uniqueTracks));
      console.log(`Successfully backed up ${uniqueTracks.length} tracks.`);
      return true;
    } catch (error) {
      console.error("Failed to backup playlist contents:", error);
      return false;
    }
  }

  public async restorePlaylistFromBackup(
    accessToken: string,
    newPlaylistId: string,
  ): Promise<boolean> {
    try {
      const backupData = await AsyncStorage.getItem(ProtectionMechanism.BACKUP_KEY);
      if (!backupData) {
        console.log("No backup found to restore.");
        return true;
      }
      const trackUris = JSON.parse(backupData);
      if (!trackUris || trackUris.length === 0) {
        console.log("Backup is empty, nothing to restore.");
        return true;
      }

      await SpotifyService.addTracksToPlaylistBatched(accessToken, newPlaylistId, trackUris);
      console.log(`Restored ${trackUris.length} tracks to new playlist.`);
      return true;
    } catch (error) {
      console.error("Failed to restore playlist from backup:", error);
      return false;
    }
  }

  public async manualBackup(
    accessToken: string,
    userId: string,
  ): Promise<boolean> {
    try {
      Alert.alert(
        "Backing up...",
        "Saving the contents of your StreamShield playlist(s).",
      );
      const success = await this.backupPlaylistContents(accessToken, userId);
      if (success) {
        Alert.alert("Backup Complete", "Your playlist has been backed up.");
      } else {
        throw new Error("Backup operation returned false.");
      }
      return success;
    } catch (error) {
      Alert.alert("Backup Failed", "Could not back up the playlist.");
      return false;
    }
  }

  private async autoBackup(accessToken: string, userId: string): Promise<void> {
    try {
      await this.backupPlaylistContents(accessToken, userId);
    } catch (error) {
      console.error("Auto-backup failed:", error);
    }
  }

  /**
   * Consolidates multiple "StreamShield" playlists into the correct number
   * based on the total number of tracks. This is an idempotent operation
   * designed to fix any state of disarray.
   *
   * Phase 1: Consolidate Down - All tracks are moved to the primary (oldest) playlist.
   * Phase 2: Rebalance Up - If the primary is over capacity, tracks are redistributed.
   */
  public async consolidatePlaylists(
    accessToken: string,
    userId: string,
  ): Promise<{ consolidated: boolean; message: string }> {
    if (ProtectionMechanism.consolidationLock) {
      console.log("Consolidation already in progress. Skipping.");
      return ProtectionMechanism.consolidationLock;
    }

    const lock = (async (): Promise<{ consolidated: boolean; message: string }> => {
      try {
        console.log("Starting playlist consolidation...");
  
        let allPlaylists = await this.getAllExclusionPlaylists(accessToken, userId);
        if (allPlaylists.length <= 1) {
          console.log("No consolidation needed: 0 or 1 playlist found.");
          return { consolidated: true, message: "No consolidation needed." };
        }
  
        const primaryPlaylist = this._getPrimaryPlaylist(allPlaylists);
        if (!primaryPlaylist) {
          return { consolidated: false, message: "Could not determine primary playlist." };
        }
  
        console.log(`Primary playlist designated: ${primaryPlaylist.name} (${primaryPlaylist.id})`);
  
        const secondaryPlaylists = allPlaylists.filter(p => p.id !== primaryPlaylist.id);
        let allTrackUris = new Set<string>();
  
        for (const playlist of allPlaylists) {
          const tracks = await SpotifyService.getAllTracksInPlaylist(accessToken, playlist.id);
          tracks.forEach(t => allTrackUris.add(t.uri));
        }
  
        const totalTracks = allTrackUris.size;
        console.log(`Found a total of ${totalTracks} unique tracks across ${allPlaylists.length} playlists.`);
        const allTrackUrisArray = Array.from(allTrackUris);
  
        // Clear the primary playlist to start fresh
        await SpotifyService.clearPlaylist(accessToken, primaryPlaylist.id);
  
        // Delete all secondary playlists
        console.log("Deleting secondary playlists...");
        for (const sp of secondaryPlaylists) {
          await SpotifyService.deletePlaylist(accessToken, sp.id);
        }
  
        // Now distribute tracks across the required number of playlists
        const PLAYLIST_CAPACITY = 10000;
        const trackChunks = this.chunkArray(allTrackUrisArray, PLAYLIST_CAPACITY);
        const requiredPlaylists = trackChunks.length;
        const newPlaylistsToCreate = requiredPlaylists - 1;
  
        console.log(`Distributing ${totalTracks} tracks across ${requiredPlaylists} playlists.`);
  
        const newPlaylists = [];
        for (let i = 0; i < newPlaylistsToCreate; i++) {
          const newPlaylistName = `${ProtectionMechanism.PLAYLIST_PREFIX} ${i + 2}`;
          const newPlaylist = await SpotifyService.createUserPlaylistWithRefresh(userId, newPlaylistName);
          newPlaylists.push(newPlaylist);
        }
  
        // Add first chunk to primary
        if (trackChunks[0]?.length > 0) {
          console.log(`Adding ${trackChunks[0].length} tracks to primary playlist.`);
          await SpotifyService.addTracksToPlaylistBatched(accessToken, primaryPlaylist.id, trackChunks[0]);
        }
  
        // Add remaining chunks to new playlists
        for (let i = 0; i < newPlaylists.length; i++) {
          const chunk = trackChunks[i + 1] || [];
          if (chunk.length > 0) {
            console.log(`Adding ${chunk.length} tracks to ${newPlaylists[i].name}.`);
            await SpotifyService.addTracksToPlaylistBatched(accessToken, newPlaylists[i].id, chunk);
          }
        }
  
        console.log("Playlist consolidation completed successfully.");
        this.shieldPlaylistId = primaryPlaylist.id;
        return { consolidated: true, message: "Playlists consolidated and rebalanced." };
  
    } catch (error) {
        console.error("Error during playlist consolidation:", error);
      return {
        consolidated: false,
          message: `Consolidation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      } finally {
        ProtectionMechanism.consolidationLock = null;
    }
    })();
    ProtectionMechanism.consolidationLock = lock;
    return lock;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  public async removeDuplicateTracksFromPlaylist(
    accessToken: string,
    userId: string,
  ): Promise<number> {
    if (ProtectionMechanism.duplicateRemovalLock) {
      return ProtectionMechanism.duplicateRemovalLock;
    }
    ProtectionMechanism.duplicateRemovalLock = (async () => {
      try {
        const playlistId = await this.getPrimaryExclusionPlaylist(accessToken, userId);
        if (!playlistId) {
          console.warn(
            "[ProtectionMechanism] Cannot remove duplicates: no playlist found.",
          );
          return 0;
        }

        console.log(`[ProtectionMechanism] Checking for duplicates in playlist ${playlistId}`);
        const allItems = await SpotifyService.getAllTracksInPlaylist(
          accessToken,
          playlistId,
        );
        const tracksByUri = new Map<string, Array<{ position: number }>>();

        allItems.forEach((item, index) => {
          if (item?.track?.uri) {
            if (!tracksByUri.has(item.track.uri)) {
              tracksByUri.set(item.track.uri, []);
            }
            tracksByUri.get(item.track.uri)?.push({ position: index });
          }
        });

        const duplicatesToRemove: Array<{ uri: string; positions: number[] }> = [];
        tracksByUri.forEach((positions, uri) => {
          if (positions.length > 1) {
            // Keep the first one, remove the rest
            duplicatesToRemove.push({
              uri,
              positions: positions.slice(1).map(p => p.position),
            });
          }
        });

        if (duplicatesToRemove.length === 0) {
          console.log("[ProtectionMechanism] No duplicates found.");
          return 0;
        }
        
        console.log(`[ProtectionMechanism] Found ${duplicatesToRemove.length} duplicate tracks to remove.`);
        
        // Correctly map to an array of URI strings before passing to the service
        const duplicateUris = duplicatesToRemove.map(d => d.uri);

        await SpotifyService.removeTracksFromPlaylistBatched(
          accessToken,
            playlistId,
          duplicateUris,
          );
        return duplicatesToRemove.length;
          } catch (error) {
        console.error(
          "[ProtectionMechanism] Error removing duplicate tracks:",
          error,
        );
        return 0;
      } finally {
        ProtectionMechanism.duplicateRemovalLock = null;
      }
    })();
    return ProtectionMechanism.duplicateRemovalLock;
  }
}

export const useProtectionMechanism = () => {
  return useMemo(() => {
    const protectionMechanism = ProtectionMechanism.getInstance();
  return {
    initialize: protectionMechanism.initialize.bind(protectionMechanism),
    activate: protectionMechanism.activate.bind(protectionMechanism),
    deactivate: protectionMechanism.deactivate.bind(protectionMechanism),
      isShieldActive: protectionMechanism.isShieldActive.bind(protectionMechanism),
      getActivationTime: protectionMechanism.getActivationTime.bind(protectionMechanism),
      processCurrentTrack: protectionMechanism.processCurrentTrack.bind(protectionMechanism),
      processRecentTracks: protectionMechanism.processRecentTracks.bind(protectionMechanism),
      clearShieldPlaylist: protectionMechanism.clearShieldPlaylist.bind(protectionMechanism),
      hasShownInstructions: protectionMechanism.hasShownInstructions.bind(protectionMechanism),
      markInstructionsAsShown: protectionMechanism.markInstructionsAsShown.bind(protectionMechanism),
      consolidatePlaylists: protectionMechanism.consolidatePlaylists.bind(protectionMechanism),
      removeDuplicateTracks: protectionMechanism.removeDuplicateTracksFromPlaylist.bind(protectionMechanism),
      manualBackup: protectionMechanism.manualBackup.bind(protectionMechanism),
      robustlyAddTracksToExclusionPlaylist: protectionMechanism.robustlyAddTracksToExclusionPlaylist.bind(protectionMechanism),
      robustlyRemoveTracksFromExclusionPlaylist: protectionMechanism.robustlyRemoveTracksFromExclusionPlaylist.bind(protectionMechanism),
      robustlyAddTracksInBatch: protectionMechanism.robustlyAddTracksInBatch.bind(protectionMechanism),
      robustlyRemoveTracksInBatch: protectionMechanism.robustlyRemoveTracksInBatch.bind(protectionMechanism),
      getAllExclusionPlaylists: protectionMechanism.getAllExclusionPlaylists.bind(protectionMechanism),
    };
  }, []);
}; 