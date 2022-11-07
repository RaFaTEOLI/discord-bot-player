export type SaveMusicParams = {
  name: string | null;
};

export interface SaveMusic {
  save: (data: SaveMusicParams) => Promise<void>;
}
