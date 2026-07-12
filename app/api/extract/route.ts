import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL?.trim() || "google/gemini-3-flash-preview";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || "";

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
- date format must be YYYY-MM-DD
- classify the document based on the visual content, not just the file type
- do not default to receipt for PDFs; if the document has invoice number, VAT, subtotal, tax breakdown, or supplier billing details, classify it as invoice
- use the filename hint when available, especially for ambiguous PDFs`;

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
  sourceFileName: string,
  sourceMimeType: string,
  model: string
) {
  const client = new OpenAI({ apiKey: OPENROUTER_API_KEY, baseURL: "https://openrouter.ai/api/v1" });

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
            text: [
              "Extract all data from this document and return it as the specified JSON schema.",
              `Source file name: ${sourceFileName || "unknown"}`,
              `Original source type: ${sourceMimeType || "unknown"}`,
              "If the original file was a PDF, use the filename and visual layout to distinguish receipts from invoices.",
            ].join("\n"),
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

function generateDemoData(sourceFileName: string, sourceMimeType: string) {
  const isPdf = sourceMimeType === "application/pdf" || sourceFileName.toLowerCase().endsWith(".pdf");
  const lc = sourceFileName.toLowerCase();
  const isInvoice = isPdf || lc.includes("fattura") || lc.includes("invoice");

  if (isInvoice) {
    return {
      document_type: "invoice",
      vendor_name: "Tech Solutions S.r.l.",
      vendor_address: "Via Roma 42, 20121 Milano (MI)",
      vendor_vat: "IT12345678901",
      date: "2025-07-08",
      time: null,
      total_amount: 2928.0,
      currency: "EUR",
      subtotal: 2400.0,
      tax_amount: 528.0,
      tax_rate: 22.0,
      payment_method: "Bonifico bancario",
      invoice_number: "FT-2025-00847",
      line_items: [
        { name: "Sviluppo feature Next.js", quantity: 8, unit_price: 150.0, total: 1200.0 },
        { name: "Integrazione API Stripe", quantity: 4, unit_price: 150.0, total: 600.0 },
        { name: "Setup Supabase + Auth", quantity: 4, unit_price: 150.0, total: 600.0 },
      ],
      notes: "Pagamento entro 30 giorni. IBAN: IT60 X054 2811 1010 0000 0123 456",
      confidence: 0.96,
      language: "it",
      raw_text_summary: "Fattura numero FT-2025-00847 emessa da Tech Solutions S.r.l. per servizi di sviluppo software. Totale imponibile €2400, IVA 22% €528, totale €2928.",
    };
  }

  return {
    document_type: "receipt",
    vendor_name: "Caffè Centrale",
    vendor_address: "Piazza Duomo 5, 20122 Milano",
    vendor_vat: "IT09876543210",
    date: "2025-07-12",
    time: "09:47",
    total_amount: 12.5,
    currency: "EUR",
    subtotal: 11.89,
    tax_amount: 0.61,
    tax_rate: 5.1,
    payment_method: "Carta di credito",
    invoice_number: null,
    line_items: [
      { name: "Cappuccino", quantity: 2, unit_price: 1.5, total: 3.0 },
      { name: "Cornetto integrale", quantity: 2, unit_price: 1.8, total: 3.6 },
      { name: "Acqua naturale 0.5L", quantity: 1, unit_price: 1.5, total: 1.5 },
      { name: "Tramezzino tonno", quantity: 1, unit_price: 3.5, total: 3.5 },
    ],
    notes: null,
    confidence: 0.93,
    language: "it",
    raw_text_summary: "Scontrino bar caffè con 4 articoli: 2 cappuccini, 2 cornetti, 1 acqua, 1 tramezzino. Totale €12.50 pagato con carta.",
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    imageBase64,
    mimeType,
    sourceFileName = "document",
    sourceMimeType = mimeType,
  } = body;

  if (!imageBase64) {
    return NextResponse.json(
      { error: "Missing required field: imageBase64" },
      { status: 400 }
    );
  }

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({
      mode: "demo",
      data: generateDemoData(sourceFileName, sourceMimeType),
      processing_time_ms: 2600,
      model: `${DEFAULT_MODEL} (demo)`,
      tokens_used: 0,
    });
  }

  const startTime = Date.now();

  try {
    const result = await extractWithOpenRouter(
      imageBase64,
      mimeType || "image/jpeg",
      sourceFileName,
      sourceMimeType,
      DEFAULT_MODEL
    );

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      mode: "real",
      data: result.data,
      processing_time_ms: processingTime,
      model: DEFAULT_MODEL,
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
