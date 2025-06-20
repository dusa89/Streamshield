export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number; // in ms
  timestamp?: number; // for recently played tracks
}