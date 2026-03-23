"use client";

import { useState, useRef } from "react";
import type { AnalysisResult } from "@/types";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
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

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
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
            育児ログをアップロードすると、AIがあなたの頑張りを評価してコメントします
          </p>
        </div>

        {/* アップロードエリア */}
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* 分析ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            !file || loading
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

      {/* AIコメント */}
      <div className="bg-gradient-to-br from-orange-100 to-yellow-50 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-orange-500 mb-3">
          💬 AIからのコメント
        </h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {result.comment}
        </p>
      </div>

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

      {/* ハイライト */}
      {result.highlights.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">
            ✨ がんばりポイント
          </h2>
          <ul className="space-y-2">
            {result.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-orange-400 mt-0.5">●</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* アドバイス */}
      {result.advice && (
        <div className="bg-blue-50 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-blue-500 mb-3">
            💡 ひとことアドバイス
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{result.advice}</p>
        </div>
      )}
    </div>
  );
}
