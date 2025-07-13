import { Track } from "@/types/track";
import * as SpotifyService from "./spotify";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

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
      // Use the new centralized function from SpotifyService
      this.shieldPlaylistId = await SpotifyService.ensureValidExclusionPlaylist(
        accessToken,
        userId,
        this.shieldPlaylistId,
      );
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
   * Finds all StreamShield exclusion playlists for a user
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<Array<{id: string, name: string, trackCount: number}>>
   */
  public async getAllExclusionPlaylists(
    _accessToken: string,
    _userId: string,
  ): Promise<Array<{ id: string; name: string; trackCount: number }>> {
    try {
      const userPlaylists = await SpotifyService.getUserPlaylists();

      const exclusionPlaylists = userPlaylists
        .filter((playlist: any) =>
          playlist?.name?.startsWith(ProtectionMechanism.PLAYLIST_PREFIX),
        )
        .map((playlist: any) => {
          const trackCount = playlist.tracks?.total ?? 0;
          return {
            id: playlist.id,
            name: playlist.name,
            trackCount: trackCount,
          };
        })
        .sort((a: any, b: any) => {
          // Sort by playlist number (if named "StreamShield Protected Session #2", etc.)
          const aNum = this.extractPlaylistNumber(a.name);
          const bNum = this.extractPlaylistNumber(b.name);
          return aNum - bNum;
        });

      return exclusionPlaylists;
    } catch (error) {
      console.error("Failed to get exclusion playlists:", error);
      // Re-throw the error so it can be handled by the caller (e.g., fetchWithAutoRefresh)
      // This prevents the app from incorrectly assuming no playlists exist on a temporary failure
      throw error;
    }
  }

  /**
   * Extracts playlist number from name (e.g., "StreamShield Protected Session #2" -> 2)
   * @param playlistName The playlist name
   * @returns number The playlist number (1 for base name, 2+ for numbered playlists)
   */
  private extractPlaylistNumber(playlistName: string): number {
    const match = playlistName.match(/#(\d+)$/);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Gets the best available exclusion playlist for adding tracks
   * Prioritizes playlists with the most available space to maximize efficiency
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<string> The playlist ID
   */
  public async getNextAvailablePlaylist(
    accessToken: string,
    userId: string,
  ): Promise<string> {
    const playlists = await this.getAllExclusionPlaylists(accessToken, userId);

    // If multiple playlists exist, consolidate them first
    if (playlists.length > 1) {
      const consolidationResult = await this.consolidatePlaylists(accessToken, userId);
      if (consolidationResult.consolidated) {
        // After consolidation, get the single remaining playlist
        const consolidatedPlaylists = await this.getAllExclusionPlaylists(accessToken, userId);
        if (consolidatedPlaylists.length > 0) {
          return consolidatedPlaylists[0].id;
        }
      }
    }

    // Find playlists that aren't full (Spotify limit is 10,000 tracks)
    const availablePlaylists = playlists.filter(
      (playlist) => playlist.trackCount < 10000,
    );

    if (availablePlaylists.length > 0) {
      // Playlists are available, continue with logic below
    } else {
      
      // Before creating a new playlist, try to clean up old tracks from existing playlists
      // This can free up space and avoid creating new playlists
      for (const playlist of playlists) {
        try {
          const tracks = await SpotifyService.getAllTracksInPlaylist(accessToken, playlist.id);
          
          // Remove tracks older than 30 days to free up space
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          const oldTracks = tracks.filter((item: any) => {
            const addedAt = new Date(item.added_at).getTime();
            return addedAt < thirtyDaysAgo;
          });
          
          if (oldTracks.length > 0) {
            const trackUris = oldTracks.map((track: any) => track.track?.uri).filter(Boolean);
            await SpotifyService.removeTracksFromPlaylistBatched(accessToken, playlist.id, trackUris);
            
            // Check if we now have space
            const updatedPlaylist = await SpotifyService.findUserPlaylist(accessToken, playlist.id);
            if (updatedPlaylist && updatedPlaylist.tracks?.total < 10000) {
              return playlist.id;
            }
          }
        } catch (error) {
          console.error(`[ProtectionMechanism] Error cleaning up playlist ${playlist.name}:`, error);
        }
      }
      
      // If cleanup didn't work, create a new playlist
      const nextNumber = playlists.length + 1;
      const newPlaylistName = `${ProtectionMechanism.PLAYLIST_PREFIX} #${nextNumber}`;

      const newPlaylist = await SpotifyService.createUserPlaylistWithRefresh(
        userId,
        newPlaylistName,
      );

      if (typeof Alert !== "undefined") {
        Alert.alert(
          "New Exclusion Playlist Created",
          `Playlist "${newPlaylistName}" was created because all your previous playlists were full.\n\nIMPORTANT: Open Spotify, find this playlist, and mark it as "Exclude from your taste profile" for best protection.\n\nTip: You can also manually delete old tracks from your existing StreamShield playlists to free up space.`,
          [
            { text: "OK" },
            { 
              text: "Show Instructions", 
              onPress: () => {
                Alert.alert(
                  "How to Exclude Playlist from Taste Profile",
                  "1. Open Spotify app\n2. Go to your Library\n3. Find the playlist 'StreamShield Exclusion List'\n4. Tap the three dots (⋯)\n5. Select 'Exclude from your taste profile'\n6. Repeat for any additional StreamShield playlists"
                );
              }
            }
          ]
        );
      }

      return newPlaylist.id;
    }

    // Sort available playlists by available space (descending) to maximize efficiency
    // This ensures we fill up playlists with the most space first
    availablePlaylists.sort((a, b) => {
      const aAvailableSpace = 10000 - a.trackCount;
      const bAvailableSpace = 10000 - b.trackCount;
      return bAvailableSpace - aAvailableSpace; // Descending order
    });

    const selectedPlaylist = availablePlaylists[0];

    // Return the playlist with the most available space
    return selectedPlaylist.id;
  }

  /**
   * Gets all available playlists sorted by available space (for bulk operations)
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<Array<{id: string, name: string, trackCount: number, availableSpace: number}>>
   */
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
    const playlists = await this.getAllExclusionPlaylists(accessToken, userId);

    return playlists
      .filter((playlist) => playlist.trackCount < 10000)
      .map((playlist) => ({
        ...playlist,
        availableSpace: 10000 - playlist.trackCount,
      }))
      .sort((a, b) => b.availableSpace - a.availableSpace); // Sort by available space (descending)
  }



  /**
   * Adds tracks to the exclusion playlist in a batch, handling full playlists.
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @param tracks The tracks to add
   * @returns Promise<boolean>
   */
  public async robustlyAddTracksToExclusionPlaylist(
    accessToken: string,
    userId: string,
    tracks: Track[],
  ): Promise<boolean> {
    if (tracks.length === 0) return true;

    try {
      // Deduplicate tracks before processing
      const uniqueTracks = tracks.filter((track, index, self) =>
        index === self.findIndex((t) => (
          t.id === track.id
        ))
      );

      let remainingTracks = [...uniqueTracks];
      const availablePlaylists = await this.getAvailablePlaylistsSorted(accessToken, userId);

      if (availablePlaylists.length === 0) {
        // No playlists exist or they are all full, create a new one
        const newPlaylistId = await this.getNextAvailablePlaylist(accessToken, userId);
        availablePlaylists.push({ id: newPlaylistId, name: ProtectionMechanism.PLAYLIST_PREFIX, trackCount: 0, availableSpace: 10000 });
      }
      
      for (const playlist of availablePlaylists) {
        if (remainingTracks.length === 0) break;

        const spaceInPlaylist = playlist.availableSpace;
        const tracksToAdd = remainingTracks.slice(0, spaceInPlaylist);
        remainingTracks = remainingTracks.slice(spaceInPlaylist);

        if (tracksToAdd.length > 0) {
          const trackUris = tracksToAdd.map(t => `spotify:track:${t.id}`);
          await SpotifyService.addTracksToPlaylistBatched(accessToken, playlist.id, trackUris);
        }
      }

      // If there are still remaining tracks, it means all playlists are full
      if (remainingTracks.length > 0) {
         // Create a new playlist and add the remaining tracks
         const newPlaylistId = await this.getNextAvailablePlaylist(accessToken, userId);
         const remainingTrackUris = remainingTracks.map(t => `spotify:track:${t.id}`);
         await SpotifyService.addTracksToPlaylistBatched(accessToken, newPlaylistId, remainingTrackUris);
      }

      uniqueTracks.forEach(track => this.tracksAddedDuringShield.add(track.id));
      this.autoBackup(accessToken, userId);

      return true;
    } catch (error) {
      console.error("Failed to robustly add tracks in batch:", error);
      return false;
    }
  }

  /**
   * [BATCH] Adds multiple tracks to the exclusion playlists in a batch, handling full playlists.
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @param tracks The tracks to add
   * @returns Promise<boolean>
   */
  public async robustlyAddTracksInBatch(
    accessToken: string,
    userId: string,
    tracks: Track[],
  ): Promise<boolean> {
    if (tracks.length === 0) return true;

    try {
       // Deduplicate tracks before processing
       const uniqueTracks = tracks.filter((track, index, self) =>
        index === self.findIndex((t) => (
          t.id === track.id
        ))
      );

      let remainingTracks = [...uniqueTracks];
      const availablePlaylists = await this.getAvailablePlaylistsSorted(accessToken, userId);

      if (availablePlaylists.length === 0) {
        // No playlists exist or they are all full, create a new one
        const newPlaylistId = await this.getNextAvailablePlaylist(accessToken, userId);
        availablePlaylists.push({ id: newPlaylistId, name: ProtectionMechanism.PLAYLIST_PREFIX, trackCount: 0, availableSpace: 10000 });
      }
      
      for (const playlist of availablePlaylists) {
        if (remainingTracks.length === 0) break;

        const spaceInPlaylist = playlist.availableSpace;
        const tracksToAdd = remainingTracks.slice(0, spaceInPlaylist);
        remainingTracks = remainingTracks.slice(spaceInPlaylist);

        if (tracksToAdd.length > 0) {
          const trackUris = tracksToAdd.map(t => `spotify:track:${t.id}`);
          await SpotifyService.addTracksToPlaylistBatched(accessToken, playlist.id, trackUris);
        }
      }

      // If there are still remaining tracks, it means all playlists are full
      if (remainingTracks.length > 0) {
         // Create a new playlist and add the remaining tracks
         const newPlaylistId = await this.getNextAvailablePlaylist(accessToken, userId);
         const remainingTrackUris = remainingTracks.map(t => `spotify:track:${t.id}`);
         await SpotifyService.addTracksToPlaylistBatched(accessToken, newPlaylistId, remainingTrackUris);
      }

      uniqueTracks.forEach(track => this.tracksAddedDuringShield.add(track.id));
      this.autoBackup(accessToken, userId);

      return true;
    } catch (error) {
      console.error("Failed to robustly add tracks in batch:", error);
      return false;
    }
  }

  /**
   * [BATCH] Removes multiple tracks from all exclusion playlists in a batch.
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @param tracks The tracks to remove
   * @returns Promise<boolean>
   */
  public async robustlyRemoveTracksInBatch(
    accessToken: string,
    userId: string,
    tracks: Track[],
  ): Promise<boolean> {
    if (tracks.length === 0) return true;

    try {
      const trackUris = tracks.map(t => `spotify:track:${t.id}`);
      const playlists = await this.getAllExclusionPlaylists(accessToken, userId);

      for (const playlist of playlists) {
        await SpotifyService.removeTracksFromPlaylistBatched(accessToken, playlist.id, trackUris);
      }
      
      tracks.forEach(t => this.tracksAddedDuringShield.delete(t.id));
      return true;
    } catch (error) {
      console.error("Failed to robustly remove tracks in batch:", error);
      return false;
    }
  }

  /**
   * Processes the currently playing track during a shielded session.
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @param track The track to process
   * @returns Promise<boolean> indicating success
   */
  public async processCurrentTrack(
    accessToken: string,
    userId: string,
    track: Track,
  ): Promise<boolean> {
    if (!this.isActive) {
      return false;
    }
    if (this.tracksAddedDuringShield.has(track.id)) {
      return true;
    }
    // Use the batch method with a single track
    return this.robustlyAddTracksToExclusionPlaylist(accessToken, userId, [track]);
  }

  /**
   * Processes recently played tracks during a shielded session.
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @param tracks Array of tracks to process
   * @returns Promise<boolean> indicating success
   */
  public async processRecentTracks(
    accessToken: string,
    userId: string,
    tracks: Track[],
  ): Promise<boolean> {
    if (!this.isActive) {
      return false;
    }
    // Filter tracks that were played during the active shield session
    const tracksToProcess = tracks.filter(
      (track) =>
        track.timestamp &&
        this.activatedAt &&
        track.timestamp > this.activatedAt &&
        !this.tracksAddedDuringShield.has(track.id),
    );
    if (tracksToProcess.length === 0) {
      return true;
    }
    // Use the new batch method
    return this.robustlyAddTracksToExclusionPlaylist(
      accessToken,
      userId,
      tracksToProcess,
    );
  }

  /**
   * Clears the shield playlist (removes all tracks).
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<boolean> indicating success
   */
  public async clearShieldPlaylist(
    accessToken: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const playlistId = await SpotifyService.ensureValidExclusionPlaylist(
        accessToken,
        userId,
        this.shieldPlaylistId,
      );
      // Get all tracks in the playlist
      const tracks = await SpotifyService.getAllTracksInPlaylist(
        accessToken,
        playlistId,
      );
      if (!tracks || tracks.length === 0) return true;

      const trackUris = tracks
        .map((item: any) => item.track?.uri)
        .filter(Boolean);
        
      if (trackUris.length > 0) {
        await SpotifyService.removeTracksFromPlaylistBatched(accessToken, playlistId, trackUris);
      }
      
      this.tracksAddedDuringShield.clear();
      return true;
    } catch (error) {
      console.error("Failed to clear shield playlist:", error);
      return false;
    }
  }

  /**
   * Removes multiple tracks from all exclusion playlists in a batch.
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @param tracks The tracks to remove
   * @returns Promise<boolean>
   */
  public async robustlyRemoveTracksFromExclusionPlaylist(
    accessToken: string,
    userId: string,
    tracks: Track[],
  ): Promise<boolean> {
    if (tracks.length === 0) return true;

    try {
      const trackUris = tracks.map(t => `spotify:track:${t.id}`);
      const playlists = await this.getAllExclusionPlaylists(accessToken, userId);

      for (const playlist of playlists) {
        await SpotifyService.removeTracksFromPlaylistBatched(accessToken, playlist.id, trackUris);
      }
      
      tracks.forEach(t => this.tracksAddedDuringShield.delete(t.id));
      return true;
    } catch (error) {
      console.error("Failed to robustly remove tracks in batch:", error);
      return false;
    }
  }

  /**
   * Backs up the current playlist contents to AsyncStorage
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<boolean> indicating success
   */
  public async backupPlaylistContents(
    accessToken: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const playlistId = await SpotifyService.ensureValidExclusionPlaylist(
        accessToken,
        userId,
        this.shieldPlaylistId,
      );
      const tracks = await SpotifyService.getAllTracksInPlaylist(
        accessToken,
        playlistId,
      );

      const backup = {
        timestamp: Date.now(),
        playlistId: playlistId,
        tracks: tracks
          .map((item: any) => ({
            id: item.track?.id,
            name: item.track?.name,
            artist: item.track?.artists?.[0]?.name,
            album: item.track?.album?.name,
            uri: item.track?.uri,
          }))
          .filter((track: any) => track.id && track.uri),
      };

      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      await AsyncStorage.setItem(
        ProtectionMechanism.BACKUP_KEY,
        JSON.stringify(backup),
      );
      return true;
    } catch (error) {
      console.error("Failed to backup playlist contents:", error);
      return false;
    }
  }

  /**
   * Restores playlist contents from backup
   * @param accessToken Spotify access token
   * @param newPlaylistId The new playlist ID to restore to
   * @returns Promise<boolean> indicating success
   */
  public async restorePlaylistFromBackup(
    accessToken: string,
    newPlaylistId: string,
  ): Promise<boolean> {
    try {
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const backupData = await AsyncStorage.getItem(
        ProtectionMechanism.BACKUP_KEY,
      );

      if (!backupData) {
        return false;
      }

      const backup = JSON.parse(backupData);
      if (!backup.tracks || backup.tracks.length === 0) {
        return false;
      }

      // Add tracks in batches of 100 (Spotify API limit)
      const batchSize = 100;
      for (let i = 0; i < backup.tracks.length; i += batchSize) {
        const batch = backup.tracks.slice(i, i + batchSize);
        const uris = batch.map((track: any) => track.uri).filter(Boolean);

        if (uris.length > 0) {
          await SpotifyService.addTracksToPlaylistBatched(
            accessToken,
            newPlaylistId,
            uris,
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Failed to restore playlist from backup:", error);
      return false;
    }
  }

  /**
   * Manually triggers a backup of the current playlist
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<boolean> indicating success
   */
  public async manualBackup(
    accessToken: string,
    userId: string,
  ): Promise<boolean> {
    return this.backupPlaylistContents(accessToken, userId);
  }

  /**
   * Automatically backs up playlist contents when tracks are added
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<void>
   */
  private async autoBackup(accessToken: string, userId: string): Promise<void> {
    try {
      if (!this.shieldPlaylistId) return;

      const lastBackupCount = await AsyncStorage.getItem(
        `${ProtectionMechanism.BACKUP_KEY}:${this.shieldPlaylistId}:count`,
      );
      const currentCount = (
        await this.getAllExclusionPlaylists(accessToken, userId)
      ).find(p => p.id === this.shieldPlaylistId)?.trackCount ?? 0;

      // Backup every 10 new songs or if never backed up before
      if (!lastBackupCount || currentCount - parseInt(lastBackupCount) >= 10) {
        console.log(`[ProtectionMechanism] Auto-backing up playlist ${this.shieldPlaylistId}...`);
        await this.manualBackup(accessToken, userId);
      }
    } catch (error) {
      console.warn("Auto-backup failed:", error);
    }
  }

  /**
   * Consolidates and optimizes exclusion playlists to use only the minimum number needed
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<{consolidated: boolean, message: string}>
   */
  public async consolidatePlaylists(
    accessToken: string,
    userId: string,
  ): Promise<{ consolidated: boolean; message: string }> {
    // Prevent multiple simultaneous consolidation operations
    if (ProtectionMechanism.consolidationLock) {
      return ProtectionMechanism.consolidationLock;
    }

    ProtectionMechanism.consolidationLock = (async () => {
      try {

        // Get all exclusion playlists
        const playlists = await this.getAllExclusionPlaylists(
          accessToken,
          userId,
        );
        
        if (playlists.length <= 1) {
          ProtectionMechanism.consolidationLock = null;
          return { consolidated: false, message: "No consolidation needed" };
        }

      // Find the playlist with the most tracks (or a full one)
      let targetPlaylist = playlists[0];
      for (const p of playlists) {
        if (p.trackCount === 10000) {
          targetPlaylist = p;
          break;
        }
        if (p.trackCount > targetPlaylist.trackCount) {
          targetPlaylist = p;
        }
      }
      const playlistsToMove = playlists.filter(p => p.id !== targetPlaylist.id);


      // Move all tracks from other playlists to the target playlist
      for (const playlist of playlistsToMove) {
        try {
          // Get all tracks from this playlist
          const tracks = await SpotifyService.getAllTracksInPlaylist(
            accessToken,
            playlist.id,
          );
          if (tracks.length > 0) {
            // Add tracks to target playlist
            const trackUris = tracks
              .map((track: any) => track.track?.uri)
              .filter(Boolean);
            if (trackUris.length > 0) {
              await SpotifyService.addTracksToPlaylistBatched(
                accessToken,
                targetPlaylist.id,
                trackUris,
              );
              // Remove all tracks from source playlist
              await SpotifyService.removeTracksFromPlaylistBatched(
                accessToken,
                playlist.id,
                trackUris,
              );
            }
          }
          // Delete the empty playlist
          await SpotifyService.deletePlaylist(accessToken, playlist.id);
        } catch (error) {
          console.error(`[ProtectionMechanism] Error processing playlist ${playlist.name}:`, error);
          // Continue with other playlists even if one fails
        }
      }

      // Update the shield playlist ID if it was one of the deleted ones
      if (
        this.shieldPlaylistId &&
        playlistsToMove.some((p) => p.id === this.shieldPlaylistId)
      ) {
        this.shieldPlaylistId = targetPlaylist.id;
      }

      ProtectionMechanism.consolidationLock = null;
      return {
        consolidated: true,
        message: `Consolidated all tracks into single playlist: ${targetPlaylist.name}`,
      };
    } catch (error) {
      console.error(
        "[ProtectionMechanism] Error during playlist consolidation:",
        error,
      );
      ProtectionMechanism.consolidationLock = null;
      return {
        consolidated: false,
        message: "Failed to consolidate playlists",
      };
    }
    })();

    return ProtectionMechanism.consolidationLock;
  }

  /**
   * Removes duplicate tracks from the exclusion playlist (keeps only one of each track ID).
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<number> Number of duplicates removed
   */
  public async removeDuplicateTracksFromPlaylist(
    accessToken: string,
    userId: string,
  ): Promise<number> {
    // Prevent multiple simultaneous duplicate removal operations
    if (ProtectionMechanism.duplicateRemovalLock) {
      return ProtectionMechanism.duplicateRemovalLock;
    }

    ProtectionMechanism.duplicateRemovalLock = (async () => {
      try {
        const playlistId = await SpotifyService.ensureValidExclusionPlaylist(
          accessToken,
          userId,
          this.shieldPlaylistId,
        );
        const allTracks = await SpotifyService.getAllTracksInPlaylist(
          accessToken,
          playlistId,
        );
        
        
        // Flatten to array of {uri, id, positions}
        const trackEntries = allTracks
          .map((item: any, index: number) => ({
            uri: item.track?.uri,
            id: item.track?.id,
            position: index,
          }))
          .filter((t: any) => t.id && t.uri);
        
        const seen = new Map<string, number[]>(); // trackId -> array of positions
        const duplicates: { uri: string; id: string; positions: number[] }[] = [];
        
        // Find all duplicates and their positions
        for (const entry of trackEntries) {
          if (seen.has(entry.id)) {
            seen.get(entry.id)!.push(entry.position);
          } else {
            seen.set(entry.id, [entry.position]);
          }
        }
        
        // Collect duplicates (tracks that appear more than once)
        for (const [trackId, positions] of seen.entries()) {
          if (positions.length > 1) {
            const firstEntry = trackEntries.find((e: any) => e.id === trackId);
            if (firstEntry) {
              duplicates.push({
                uri: firstEntry.uri,
                id: trackId,
                positions: positions.slice(1), // Keep first occurrence, remove the rest
              });
          }
        }
        }
        
        
        if (duplicates.length === 0) {
          ProtectionMechanism.duplicateRemovalLock = null;
          return 0;
        }
        
        // Remove all duplicates
        let removedCount = 0;
        for (const dup of duplicates) {
          try {
          await SpotifyService.removeTrackFromPlaylistWithRefresh(
            playlistId,
            dup.uri,
          );
            removedCount++;
          } catch (error) {
            console.error(`[ProtectionMechanism] Failed to remove duplicate track ${dup.id}:`, error);
          }
        }
        
        if (removedCount > 0) {
        }
        
        ProtectionMechanism.duplicateRemovalLock = null;
        return removedCount;
      } catch (error) {
        console.error("Failed to remove duplicate tracks:", error);
        ProtectionMechanism.duplicateRemovalLock = null;
        return 0;
      }
    })();

    return ProtectionMechanism.duplicateRemovalLock;
  }


}

// Export the singleton instance
export const protectionMechanism = ProtectionMechanism.getInstance();

// Export a hook to use the protection mechanism
// NOTE: processCurrentTrack, processRecentTracks, and clearShieldPlaylist now require userId as an argument for robust playlist management.
export const useProtectionMechanism = () => {
  return {
    initialize: protectionMechanism.initialize.bind(protectionMechanism),
    activate: protectionMechanism.activate.bind(protectionMechanism),
    deactivate: protectionMechanism.deactivate.bind(protectionMechanism),
    isShieldActive:
      protectionMechanism.isShieldActive.bind(protectionMechanism),
    getActivationTime:
      protectionMechanism.getActivationTime.bind(protectionMechanism),
    getAllExclusionPlaylists:
      protectionMechanism.getAllExclusionPlaylists.bind(protectionMechanism),
    processCurrentTrack:
      protectionMechanism.processCurrentTrack.bind(protectionMechanism), // (accessToken, userId, track)
    processRecentTracks:
      protectionMechanism.processRecentTracks.bind(protectionMechanism), // (accessToken, userId, tracks)
    clearShieldPlaylist:
      protectionMechanism.clearShieldPlaylist.bind(protectionMechanism), // (accessToken, userId)
    hasShownInstructions:
      protectionMechanism.hasShownInstructions.bind(protectionMechanism),
    markInstructionsAsShown:
      protectionMechanism.markInstructionsAsShown.bind(protectionMechanism),
    manualBackup: protectionMechanism.manualBackup.bind(protectionMechanism), // (accessToken, userId)
    backupPlaylistContents:
      protectionMechanism.backupPlaylistContents.bind(protectionMechanism), // (accessToken, userId)
    removeDuplicateTracksFromPlaylist:
      protectionMechanism.removeDuplicateTracksFromPlaylist.bind(
        protectionMechanism,
      ), // (accessToken, userId)
    consolidatePlaylists:
      protectionMechanism.consolidatePlaylists.bind(protectionMechanism), // (accessToken, userId)
  };
};
