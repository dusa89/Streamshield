export interface Track {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  albumArt: string;
  duration: number; // in ms
  timestamp?: number; // for recently played tracks
}