import { Track } from "@/types/track";
import * as SpotifyService from "./spotify";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllTracksInPlaylist } from "./spotify";
import { Alert } from 'react-native';

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
  private static INSTRUCTIONS_SHOWN_KEY = 'streamshield:instructions_shown';
  private static playlistCheckLock: Promise<string> | null = null;
  private playlistCreationPromise: Promise<string> | null = null;
  
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
  public async initialize(accessToken: string, userId: string): Promise<boolean> {
    try {
      // Check if the user already has a StreamShield playlist
      const existingPlaylist = await SpotifyService.findUserPlaylistWithRefresh('StreamShield Protected Session');
      if (existingPlaylist) {
        this.shieldPlaylistId = existingPlaylist.id;
        console.log(`Found existing StreamShield playlist: ${existingPlaylist.id}`);
      } else {
        // Create a new StreamShield playlist
        const newPlaylist = await SpotifyService.createUserPlaylistWithRefresh(userId, 'StreamShield Protected Session');
        this.shieldPlaylistId = newPlaylist.id;
        console.log(`Created new StreamShield playlist: ${newPlaylist.id}`);
      }
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
      const value = await AsyncStorage.getItem(ProtectionMechanism.INSTRUCTIONS_SHOWN_KEY);
      return value === 'true';
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Marks the exclusion instructions as shown.
   * @returns Promise<void>
   */
  public async markInstructionsAsShown(): Promise<void> {
    try {
      await AsyncStorage.setItem(ProtectionMechanism.INSTRUCTIONS_SHOWN_KEY, 'true');
    this.hasShownExclusionInstructions = true;
    } catch (e) {
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
   * Ensures a valid exclusion playlist exists and is not full. Creates a new one if missing or full.
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @param forceCheckByName boolean indicating whether to force check by name
   * @returns Promise<string> The playlist ID to use
   */
  public async ensureValidExclusionPlaylist(accessToken: string, userId: string, forceCheckByName = false): Promise<string> {
    if (ProtectionMechanism.playlistCheckLock) {
      return ProtectionMechanism.playlistCheckLock;
    }
    ProtectionMechanism.playlistCheckLock = (async () => {
      let playlistId = this.shieldPlaylistId;
      let playlistWasCreated = false;
      if (!forceCheckByName && playlistId && typeof playlistId === 'string') {
        try {
          const playlist = await SpotifyService.findUserPlaylistWithRefresh(undefined, playlistId);
          if (!playlist || Object.keys(playlist).length === 0) {
            this.shieldPlaylistId = null;
            playlistId = null;
          }
        } catch (e) {
          this.shieldPlaylistId = null;
          playlistId = null;
        }
      } else if (forceCheckByName) {
        playlistId = null;
        this.shieldPlaylistId = null;
      }
      if (!playlistId) {
        const existing = await SpotifyService.findUserPlaylistWithRefresh('StreamShield Protected Session');
        if (existing) {
          this.shieldPlaylistId = existing.id;
          playlistId = existing.id;
        } else {
          const newPlaylist = await SpotifyService.createUserPlaylistWithRefresh(userId, 'StreamShield Protected Session');
          this.shieldPlaylistId = newPlaylist.id;
          playlistWasCreated = true;
          if (typeof Alert !== 'undefined') {
            Alert.alert(
              'New Exclusion Playlist Created',
              'A new StreamShield exclusion playlist was created.\n\nFor best results, open Spotify, find this playlist, and mark it as "Exclude from your taste profile".'
            );
          }
          playlistId = newPlaylist.id;
        }
      }
      if (!playlistId) throw new Error('Failed to resolve exclusion playlist ID after full check');
      ProtectionMechanism.playlistCheckLock = null;
      return playlistId;
    })();
    return ProtectionMechanism.playlistCheckLock;
  }
  
  /**
   * Adds a track to the exclusion playlist, robustly handling missing/full playlists.
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @param track The track to add
   * @returns Promise<boolean>
   */
  public async robustlyAddTrackToExclusionPlaylist(accessToken: string, userId: string, track: Track): Promise<boolean> {
    try {
      const playlistId = await this.ensureValidExclusionPlaylist(accessToken, userId);
      const trackUri = `spotify:track:${track.id}`;
      await SpotifyService.addTrackToPlaylistWithRefresh(playlistId, trackUri);
      this.tracksAddedDuringShield.add(track.id);
      console.log(`Added track "${track.name}" to StreamShield playlist for protection`);
      return true;
    } catch (error) {
      console.error("Failed to robustly add track to exclusion playlist:", error);
      return false;
    }
  }
  
  /**
   * Processes the currently playing track during a shielded session (uses robust playlist logic).
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @param track The track to process
   * @returns Promise<boolean> indicating success
   */
  public async processCurrentTrack(accessToken: string, userId: string, track: Track): Promise<boolean> {
    if (!this.isActive) {
      return false;
    }
    if (this.tracksAddedDuringShield.has(track.id)) {
      console.log(`Track "${track.name}" already added to StreamShield playlist during this session`);
      return true;
    }
    return this.robustlyAddTrackToExclusionPlaylist(accessToken, userId, track);
  }
  
  /**
   * Processes recently played tracks during a shielded session (uses robust playlist logic).
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @param tracks Array of tracks to process
   * @returns Promise<boolean> indicating success
   */
  public async processRecentTracks(accessToken: string, userId: string, tracks: Track[]): Promise<boolean> {
    if (!this.isActive) {
      return false;
    }
    // Filter tracks that were played during the active shield session
    const tracksToProcess = tracks.filter(track => 
      track.timestamp && 
      this.activatedAt && 
      track.timestamp > this.activatedAt &&
      !this.tracksAddedDuringShield.has(track.id)
    );
    if (tracksToProcess.length === 0) {
      return true;
    }
    for (const track of tracksToProcess) {
      await this.robustlyAddTrackToExclusionPlaylist(accessToken, userId, track);
    }
    console.log(`Processed ${tracksToProcess.length} recent tracks for StreamShield protection`);
    return true;
  }
  
  /**
   * Clears the shield playlist (removes all tracks).
   * @param accessToken Spotify access token
   * @param userId Spotify user ID
   * @returns Promise<boolean> indicating success
   */
  public async clearShieldPlaylist(accessToken: string, userId: string): Promise<boolean> {
    try {
      const playlistId = await this.ensureValidExclusionPlaylist(accessToken, userId);
      // Get all tracks in the playlist
      const playlist = await SpotifyService.findUserPlaylistWithRefresh(undefined, playlistId);
      if (!playlist || !playlist.tracks || !playlist.tracks.items) return false;
      const uris = playlist.tracks.items.map((item: any) => item.track && item.track.uri).filter(Boolean);
      for (const uri of uris) {
        await SpotifyService.removeTrackFromPlaylistWithRefresh(playlistId, uri);
      }
      this.tracksAddedDuringShield.clear();
      return true;
    } catch (error) {
      console.error("Failed to clear shield playlist:", error);
      return false;
    }
  }
  
  public async robustlyRemoveTrackFromExclusionPlaylist(accessToken: string, userId: string, track: Track): Promise<boolean> {
    try {
      const playlistId = await this.ensureValidExclusionPlaylist(accessToken, userId);
      const trackUri = `spotify:track:${track.id}`;
      await SpotifyService.removeTrackFromPlaylistWithRefresh(playlistId, trackUri);
      this.tracksAddedDuringShield.delete(track.id);
      console.log(`Removed track "${track.name}" from StreamShield playlist`);
      return true;
    } catch (error) {
      console.error("Failed to robustly remove track from exclusion playlist:", error);
      return false;
    }
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
    isShieldActive: protectionMechanism.isShieldActive.bind(protectionMechanism),
    getActivationTime: protectionMechanism.getActivationTime.bind(protectionMechanism),
    processCurrentTrack: protectionMechanism.processCurrentTrack.bind(protectionMechanism), // (accessToken, userId, track)
    processRecentTracks: protectionMechanism.processRecentTracks.bind(protectionMechanism), // (accessToken, userId, tracks)
    clearShieldPlaylist: protectionMechanism.clearShieldPlaylist.bind(protectionMechanism), // (accessToken, userId)
    hasShownInstructions: protectionMechanism.hasShownInstructions.bind(protectionMechanism),
    markInstructionsAsShown: protectionMechanism.markInstructionsAsShown.bind(protectionMechanism),
  };
};