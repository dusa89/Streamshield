import { Track } from "@/types/track";

export const mockCurrentTrack: Track = {
  id: "current1",
  name: "Blinding Lights",
  artist: "The Weeknd",
  album: "After Hours",
  albumArt: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format",
  duration: 200000, // in ms
};

export const mockRecentTracks: Track[] = [
  {
    id: "track1",
    name: "Save Your Tears",
    artist: "The Weeknd",
    album: "After Hours",
    albumArt: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format",
    duration: 215000,
    timestamp: Date.now() - 1000000, // ~16 minutes ago
  },
  {
    id: "track2",
    name: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    albumArt: "https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=200&auto=format",
    duration: 203000,
    timestamp: Date.now() - 1215000, // ~20 minutes ago
  },
  {
    id: "track3",
    name: "Peaches",
    artist: "Justin Bieber",
    album: "Justice",
    albumArt: "https://images.unsplash.com/photo-1622977266039-dbb162254c12?q=80&w=200&auto=format",
    duration: 198000,
    timestamp: Date.now() - 1418000, // ~23 minutes ago
  },
  {
    id: "track4",
    name: "Leave The Door Open",
    artist: "Silk Sonic",
    album: "An Evening with Silk Sonic",
    albumArt: "https://images.unsplash.com/photo-1619983081593-e2ba5b543168?q=80&w=200&auto=format",
    duration: 242000,
    timestamp: Date.now() - 1660000, // ~27 minutes ago
  },
  {
    id: "track5",
    name: "Montero (Call Me By Your Name)",
    artist: "Lil Nas X",
    album: "Montero",
    albumArt: "https://images.unsplash.com/photo-1618609378039-b572f64d54a5?q=80&w=200&auto=format",
    duration: 137000,
    timestamp: Date.now() - 1797000, // ~30 minutes ago
  },
];