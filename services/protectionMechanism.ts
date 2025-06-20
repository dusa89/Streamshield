import { Track } from "@/types/track";
import * as SpotifyService from "./spotify";

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

// Singleton to manage the protection mechanism
class ProtectionMechanism {
  private static instance: ProtectionMechanism;
  private isActive: boolean = false;
  private activatedAt: number | null = null;
  private shieldPlaylistId: string | null = null;
  private tracksAddedDuringShield: Set<string> = new Set();
  private hasShownExclusionInstructions: boolean = false;
  
  private constructor() {}
  
  public static getInstance(): ProtectionMechanism {
    if (!ProtectionMechanism.instance) {
      ProtectionMechanism.instance = new ProtectionMechanism();
    }
    return ProtectionMechanism.instance;
  }
  
  // Initialize the protection mechanism
  public async initialize(accessToken: string, userId: string): Promise<boolean> {
    try {
      // In a real app, we would:
      // 1. Check if the user already has a StreamShield playlist
      // 2. If not, create one and instruct the user to mark it as "excluded from taste profile"
      
      // For demo purposes, we'll simulate creating a playlist
      const playlistResponse = await SpotifyService.createPlaylist(
        accessToken,
        userId,
        "StreamShield (Excluded from Recommendations)",
        false // private playlist
      );
      
      if (playlistResponse.success && playlistResponse.playlist) {
        this.shieldPlaylistId = playlistResponse.playlist.id;
        
        // In a real app, we would show instructions to the user to:
        // 1. Go to this playlist in Spotify
        // 2. Click "..." menu
        // 3. Select "Exclude from your taste profile"
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Failed to initialize protection mechanism:", error);
      return false;
    }
  }
  
  // Check if exclusion instructions have been shown
  public hasShownInstructions(): boolean {
    return this.hasShownExclusionInstructions;
  }
  
  // Mark exclusion instructions as shown
  public markInstructionsAsShown(): void {
    this.hasShownExclusionInstructions = true;
  }
  
  // Activate the shield
  public activate(): boolean {
    this.isActive = true;
    this.activatedAt = Date.now();
    this.tracksAddedDuringShield.clear();
    return true;
  }
  
  // Deactivate the shield
  public deactivate(): boolean {
    this.isActive = false;
    this.activatedAt = null;
    return true;
  }
  
  // Check if the shield is active
  public isShieldActive(): boolean {
    return this.isActive;
  }
  
  // Get the time when the shield was activated
  public getActivationTime(): number | null {
    return this.activatedAt;
  }
  
  // Process a track that is currently playing
  public async processCurrentTrack(accessToken: string, track: Track): Promise<boolean> {
    if (!this.isActive || !this.shieldPlaylistId) {
      return false;
    }
    
    try {
      // Only add the track to the shield playlist if we haven't already added it during this shield session
      if (!this.tracksAddedDuringShield.has(track.id)) {
        // In a real app, we would add the track to the shield playlist
        const trackUri = `spotify:track:${track.id}`;
        const addResponse = await SpotifyService.addTracksToPlaylist(
          accessToken,
          this.shieldPlaylistId,
          [trackUri]
        );
        
        if (addResponse.success) {
          this.tracksAddedDuringShield.add(track.id);
          return true;
        }
      } else {
        // Track already added during this shield session
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Failed to process current track:", error);
      return false;
    }
  }
  
  // Process recently played tracks that were played during an active shield session
  public async processRecentTracks(accessToken: string, tracks: Track[]): Promise<boolean> {
    if (!this.shieldPlaylistId) {
      return false;
    }
    
    try {
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
      
      // In a real app, we would add these tracks to the shield playlist
      const trackUris = tracksToProcess.map(track => `spotify:track:${track.id}`);
      const addResponse = await SpotifyService.addTracksToPlaylist(
        accessToken,
        this.shieldPlaylistId,
        trackUris
      );
      
      if (addResponse.success) {
        tracksToProcess.forEach(track => this.tracksAddedDuringShield.add(track.id));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Failed to process recent tracks:", error);
      return false;
    }
  }
  
  // Clear the shield playlist (e.g., when logging out or periodically)
  public async clearShieldPlaylist(accessToken: string): Promise<boolean> {
    if (!this.shieldPlaylistId) {
      return false;
    }
    
    try {
      const clearResponse = await SpotifyService.clearPlaylist(
        accessToken,
        this.shieldPlaylistId
      );
      
      return clearResponse.success;
    } catch (error) {
      console.error("Failed to clear shield playlist:", error);
      return false;
    }
  }
}

// Export the singleton instance
export const protectionMechanism = ProtectionMechanism.getInstance();

// Export a hook to use the protection mechanism
export const useProtectionMechanism = () => {
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
  };
};