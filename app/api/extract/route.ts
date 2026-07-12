import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const EXTRACTION_SCHEMA = `{
  "document_type": "receipt" | "invoice" | "contract" | "id_document" | "other",
  "vendor_name": string | null,
  "vendor_address": string | null,
  "vendor_vat": string | null,
  "date": "YYYY-MM-DD" | null,
  "time": "HH:MM" | null,
  "total_amount": number | null,
  "currency": string (ISO 4217, e.g. "EUR"),
  "subtotal": number | null,
  "tax_amount": number | null,
  "tax_rate": number | null (percentage as float, e.g. 22.0),
  "payment_method": string | null,
  "invoice_number": string | null,
  "line_items": [{ "name": string, "quantity": number, "unit_price": number, "total": number }],
  "notes": string | null,
  "confidence": number (0.0 to 1.0),
  "language": string (ISO 639-1, e.g. "it"),
  "raw_text_summary": string
}`;

const SYSTEM_PROMPT = `You are a precise document data extraction AI.
Analyze the provided document image and extract all relevant information.

Return ONLY valid JSON matching this exact schema (no markdown code blocks, no explanation, raw JSON only):
${EXTRACTION_SCHEMA}

Rules:
- All monetary values as floats with 2 decimal places
- If a field is not visible or not applicable, use null — never invent values
- confidence should reflect legibility (0.9+ = very clear, 0.5- = blurry/incomplete)
- For line_items, extract every visible item
- date format must be YYYY-MM-DD`;

// ─── Utilities ───────────────────────────────────────────────────────────────

function parseJsonFromAI(raw: string): unknown {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function isRateLimit(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return (
    e?.status === 429 ||
    Boolean(e?.message?.includes("RESOURCE_EXHAUSTED")) ||
    Boolean(e?.message?.includes("429")) ||
    Boolean(e?.message?.includes("Too Many Requests"))
  );
}

function isAuthError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return (
    e?.status === 401 ||
    Boolean(e?.message?.includes("API_KEY_INVALID")) ||
    Boolean(e?.message?.includes("401"))
  );
}

// ─── OpenRouter handler ────────────────────────────────────────────────────────
async function extractWithOpenRouter(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  model: string
) {
  const client = new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });

  const response = await client.chat.completions.create({
    model,
    max_tokens: 2000,
    temperature: 0.1,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: "Extract all data from this document and return it as the specified JSON schema.",
          },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  return {
    data: parseJsonFromAI(raw),
    tokens_used: response.usage?.total_tokens || 0,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { imageBase64, mimeType, apiKey, model } = body;

  if (!imageBase64 || !apiKey) {
    return NextResponse.json(
      { error: "Missing required fields: imageBase64, apiKey" },
      { status: 400 }
    );
  }

  const startTime = Date.now();

  try {
    const result = await extractWithOpenRouter(
      imageBase64,
      mimeType || "image/jpeg",
      apiKey,
      model || "google/gemini-3-flash-preview"
    );

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      data: result.data,
      processing_time_ms: processingTime,
      model: model || "google/gemini-3-flash-preview",
      tokens_used: result.tokens_used,
    });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };

    if (isAuthError(err)) {
      return NextResponse.json(
        { error: "API key non valida. Controlla le impostazioni." },
        { status: 401 }
      );
    }

    if (isRateLimit(err)) {
      // Return immediately — client handles countdown + auto-retry
      return NextResponse.json(
        {
          error: "Rate limit OpenRouter raggiunto. Riprovo automaticamente...",
          retry_after_seconds: 5,
        },
        { status: 429 }
      );
    }

    // JSON parse error
    const msg = err?.message || "";
    if (msg.includes("JSON") || msg.includes("SyntaxError")) {
      return NextResponse.json(
        { error: "Il modello non ha restituito JSON valido. Riprova." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: msg || "Errore interno del server" },
      { status: 500 }
    );
  }
}
