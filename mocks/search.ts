export interface SearchResultItem {
  id: string;
  name: string;
  artist?: string;
}

export interface SearchResults {
  artists: SearchResultItem[];
  genres: SearchResultItem[];
  tracks: SearchResultItem[];
}

export const mockSearchResults: SearchResults = {
  artists: [
    { id: "artist1", name: "The Weeknd" },
    { id: "artist2", name: "Taylor Swift" },
    { id: "artist3", name: "Drake" },
    { id: "artist4", name: "Billie Eilish" },
    { id: "artist5", name: "Dua Lipa" },
  ],
  genres: [
    { id: "genre1", name: "Pop" },
    { id: "genre2", name: "Hip Hop" },
    { id: "genre3", name: "Rock" },
    { id: "genre4", name: "Electronic" },
    { id: "genre5", name: "Classical" },
  ],
  tracks: [
    { id: "track1", name: "Blinding Lights", artist: "The Weeknd" },
    { id: "track2", name: "Save Your Tears", artist: "The Weeknd" },
    { id: "track3", name: "Levitating", artist: "Dua Lipa" },
    { id: "track4", name: "Don't Start Now", artist: "Dua Lipa" },
    { id: "track5", name: "Peaches", artist: "Justin Bieber" },
  ],
};