export interface LectureCatalogVod {
  id: string;
  title: string;
  duration: number;
  isPlayable?: boolean;
}

export interface LectureCatalogChapter {
  id: string;
  title: string;
  hasPracticeCta?: boolean;
  vods: LectureCatalogVod[];
}
