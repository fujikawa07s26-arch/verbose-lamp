"use client";

import { useState, useRef } from "react";
import type { AnalysisResult, RhythmPattern, FussyZone, Prediction, PdcaItem } from "@/types";

type InputMode = "file" | "paste";

export default function Home() {
  const [mode, setMode] = useState<InputMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".csv") && f.type !== "text/csv") {
      setError("CSVファイルを選択してください");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleModeSwitch = (newMode: InputMode) => {
    setMode(newMode);
    setError(null);
    setResult(null);
  };

  const canSubmit =
    mode === "file" ? !!file : pastedText.trim().length >= 50;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let csvText: string;
      if (mode === "file") {
        csvText = await file!.text();
      } else {
        csvText = pastedText.trim();
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "分析に失敗しました");
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">🐣</div>
          <h1 className="text-3xl font-bold text-orange-800 mb-2">
            ぴよログ分析
          </h1>
          <p className="text-orange-600 text-sm">
            育児ログをアップロードすると、AIがリズム・予測・改善提案までまとめてくれます
          </p>
        </div>

        {/* モード切替タブ */}
        <div className="flex rounded-xl overflow-hidden border border-orange-200 mb-6">
          <button
            onClick={() => handleModeSwitch("file")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === "file"
                ? "bg-orange-500 text-white"
                : "bg-white text-orange-500 hover:bg-orange-50"
            }`}
          >
            📁 CSVファイル
          </button>
          <button
            onClick={() => handleModeSwitch("paste")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === "paste"
                ? "bg-orange-500 text-white"
                : "bg-white text-orange-500 hover:bg-orange-50"
            }`}
          >
            📋 テキストを貼り付け
          </button>
        </div>

        {/* ファイルアップロードエリア */}
        {mode === "file" && (
          <div
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer mb-6 ${
              dragOver
                ? "border-orange-400 bg-orange-100"
                : file
                ? "border-green-400 bg-green-50"
                : "border-orange-300 bg-white hover:border-orange-400 hover:bg-orange-50"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {file ? (
              <div>
                <div className="text-4xl mb-2">📋</div>
                <p className="font-semibold text-green-700">{file.name}</p>
                <p className="text-sm text-green-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  className="mt-3 text-xs text-gray-400 underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setResult(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  ファイルを変更
                </button>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-3">📁</div>
                <p className="text-orange-700 font-medium">
                  CSVファイルをここにドロップ
                </p>
                <p className="text-orange-400 text-sm mt-1">
                  またはクリックして選択
                </p>
                <p className="text-gray-400 text-xs mt-3">
                  ぴよログ → 設定 → バックアップ・引き継ぎ → CSVエクスポート
                </p>
              </div>
            )}
          </div>
        )}

        {/* テキスト貼り付けエリア */}
        {mode === "paste" && (
          <div className="mb-6">
            <textarea
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value);
                setResult(null);
                setError(null);
              }}
              placeholder={`ぴよログのテキストをここに貼り付けてください。\n\n例:\n【ぴよログ】2026年2月\n\n----------\n2026/2/1(日)\nれお (9か月13日)\n\n09:20   起きる (12時間30分)\n...`}
              className="w-full h-56 rounded-2xl border-2 border-orange-200 p-4 text-sm text-gray-700 resize-none focus:outline-none focus:border-orange-400 bg-white placeholder:text-gray-300"
            />
            <p className="text-xs text-gray-400 mt-2 ml-1">
              ぴよログアプリの「共有」や「テキスト出力」からコピーしたテキストを貼り付けてください
            </p>
            {pastedText.trim().length > 0 && (
              <button
                className="mt-2 text-xs text-gray-400 underline ml-1"
                onClick={() => {
                  setPastedText("");
                  setResult(null);
                }}
              >
                クリア
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* 分析ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            !canSubmit || loading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg active:scale-95"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              AIが分析中...
            </span>
          ) : (
            "🔍 AIに分析してもらう"
          )}
        </button>

        {/* 分析結果 */}
        {result && <AnalysisDisplay result={result} />}

        <p className="text-center text-xs text-gray-400 mt-10">
          アップロードされたデータはAI分析にのみ使用し、保存されません
        </p>
      </div>
    </main>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-green-600 bg-green-100"
      : score >= 60
      ? "text-orange-600 bg-orange-100"
      : "text-blue-600 bg-blue-100";

  const stars = Math.round(score / 20);

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold ${color}`}
    >
      {"⭐".repeat(stars)}
      <span className="text-3xl">{score}</span>
      <span className="text-base font-normal">/ 100</span>
    </div>
  );
}

function RhythmTimeline({ patterns }: { patterns: RhythmPattern[] }) {
  return (
    <div className="space-y-3">
      {patterns.map((p, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-16 text-right">
            <span className="text-xs font-semibold text-orange-600">{p.avgTime}</span>
          </div>
          <div className="flex-shrink-0 w-3 h-3 rounded-full bg-orange-400 border-2 border-white shadow" />
          <div className="flex-1 bg-orange-50 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-orange-800">{p.label}</span>
              {p.durationAvg && (
                <span className="text-xs text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                  {p.durationAvg}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">ばらつき {p.variance}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FussyZoneList({ zones }: { zones: FussyZone[] }) {
  const levelColor = (level: FussyZone["level"]) => {
    if (level === "高") return "bg-red-100 text-red-700 border-red-200";
    if (level === "中") return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  return (
    <div className="space-y-2">
      {zones.map((z, i) => (
        <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${levelColor(z.level)}`}>
          <div className="mt-0.5 font-bold text-sm w-16 flex-shrink-0">{z.level}リスク</div>
          <div>
            <p className="font-semibold text-sm">{z.timeRange}</p>
            <p className="text-xs mt-0.5 opacity-80">{z.reason}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const riskColor =
    prediction.fussyRiskLevel === "高"
      ? "text-red-600 bg-red-50 border-red-200"
      : prediction.fussyRiskLevel === "中"
      ? "text-yellow-600 bg-yellow-50 border-yellow-200"
      : "text-green-600 bg-green-50 border-green-200";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-500 font-semibold mb-1">次の昼寝</p>
          <p className="text-xl font-bold text-blue-700">{prediction.nextNapTime}</p>
          <p className="text-xs text-blue-400 mt-1">{prediction.nextNapDuration}</p>
        </div>
        <div className={`rounded-xl p-4 text-center border ${riskColor}`}>
          <p className="text-xs font-semibold mb-1">ぐずりリスク</p>
          <p className="text-xl font-bold">{prediction.fussyRiskLevel}</p>
          <p className="text-xs mt-1 opacity-80">{prediction.fussyRiskTime}</p>
        </div>
      </div>
      <div className="bg-indigo-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-indigo-600 mb-1">今日のスケジュールアドバイス</p>
        <p className="text-sm text-indigo-800 leading-relaxed">{prediction.scheduleAdvice}</p>
      </div>
    </div>
  );
}

