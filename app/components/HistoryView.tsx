"use client";

import { ExtractionResult } from "@/types";
import { Trash2, FileText, Receipt, ScrollText, IdCard, Bot, Globe, History, CheckCircle, XCircle } from "lucide-react";

interface HistoryViewProps {
  history: ExtractionResult[];
  onClear: () => void;
}

export default function HistoryView({ history, onClear }: HistoryViewProps) {
  const fmt = (v: number, currency = "EUR") => {
    try {
      return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(v);
    } catch {
      return `${currency} ${v}`;
    }
  };

  const docTypeLabel: Record<string, React.ReactNode> = {
    receipt: <><Receipt size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Receipt</>,
    invoice: <><FileText size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Invoice</>,
    contract: <><ScrollText size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Contract</>,
    id_document: <><IdCard size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> ID</>,
    other: <><FileText size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Other</>,
  };

  const successCount = history.filter((h) => h.status === "success").length;
  const totalAmount = history
    .filter((h) => h.status === "success" && h.data?.total_amount)
    .reduce((sum, h) => sum + (h.data?.total_amount || 0), 0);

  return (
    <div>
      <div className="action-bar">
        <div>
          <h1 className="page-title">Extraction History</h1>
          <p className="page-subtitle">{history.length} documents analyzed in this session</p>
        </div>
        {history.length > 0 && (
          <button id="clear-history-btn" className="btn btn-secondary btn-sm" onClick={onClear} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Trash2 size={14} /> Clear history
          </button>
        )}
      </div>

      {history.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Analyzed</div>
            <div className="stat-value">{history.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Successful</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>{successCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Amount</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{fmt(totalAmount)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Time</div>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {history.length
                ? Math.round(
                    history.reduce((s, h) => s + h.processing_time_ms, 0) / history.length
                  ) + "ms"
                : "—"}
            </div>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-icon">
              <History size={48} color="var(--text-muted)" />
            </span>
            <p className="empty-text">No extractions yet</p>
            <p className="empty-sub">Upload a document to get started</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <table className="history-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Type</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Doc. Date</th>
                <th>Model</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {item.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.filename}
                          className="history-thumb"
                          style={{
                            width: 36,
                            height: 36,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = "scale(1.1)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
                          }}
                        />
                      )}
                      <div>
                        <div
                          className="truncate"
                          style={{ maxWidth: 150, fontSize: 13, fontWeight: 500 }}
                        >
                          {item.filename}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {(item.file_size / 1024).toFixed(0)}KB ·{" "}
                          {new Date(item.timestamp).toLocaleTimeString("it-IT")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.data?.document_type ? (
                      <span style={{ fontSize: 12, display: "flex", alignItems: "center" }}>
                        {docTypeLabel[item.data.document_type] || <><FileText size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Other</>}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {item.data?.vendor_name || <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-light)" }}>
                    {item.data?.total_amount != null
                      ? fmt(item.data.total_amount, item.data.currency)
                      : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {item.data?.date || <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {item.model}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {item.processing_time_ms > 0 ? `${item.processing_time_ms}ms` : "—"}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        item.status === "success" ? "badge-success" : "badge-error"
                      }`}
                    >
                      {item.status === "success" ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={12} /> OK</span>
                      ) : (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><XCircle size={12} /> Error</span>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
