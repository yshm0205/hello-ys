export interface LectureCatalogVod {
  id: string;
  title: string;
  duration: number;
  vdoCipherId?: string;
}

export interface LectureCatalogChapter {
  id: string;
  title: string;
  hasPracticeCta?: boolean;
  vods: LectureCatalogVod[];
}