function PdcaList({ items }: { items: PdcaItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-2 mb-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {i + 1}
            </span>
            <p className="text-sm font-semibold text-gray-700">{item.hypothesis}</p>
          </div>
          <div className="ml-8 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-green-600 w-12 flex-shrink-0 mt-0.5">やること</span>
              <p className="text-xs text-gray-600 leading-relaxed">{item.action}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-blue-500 w-12 flex-shrink-0 mt-0.5">確認点</span>
              <p className="text-xs text-gray-500 leading-relaxed">{item.checkPoint}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalysisDisplay({ result }: { result: AnalysisResult }) {
  return (
    <div className="mt-8 space-y-5">
      {/* スコア */}
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <p className="text-sm text-gray-500 mb-2">総合評価スコア</p>
        <ScoreBadge score={result.score} />
        <p className="mt-3 text-orange-700 font-semibold text-lg">
          {result.title}
        </p>
      </div>

      {/* チミィーのコメント */}
      <div className="bg-gradient-to-br from-orange-100 to-yellow-50 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-orange-500 mb-3">
          🎩 チミィーからのコメント
        </h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {result.comment}
        </p>
      </div>

      {/* 今日の予測（最も実用的なセクション） */}
      {result.prediction && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">
            🔮 今日の予測スケジュール
          </h2>
          <PredictionCard prediction={result.prediction} />
        </div>
      )}

      {/* リズムパターン */}
      {result.rhythmPatterns && result.rhythmPatterns.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">
            ⏰ 生活リズムのパターン
          </h2>
          <RhythmTimeline patterns={result.rhythmPatterns} />
        </div>
      )}

      {/* ぐずりやすい時間帯 */}
      {result.fussyZones && result.fussyZones.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">
            😢 ぐずりやすい時間帯
          </h2>
          <FussyZoneList zones={result.fussyZones} />
        </div>
      )}

      {/* まとめ統計 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 mb-4">
          📊 期間のまとめ
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {result.stats.map((stat) => (
            <div key={stat.label} className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-lg font-bold text-orange-700 mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* カテゴリ別分析 */}
      {result.details && result.details.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">
            🔍 くわしい分析
          </h2>
          <ul className="space-y-4">
            {result.details.map((d, i) => (
              <li key={i} className="border-b border-orange-100 pb-4 last:border-0 last:pb-0">
                <p className="text-xs font-semibold text-orange-500 mb-1">{d.category}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{d.content}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 改善PDCA */}
      {result.pdca && result.pdca.length > 0 && (
        <div className="rounded-2xl p-6 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
          <h2 className="text-sm font-semibold text-green-700 mb-1">
            🔄 育児改善PDCA
          </h2>
          <p className="text-xs text-green-500 mb-4">試してみたい改善アイデア。やってみて、記録して、また分析！</p>
          <PdcaList items={result.pdca} />
        </div>
      )}

      {/* アドバイス */}
      {result.advice && (
        <div className="bg-blue-50 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-blue-500 mb-3">
            🎩 チミィーからの応援メッセージ
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{result.advice}</p>
        </div>
      )}
    </div>
  );
}
