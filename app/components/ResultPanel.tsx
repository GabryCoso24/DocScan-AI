"use client";

import { useState } from "react";
import { ExtractionResult, ExtractedData } from "@/types";
import { Receipt, FileText, ScrollText, IdCard, AlertCircle, CheckCircle2, Copy, Check, Image as ImageIcon, Database, ShoppingCart, Code, Zap } from "lucide-react";

interface ResultPanelProps {
  result: ExtractionResult;
  previewUrl: string | null;
}

type Tab = "structured" | "json" | "items";

export default function ResultPanel({ result, previewUrl }: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("structured");
  const [copied, setCopied] = useState(false);

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const docTypeClass: Record<string, string> = {
    receipt: "doc-receipt",
    invoice: "doc-invoice",
    contract: "doc-contract",
    id_document: "doc-id",
    other: "doc-other",
  };

  const docTypeLabel: Record<string, React.ReactNode> = {
    receipt: <><Receipt size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Scontrino</>,
    invoice: <><FileText size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Fattura</>,
    contract: <><ScrollText size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Contratto</>,
    id_document: <><IdCard size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Documento ID</>,
    other: <><FileText size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Altro</>,
  };

  if (result.status === "error") {
    return (
      <div
        className="card mt-4"
        style={{ borderColor: "rgba(239,68,68,0.3)" }}
      >
        <div className="card-header">
          <span className="card-title" style={{ color: "var(--error)", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={18} /> Errore durante l&apos;estrazione
          </span>
        </div>
        <div className="card-body">
          <p style={{ color: "var(--text-secondary)" }}>{result.error}</p>
        </div>
      </div>
    );
  }

  const data = result.data as ExtractedData;

  return (
    <div style={{ marginTop: 24 }}>
      {/* Meta row */}
      <div className="flex items-center gap-2 mb-4" style={{ flexWrap: "wrap" }}>
        <span
          className={`badge ${result.status === "success" ? "badge-success" : "badge-error"}`}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          {result.status === "success" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} Estratto
        </span>
        <span className={`doc-type ${docTypeClass[data?.document_type] || "doc-other"}`} style={{ display: "flex", alignItems: "center" }}>
          {docTypeLabel[data?.document_type] || <><FileText size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Documento</>}
        </span>
        <span className="badge badge-processing" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Database size={12} /> {result.model}
        </span>
        <span
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginLeft: "auto",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Zap size={12} color="var(--warning)" /> {result.processing_time_ms}ms · {result.filename}</span>
        </span>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          id="tab-structured"
          className={`tab ${activeTab === "structured" ? "active" : ""}`}
          onClick={() => setActiveTab("structured")}
        >
          <Database size={14} /> Dati Strutturati
        </button>
        <button
          id="tab-items"
          className={`tab ${activeTab === "items" ? "active" : ""}`}
          onClick={() => setActiveTab("items")}
        >
          <ShoppingCart size={14} /> Articoli ({data?.line_items?.length || 0})
        </button>
        <button
          id="tab-json"
          className={`tab ${activeTab === "json" ? "active" : ""}`}
          onClick={() => setActiveTab("json")}
        >
          <Code size={14} /> JSON Raw
        </button>
      </div>

      <div className="two-col">
        {/* Left: Image preview */}
        <div className="card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)", minHeight: 500 }}>
          <div className="card-header">
            <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ImageIcon size={18} /> Documento
            </span>
            <div className="confidence-bar" style={{ width: 160 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Confidenza</span>
              <div className="confidence-track" style={{ flex: 1 }}>
                <div
                  className="confidence-fill"
                  style={{ width: `${(data?.confidence || 0) * 100}%` }}
                />
              </div>
              <span className="confidence-label">
                {Math.round((data?.confidence || 0) * 100)}%
              </span>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, display: "flex", flexDirection: "column", flex: 1, overflowY: "auto" }}>
            {previewUrl ? (
              <div
                className="image-preview-container"
                style={{
                  flex: 1,
                  minHeight: 500,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "var(--bg-secondary)",
                  backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  padding: 16,
                  position: "relative",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Document preview"
                  className="image-preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    borderRadius: 4,
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    transition: "transform 0.3s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
              </div>
            ) : (
              <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
                <span className="empty-icon">
                  <ImageIcon size={48} color="var(--text-muted)" />
                </span>
              </div>
            )}
          </div>
          {data?.raw_text_summary && (
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--border)",
                fontSize: 12,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                Sommario AI
              </div>
              {data.raw_text_summary}
            </div>
          )}
        </div>

        {/* Right: Data */}
        <div className="card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)", minHeight: 500 }}>
          <div className="card-header">
            <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {activeTab === "structured" && <><Database size={18} /> Dati Estratti</>}
              {activeTab === "items" && <><ShoppingCart size={18} /> Articoli</>}
              {activeTab === "json" && <><Code size={18} /> Output JSON</>}
            </span>
            {activeTab === "json" && (
              <button id="copy-json-btn" className="btn btn-sm btn-secondary" onClick={copyJson} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {copied ? <><Check size={14} /> Copiato!</> : <><Copy size={14} /> Copia</>}
              </button>
            )}
          </div>
          <div className="card-body" style={{ flex: 1, overflowY: "auto" }}>
            {activeTab === "structured" && <StructuredView data={data} />}
            {activeTab === "items" && <ItemsView data={data} />}
            {activeTab === "json" && <JsonView data={data} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function StructuredView({ data }: { data: ExtractedData }) {
  if (!data) return null;

  const fmt = (v: number | null, currency = "EUR") =>
    v != null
      ? new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(v)
      : "—";

  const fields = [
    { label: "Fornitore", value: data.vendor_name || "—" },
    { label: "Indirizzo", value: data.vendor_address || "—" },
    { label: "P.IVA", value: data.vendor_vat || "—" },
    { label: "Data", value: data.date || "—" },
    { label: "Ora", value: data.time || "—" },
    { label: "N. Fattura", value: data.invoice_number || "—" },
    { label: "Pagamento", value: data.payment_method || "—" },
    { label: "Lingua", value: data.language?.toUpperCase() || "—" },
  ];

  return (
    <div>
      {/* Totals highlight */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 20,
          padding: 16,
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius)",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>TOTALE</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent-light)" }}>
            {fmt(data.total_amount, data.currency)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>IVA ({data.tax_rate ? `${data.tax_rate}%` : "—"})</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
            {fmt(data.tax_amount, data.currency)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>IMPONIBILE</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {fmt(data.subtotal, data.currency)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>ARTICOLI</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {data.line_items?.length || 0}
          </div>
        </div>
      </div>

      {fields.map((f) => (
        <div key={f.label} className="field-row">
          <span className="field-label">{f.label}</span>
          <span className="field-value" style={{ maxWidth: 200, textAlign: "right" }}>
            {f.value}
          </span>
        </div>
      ))}

      {data.notes && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "var(--bg-secondary)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--text-secondary)",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>NOTE</div>
          {data.notes}
        </div>
      )}
    </div>
  );
}

function ItemsView({ data }: { data: ExtractedData }) {
  if (!data?.line_items?.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon" style={{ display: "inline-block", marginBottom: 12 }}>
          <ShoppingCart size={48} color="var(--text-muted)" />
        </span>
        <p className="empty-text">Nessun articolo trovato</p>
        <p className="empty-sub">Il documento non contiene righe dettagliate</p>
      </div>
    );
  }

  const fmt = (v: number, currency = "EUR") =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(v);

  return (
    <div>
      <div className="items-list">
        {data.line_items.map((item, i) => (
          <div key={i} className="item-row">
            <span className="item-name">{item.name}</span>
            <span className="item-qty">x{item.quantity}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 8 }}>
              @{fmt(item.unit_price, data.currency)}
            </span>
            <span className="item-price">{fmt(item.total, data.currency)}</span>
          </div>
        ))}
      </div>
      <div
        className="item-row"
        style={{
          marginTop: 8,
          background: "rgba(37,99,235,0.08)",
          borderRadius: 8,
          padding: "10px 12px",
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>TOTALE</span>
        <span />
        <span />
        <span style={{ fontWeight: 700, color: "var(--accent-light)", fontSize: 16 }}>
          {fmt(data.total_amount || 0, data.currency)}
        </span>
      </div>
    </div>
  );
}

function JsonView({ data }: { data: ExtractedData }) {
  const json = JSON.stringify(data, null, 2);

  // Simple syntax highlighting
  const highlighted = json
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');

  return (
    <div
      className="json-output"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}
