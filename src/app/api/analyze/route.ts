import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "@/types";

const client = new Anthropic();

// ぴよログCSVの最大行数（トークン節約のため）
const MAX_ROWS = 500;

function trimCsv(csv: string): string {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length <= MAX_ROWS + 1) return csv;
  // ヘッダー + 最新MAX_ROWS行を使用
  const header = lines[0];
  const dataLines = lines.slice(1);
  const recent = dataLines.slice(-MAX_ROWS);
  return [header, ...recent].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { csv } = await req.json();

    if (!csv || typeof csv !== "string") {
      return NextResponse.json(
        { error: "CSVデータが見つかりません" },
        { status: 400 }
      );
    }

    if (csv.length < 50) {
      return NextResponse.json(
        { error: "CSVが短すぎます。正しいぴよログのエクスポートファイルを使用してください" },
        { status: 400 }
      );
    }

    const trimmedCsv = trimCsv(csv);

    const prompt = `あなたは育児中の親を温かくサポートするAIアシスタントです。
以下はぴよログアプリからエクスポートされた育児ログのCSVデータです。
このデータを分析して、パパ・ママへの評価とコメントをJSON形式で返してください。

## CSVデータ
\`\`\`
${trimmedCsv}
\`\`\`

## 出力形式
以下のJSONを**そのまま**返してください（説明文は不要）:

{
  "score": 0〜100の整数（育児の記録の丁寧さ・継続性・バランスを評価）,
  "title": "スコアに合わせた称号（例: 「超一流の育児マスター！」「毎日コツコツ育児人」など）",
  "comment": "パパ・ママへの温かい評価コメント（200字程度、具体的なデータに基づいて）",
  "stats": [
    { "label": "記録期間", "value": "〇〇日間" },
    { "label": "総記録数", "value": "〇〇件" },
    { "label": "授乳回数", "value": "〇〇回（ある場合）" },
    { "label": "睡眠記録", "value": "〇〇回（ある場合）" },
    { "label": "排泄記録", "value": "〇〇回（ある場合）" },
    { "label": "体重記録", "value": "〇〇回（ある場合）" }
  ],
  "highlights": [
    "具体的なデータから見えるがんばりポイント（3〜5個）"
  ],
  "advice": "育児を続けるための優しいアドバイスや応援メッセージ（1〜2文）"
}

## 注意
- statsは実際に存在するデータのみ含める（0回のものは省く）
- コメントは育児の大変さを労いながら、具体的な記録の良い点を褒める
- スコアは厳しくしすぎず、記録してくれていること自体を評価する
- 必ずJSONのみを返す（前後の説明文は不要）`;

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    });

    // テキストブロックを取得
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "AIからの応答が取得できませんでした" },
        { status: 500 }
      );
    }

    // JSONを抽出してパース
    const rawText = textBlock.text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AIの応答形式が正しくありませんでした" },
        { status: 500 }
      );
    }

    const result: AnalysisResult = JSON.parse(jsonMatch[0]);

    // バリデーション
    if (
      typeof result.score !== "number" ||
      !result.title ||
      !result.comment ||
      !Array.isArray(result.stats) ||
      !Array.isArray(result.highlights)
    ) {
      return NextResponse.json(
        { error: "分析結果の形式が正しくありませんでした" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("Analysis error:", e);

    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "APIキーが設定されていません。ANTHROPIC_API_KEYを設定してください" },
        { status: 500 }
      );
    }

    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "APIの利用制限に達しました。しばらく経ってから再試行してください" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "分析中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
