export interface Stat {
  label: string;
  value: string;
}

export interface DetailItem {
  category: string;
  content: string;
}

export interface RhythmPattern {
  label: string;   // 例: "起床", "朝寝", "昼寝", "就寝"
  avgTime: string; // 例: "07:30"
  variance: string; // 例: "±30分"
  durationAvg?: string; // 例: "1時間20分"
}

export interface FussyZone {
  timeRange: string; // 例: "17:00〜19:00"
  reason: string;    // 例: "夕方の眠気・空腹が重なりやすい"
  level: "高" | "中" | "低";
}

export interface Prediction {
  nextNapTime: string;       // 例: "10:30頃"
  nextNapDuration: string;   // 例: "約1時間20分"
  fussyRiskTime: string;     // 例: "17:30〜18:30"
  fussyRiskLevel: "高" | "中" | "低";
  scheduleAdvice: string;    // 例: "14時以降の外出は避けると機嫌がよいかも"
}

export interface PdcaItem {
  hypothesis: string;  // 例: "昼寝が短いと夕方にぐずる"
  action: string;      // 例: "昼寝環境を暗くして1時間以上確保する"
  checkPoint: string;  // 例: "昼寝1時間以上の日の夕方の機嫌を記録"
}

export interface AnalysisResult {
  score: number;
  title: string;
  comment: string;
  stats: Stat[];
  details: DetailItem[];
  advice?: string;
  rhythmPatterns?: RhythmPattern[];
  fussyZones?: FussyZone[];
  prediction?: Prediction;
  pdca?: PdcaItem[];
}
