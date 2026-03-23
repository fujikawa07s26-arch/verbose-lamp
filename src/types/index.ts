export interface Stat {
  label: string;
  value: string;
}

export interface AnalysisResult {
  score: number;
  title: string;
  comment: string;
  stats: Stat[];
  highlights: string[];
  advice?: string;
}
