"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ExtractionResult } from "@/types";
import ResultPanel from "./ResultPanel";
import { AlertTriangle, Clock, FileUp } from "lucide-react";

interface UploadViewProps {
  apiKey: string;
  selectedModel: string;
  onResult: (result: ExtractionResult) => void;
  onToast: (msg: string, type: "success" | "error") => void;
  onGoSettings: () => void;
}

export default function UploadView({
  apiKey,
  selectedModel,
  onResult,
  onToast,
  onGoSettings,
}: UploadViewProps) {
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentResult, setCurrentResult] = useState<ExtractionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingFileRef = useRef<File | null>(null); // file to auto-retry after cooldown
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Countdown ticker
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = useCallback((seconds: number, fileToRetry?: File) => {
    if (fileToRetry) pendingFileRef.current = fileToRetry;
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          // Auto-retry the pending file when countdown expires
          if (pendingFileRef.current) {
            const f = pendingFileRef.current;
            pendingFileRef.current = null;
            // Defer so state settles first
            setTimeout(() => processFile(f), 100);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        onToast("Per favore carica un'immagine (JPG, PNG, WebP, HEIC)", "error");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        onToast("File troppo grande. Massimo 20MB", "error");
        return;
      }
      if (cooldown > 0) {
        onToast(`⏳ Aspetta ancora ${cooldown}s prima di riprovare`, "error");
        return;
      }

      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setCurrentResult(null);
      setIsProcessing(true);
      setProgress(10);
      setProgressLabel("Caricamento immagine...");

      try {
        // Convert file to base64
        const base64 = await fileToBase64(file);
        setProgress(30);
        setProgressLabel("Analisi con AI in corso...");

        const demoMode = !apiKey;

        let data, processingTime, model;

        if (demoMode) {
          // Simulate AI processing with realistic demo data
          await sleep(1800);
          setProgress(70);
          setProgressLabel("Estrazione dati strutturati...");
          await sleep(800);

          const demoData = generateDemoData(file.name);
          data = demoData;
          processingTime = 2600;
          model = "google/gemini-3-flash-preview (demo)";
        } else {
          const response = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: base64,
              mimeType: file.type,
              apiKey,
              model: selectedModel,
            }),
          });

          setProgress(80);
          setProgressLabel("Parsing JSON...");

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            if (response.status === 429 && errData.retry_after_seconds) {
              // Pass the file so it auto-retries after countdown
              startCooldown(errData.retry_after_seconds, file);
            }
            throw new Error(errData.error || `Errore API ${response.status}`);
          }

          const respData = await response.json();
          data = respData.data;
          processingTime = respData.processing_time_ms;
          model = respData.model;
        }

        setProgress(95);
        setProgressLabel("Completato!");
        await sleep(300);

        const result: ExtractionResult = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          filename: file.name,
          file_size: file.size,
          image_url: objectUrl,
          model: model || selectedModel,
          processing_time_ms: processingTime,
          status: "success",
          data,
          error: null,
        };

        setCurrentResult(result);
        onResult(result);
        setProgress(100);
        onToast(
          demoMode
            ? "Demo completata! (modalità senza API key)"
            : `Estrazione completata in ${(processingTime / 1000).toFixed(1)}s`,
          "success"
        );
      } catch (err: unknown) {
        const error = err as Error;
        const result: ExtractionResult = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          filename: file.name,
          file_size: file.size,
          image_url: objectUrl,
          model: selectedModel,
          processing_time_ms: 0,
          status: "error",
          data: null,
          error: error.message || "Errore sconosciuto",
        };
        setCurrentResult(result);
        onResult(result);
        onToast(`Errore: ${error.message}`, "error");
      } finally {
        setIsProcessing(false);
        setProgress(0);
        setProgressLabel("");
      }
    },
    [apiKey, selectedModel, onResult, onToast, startCooldown]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset so same file can be re-uploaded
      e.target.value = "";
    },
    [processFile]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Analizza Documento</h1>
          <p className="page-subtitle">
            Carica uno scontrino, fattura o documento — l&apos;AI estrae tutti i dati in JSON strutturato
          </p>
        </div>
        {!apiKey && (
          <div
            style={{
              background: "var(--warning-bg)",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: "var(--radius)",
              padding: "10px 16px",
              fontSize: 13,
              color: "var(--warning)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              maxWidth: 280,
            }}
          >
            <AlertTriangle size={16} />
            <span>
              Modalità demo attiva.{" "}
              <button
                onClick={onGoSettings}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--warning)",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              >
                Aggiungi API key
              </button>{" "}
              per usare OpenRouter.
            </span>
          </div>
        )}
      </div>

      {/* Rate limit cooldown banner */}
      {cooldown > 0 && (
        <div
          style={{
            background: "rgba(37,99,235,0.08)",
            border: "1px solid rgba(37,99,235,0.25)",
            borderRadius: "var(--radius)",
            padding: "14px 20px",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={20} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--accent-light)" }}>
                  Rate limit — riprovo tra {cooldown}s in automatico
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                  OpenRouter free tier limit raggiunto. Attendi il retry automatico.
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--accent-light)",
                minWidth: 52,
                textAlign: "right",
              }}
            >
              {cooldown}s
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${100 - (cooldown / 15) * 100}%`,
                transition: "width 1s linear",
              }}
            />
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div
        id="upload-zone"
        className={`upload-zone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); if (!cooldown) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isProcessing && !cooldown && fileInputRef.current?.click()}
        style={{ cursor: isProcessing || cooldown > 0 ? "not-allowed" : "pointer", opacity: cooldown > 0 ? 0.5 : 1, transition: "opacity 0.3s ease" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileInput}
          id="file-input"
        />

        {isProcessing ? (
          <div>
            <div className="loading-state">
              <div className="spinner" />
              <p className="loading-label" style={{ marginTop: 16 }}>{progressLabel}</p>
            </div>
            <div className="progress-bar" style={{ maxWidth: 300, margin: "0 auto" }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="upload-icon" style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <FileUp size={48} strokeWidth={1} color="var(--text-secondary)" />
            </div>
            <h2 className="upload-title">
              {dragOver ? "Rilascia qui" : "Trascina il documento qui"}
            </h2>
            <p className="upload-subtitle">oppure clicca per selezionare un file</p>
            <div className="upload-formats">
              {["JPG", "PNG", "WebP", "HEIC", "PDF*"].map((fmt) => (
                <span key={fmt} className="format-tag">{fmt}</span>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
              *PDF: converti in immagine per ora · Max 20MB
            </p>
          </>
        )}
      </div>

      {/* Result */}
      {currentResult && !isProcessing && (
        <div className="animate-in">
          <ResultPanel result={currentResult} previewUrl={previewUrl} />
        </div>
      )}
    </div>
  );
}

// Utilities
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get raw base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateDemoData(filename: string) {
  const lc = filename.toLowerCase();
  const isInvoice = lc.includes("fattura") || lc.includes("invoice");

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
