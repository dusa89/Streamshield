export interface Track {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  albumArt: string;
  duration?: number;
  timestamp?: number;
  isPlaying?: boolean;
}

export interface UserDevice {
  id: string | null;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  shielded: boolean;
  tags?: string[];
  tracks?: number;
  albumArt?: string;
  artistId?: string;
  albumId?: string;
  albumName?: string;
}
