"use client";

import { useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import UploadView from "./components/UploadView";
import HistoryView from "./components/HistoryView";
import SettingsView from "./components/SettingsView";
import Toast from "./components/Toast";
import { ExtractionResult } from "./types";

import { Search, History, Settings as SettingsIcon, Menu } from "lucide-react";

export default function Home() {
  const [activeView, setActiveView] = useState<"upload" | "history" | "settings">("upload");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<ExtractionResult[]>([]);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const addToHistory = useCallback((result: ExtractionResult) => {
    setHistory((prev) => [result, ...prev]);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar 
        activeView={activeView} 
        onNavigate={(view) => {
          setActiveView(view);
          setSidebarOpen(false);
        }} 
        historyCount={history.length} 
        isOpen={sidebarOpen}
      />
      <div 
        className={`mobile-overlay ${sidebarOpen ? "open" : ""}`} 
        onClick={() => setSidebarOpen(false)} 
      />
      <div className="main-content">
        <header className="header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <span className="header-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {activeView === "upload" && <><Search size={20} /> Analyze Document</>}
              {activeView === "history" && <><History size={20} /> Extraction History</>}
              {activeView === "settings" && <><SettingsIcon size={20} /> Settings</>}
            </span>
          </div>
        </header>

        <main className="page">
          {activeView === "upload" && (
            <UploadView
              onResult={addToHistory}
              onToast={showToast}
            />
          )}
          {activeView === "history" && (
            <HistoryView history={history} onClear={() => setHistory([])} />
          )}
          {activeView === "settings" && (
            <SettingsView />
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
