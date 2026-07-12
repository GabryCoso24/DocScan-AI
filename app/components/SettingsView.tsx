"use client";

import { Info, Target, Clock, Wrench, FileJson, Rocket, KeyRound, FileCode2 } from "lucide-react";

export default function SettingsView() {
  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">
        Configure deployment via environment variables and review the technical details of the project
      </p>

      <div style={{ maxWidth: 640 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <KeyRound size={18} /> Environment Setup
            </span>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                padding: 12,
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius)",
                fontSize: 13,
                color: "var(--text-secondary)",
                borderLeft: "3px solid var(--accent)",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>OpenRouter API key:</strong> set 
              <code style={{ fontFamily: "inherit", color: "var(--accent-light)" }}> OPENROUTER_API_KEY </code>
              in your <code style={{ fontFamily: "inherit", color: "var(--accent-light)" }}> .env.local </code>
               file to enable real extraction and keep the key out of the browser bundle.
            </div>

            <div
              style={{
                padding: 12,
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius)",
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              Optional: set <code style={{ fontFamily: "inherit", color: "var(--accent-light)" }}>OPENROUTER_MODEL </code>
              if you want to override the default server model without changing the code.
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FileCode2 size={18} color="#2563eb" /> Runtime behavior
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <div>• If <code style={{ fontFamily: "inherit", color: "var(--accent-light)" }}>OPENROUTER_API_KEY</code> is present, the app uses real extraction.</div>
              <div>• If the key is missing, the app switches to demo mode automatically.</div>
              <div>• PDF uploads are rendered client-side and classified using the file content plus filename hints.</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Info size={18} /> About this MVP
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                [<Target key="scope" size={14} />, "Scope", "MVP for the Mamazen application process — AI Full-Stack Developer"],
                  [
                    <Wrench key="stack" size={14} />,
                    "Stack",
                    "Next.js 16 App Router · React 19 · TypeScript 5 · OpenRouter API · PDF.js · Vercel-ready",
                  ],
                [<FileJson key="feat" size={14} />, "Features", "Upload, AI extraction, structured JSON, history, demo mode"],
                [<Rocket key="deploy" size={14} />, "Deploy", "Vercel-ready with zero config"],
              ].map(([icon, label, value]) => (
                <div key={label as string} className="field-row" style={{ paddingTop: 8, paddingBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", minWidth: 100, display: "flex", alignItems: "center", gap: 6 }}>
                    {icon} {label}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", textAlign: "right" }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}