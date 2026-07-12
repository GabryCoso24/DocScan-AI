"use client";

import { useState } from "react";
import { Globe, Key, Eye, EyeOff, Save, Info, Target, Clock, Wrench, FileJson, Rocket, Check, AlertTriangle, Database } from "lucide-react";

interface SettingsViewProps {
  apiKey: string;
  onApiKeyChange: (k: string) => void;
  selectedModel: string;
  onModelChange: (m: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
}

const OPENROUTER_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash Preview", desc: "Nuovissimo modello sperimentale, velocissimo e capace" },
  { id: "nvidia/nemotron-nano-12b-v2-vl:free", label: "NVIDIA Nemotron 12B VL (Free)", desc: "100% gratuito, ottimizzato per immagini (Vision Language)" },
  { id: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku", desc: "Intelligente, compatto e velocissimo" },
];

export default function SettingsView({
  apiKey,
  onApiKeyChange,
  selectedModel,
  onModelChange,
  onToast,
}: SettingsViewProps) {
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);

  const handleSave = () => {
    onApiKeyChange(keyInput.trim());
    onToast("Impostazioni salvate", "success");
  };

  return (
    <div>
      <h1 className="page-title">Impostazioni</h1>
      <p className="page-subtitle">Configura la tua API key OpenRouter e il modello AI</p>

      <div style={{ maxWidth: 640 }}>
        {/* API Key */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Key size={18} /> API Key (OpenRouter)
            </span>
            <span
              className={`badge ${apiKey ? "badge-success" : "badge-warning"}`}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              {apiKey ? <><Check size={12} /> Key configurata</> : <><AlertTriangle size={12} /> Nessuna key</>}
            </span>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="input-group">
              <label className="input-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Globe size={14} color="#2563eb" /> <span>OpenRouter API Key</span>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "var(--accent-light)", marginLeft: "auto", textDecoration: "none" }}
                >
                  Ottieni gratis →
                </a>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  id="openrouter-key-input"
                  type={showKey ? "text" : "password"}
                  className="input-field"
                  placeholder="sk-or-v1-..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                />
                <button
                  id="toggle-key"
                  className="btn btn-secondary"
                  onClick={() => setShowKey(!showKey)}
                  style={{ whiteSpace: "nowrap", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div
              style={{
                padding: 12,
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius)",
                fontSize: 12,
                color: "var(--text-secondary)",
                borderLeft: "3px solid var(--accent)",
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>Privacy:</strong> La API key viene
              salvata solo in memoria (sessione corrente) e le chiamate passano direttamente dal
              Next.js route handler al provider.
            </div>

            <button id="save-settings-btn" className="btn btn-primary" onClick={handleSave} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Save size={16} /> Salva impostazioni
            </button>
          </div>
        </div>

        {/* Model selection */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Database size={18} color="#2563eb" /> Modello AI
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {OPENROUTER_MODELS.map((m) => (
                <label
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: "var(--radius)",
                    border: `1px solid ${selectedModel === m.id ? "var(--accent)" : "var(--border)"}`,
                    background:
                      selectedModel === m.id
                        ? "rgba(37,99,235,0.08)"
                        : "var(--bg-secondary)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.id}
                    checked={selectedModel === m.id}
                    onChange={() => onModelChange(m.id)}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Info size={18} /> About questo MVP
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                [<Target key="scopo" size={14} />, "Scopo", "MVP per candidatura Mamazen — AI Full-Stack Developer"],
                [<Clock key="tempo" size={14} />, "Tempo", "~2 ore dalla prima riga di codice"],
                [<Wrench key="stack" size={14} />, "Stack", "Next.js 15 · TypeScript · OpenRouter"],
                [<FileJson key="feat" size={14} />, "Features", "Upload, estrazione AI, JSON strutturato, storico, demo mode"],
                [<Rocket key="deploy" size={14} />, "Deploy", "Pronto per Vercel con zero config"],
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
