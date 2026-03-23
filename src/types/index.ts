export interface Stat {
  label: string;
  value: string;
}

export interface DetailItem {
  category: string;
  content: string;
}

export interface AnalysisResult {
  score: number;
  title: string;
  comment: string;
  stats: Stat[];
  details: DetailItem[];
  advice?: string;
}
