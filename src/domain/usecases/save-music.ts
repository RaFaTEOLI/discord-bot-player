export type SaveMusicParams = {
  name: string;
};

export interface SaveMusic {
  save: (data: SaveMusicParams) => Promise<void>;
}
