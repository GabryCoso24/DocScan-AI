"use client";

import { ScanSearch, UploadCloud, FileText, Settings } from "lucide-react";

interface SidebarProps {
  activeView: "upload" | "history" | "settings";
  onNavigate: (view: "upload" | "history" | "settings") => void;
  historyCount: number;
}

export default function Sidebar({ activeView, onNavigate, historyCount }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ScanSearch size={28} color="var(--accent)" />
        </div>
        <div>
          <div className="sidebar-logo-text">DocScan AI</div>
          <div className="sidebar-logo-sub">Document Intelligence</div>
        </div>
      </div>

      <div className="sidebar-section-label">Menu</div>

      <nav className="sidebar-nav">
        <button
          id="nav-upload"
          className={`nav-item ${activeView === "upload" ? "active" : ""}`}
          onClick={() => onNavigate("upload")}
        >
          <span className="nav-item-icon">
            <UploadCloud size={18} />
          </span>
          Analyze Document
        </button>

        <button
          id="nav-history"
          className={`nav-item ${activeView === "history" ? "active" : ""}`}
          onClick={() => onNavigate("history")}
        >
          <span className="nav-item-icon">
            <FileText size={18} />
          </span>
          History
          {historyCount > 0 && (
            <span
              style={{
                marginLeft: "auto",
                background: "var(--accent)",
                color: "white",
                borderRadius: "10px",
                padding: "1px 7px",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {historyCount}
            </span>
          )}
        </button>

        <button
          id="nav-settings"
          className={`nav-item ${activeView === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <span className="nav-item-icon">
            <Settings size={18} />
          </span>
          Settings
        </button>
      </nav>

      <div style={{ marginTop: "auto" }}>
        <div className="divider" />
        <div style={{ padding: "8px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Stack</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              "Next.js 16.2.10",
              "React 19",
              "TypeScript",
              "OpenRouter API",
              "PDF.js",
            ].map((tech) => (
              <div key={tech} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{tech}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "8px 12px", marginTop: 8 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
            MVP built for the application
          </div>
          <div style={{ fontSize: 11, color: "var(--accent-light)", fontWeight: 600, marginTop: 2 }}>
            Mamazen
          </div>
        </div>
      </div>
    </aside>
  );
}
