"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ExtractionResult } from "@/types";
import ResultPanel from "./ResultPanel";
import { Clock, FileUp } from "lucide-react";

interface UploadViewProps {
  onResult: (result: ExtractionResult) => void;
  onToast: (msg: string, type: "success" | "error") => void;
}

export default function UploadView({
  onResult,
  onToast,
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
      if (!isSupportedFile(file)) {
        onToast("Please upload an image or PDF (JPG, PNG, WebP, HEIC, PDF)", "error");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        onToast("File too large. Maximum 20MB", "error");
        return;
      }
      if (cooldown > 0) {
        onToast(`⏳ Wait another ${cooldown}s before trying again`, "error");
        return;
      }

      // Create preview URL and upload payload
      const { base64, mimeType, previewUrl } = await prepareFileForUpload(file);
      const objectUrl = previewUrl;
      setPreviewUrl(objectUrl);
      setCurrentResult(null);
      setIsProcessing(true);
      setProgress(10);
      setProgressLabel(isPdfFile(file) ? "Rendering PDF..." : "Uploading image...");

      try {
        setProgress(30);
        setProgressLabel("Analyzing with AI...");

        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType,
            sourceFileName: file.name,
            sourceMimeType: file.type,
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
          throw new Error(errData.error || `API error ${response.status}`);
        }

        const respData = await response.json();
        const data = respData.data;
        const processingTime = respData.processing_time_ms;
        const model = respData.model;
        const isDemo = respData.mode === "demo";

        setProgress(95);
        setProgressLabel("Completed!");
        await sleep(300);

        const result: ExtractionResult = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          filename: file.name,
          file_size: file.size,
          image_url: objectUrl,
          model: model || "OpenRouter",
          processing_time_ms: processingTime,
          status: "success",
          data,
          error: null,
        };

        setCurrentResult(result);
        onResult(result);
        setProgress(100);
        onToast(
          isDemo
            ? "Demo completed! (no API key mode)"
            : `Extraction completed in ${(processingTime / 1000).toFixed(1)}s`,
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
          model: "OpenRouter",
          processing_time_ms: 0,
          status: "error",
          data: null,
          error: error.message || "Unknown error",
        };
        setCurrentResult(result);
        onResult(result);
        onToast(`Error: ${error.message}`, "error");
      } finally {
        setIsProcessing(false);
        setProgress(0);
        setProgressLabel("");
      }
    },
    [onResult, onToast, startCooldown]
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
          <h1 className="page-title">Analyze Document</h1>
          <p className="page-subtitle">
            Upload a receipt, invoice, or document — AI extracts all data into structured JSON
          </p>
        </div>
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
                  Rate limit — retrying automatically in {cooldown}s
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                  OpenRouter free tier limit reached. Please wait for the automatic retry.
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
          accept="image/*,application/pdf,.pdf"
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
              {dragOver ? "Drop here" : "Drag the document here"}
            </h2>
            <p className="upload-subtitle">or click to select a file</p>
            <div className="upload-formats">
              {["JPG", "PNG", "WebP", "HEIC", "PDF"].map((fmt) => (
                <span key={fmt} className="format-tag">{fmt}</span>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
              PDF supported: the first page is rendered as an image · Max 20MB
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
function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isSupportedFile(file: File) {
  return file.type.startsWith("image/") || isPdfFile(file);
}

async function prepareFileForUpload(file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  if (isPdfFile(file)) {
    const previewUrl = await renderPdfFirstPageToDataUrl(file);
    return {
      base64: previewUrl.split(",")[1],
      mimeType: "image/jpeg",
      previewUrl,
    };
  }

  const dataUrl = await compressImage(file);
  const base64 = dataUrl.split(",")[1];
  const previewUrl = URL.createObjectURL(file);
  
  return {
    base64,
    mimeType: "image/jpeg",
    previewUrl,
  };
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      
      const MAX_DIMENSION = 2000;
      
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };
    
    img.src = url;
  });
}

async function renderPdfFirstPageToDataUrl(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdfData = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create a canvas for the PDF");
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Fill white background for PDF before rendering
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: context, canvas, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.8);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
