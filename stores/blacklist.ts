import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface BlacklistItem {
  id: string;
  name: string;
  artist?: string;
}

interface BlacklistState {
  blacklistedArtists: BlacklistItem[];
  blacklistedGenres: BlacklistItem[];
  blacklistedTracks: BlacklistItem[];
  addArtist: (artist: BlacklistItem) => void;
  addGenre: (genre: BlacklistItem) => void;
  addTrack: (track: BlacklistItem) => void;
  removeArtist: (id: string) => void;
  removeGenre: (id: string) => void;
  removeTrack: (id: string) => void;
}

export const useBlacklistStore = create<BlacklistState>()(
  persist(
    (set) => ({
      blacklistedArtists: [
        { id: "artist1", name: "Children's Music Artist" },
        { id: "artist2", name: "Meditation Guide" },
      ],
      blacklistedGenres: [
        { id: "genre1", name: "Children's Music" },
        { id: "genre2", name: "Sleep" },
      ],
      blacklistedTracks: [
        { id: "track1", name: "Baby Shark", artist: "Pinkfong" },
        { id: "track2", name: "Relaxing Sounds", artist: "Sleep Aid" },
      ],
      addArtist: (artist) => 
        set((state) => ({
          blacklistedArtists: [...state.blacklistedArtists, artist]
        })),
      addGenre: (genre) => 
        set((state) => ({
          blacklistedGenres: [...state.blacklistedGenres, genre]
        })),
      addTrack: (track) => 
        set((state) => ({
          blacklistedTracks: [...state.blacklistedTracks, track]
        })),
      removeArtist: (id) => 
        set((state) => ({
          blacklistedArtists: state.blacklistedArtists.filter(artist => artist.id !== id)
        })),
      removeGenre: (id) => 
        set((state) => ({
          blacklistedGenres: state.blacklistedGenres.filter(genre => genre.id !== id)
        })),
      removeTrack: (id) => 
        set((state) => ({
          blacklistedTracks: state.blacklistedTracks.filter(track => track.id !== id)
        })),
    }),
    {
      name: "blacklist-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);