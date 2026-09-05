"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Theme = {
  id: number;
  name: string;
  count: number;
  avg_severity: number;
  negative_ratio: number;
  source_diversity: number;
  priority_score: number;
  summary: string | null;
};

type Feedback = {
  id: number;
  text: string;
  source: string;
  customer_id: string | null;
  feedback_type: string | null;
  sentiment: string | null;
  severity: number | null;
  theme: string | null;
  confidence: number | null;
};

export default function Home() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Feedback[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [themeRes, feedbackRes] = await Promise.all([
      fetch(`${API}/themes`),
      fetch(`${API}/feedback`),
    ]);
    if (themeRes.ok) setThemes(await themeRes.json());
    if (feedbackRes.ok) setFeedback(await feedbackRes.json());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function upload() {
    if (!file) return;
    setBusy(true);
    setStatus("Uploading feedback...");
    const body = new FormData();
    body.append("file", file);

    const res = await fetch(`${API}/feedback/upload`, { method: "POST", body });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.detail || "Upload failed.");
      setBusy(false);
      return;
    }

    setStatus(`Imported ${data.created} feedback items.`);
    await refresh();
    setBusy(false);
  }

  async function analyze() {
    setBusy(true);
    setStatus("Analyzing customer feedback...");
    const res = await fetch(`${API}/analyze`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setStatus("Analysis failed.");
      setBusy(false);
      return;
    }

    setStatus(`Analyzed ${data.analyzed} feedback items.`);
    await refresh();
    setBusy(false);
  }

  async function openEvidence(theme: string) {
    setSelectedTheme(theme);
    const res = await fetch(`${API}/themes/${encodeURIComponent(theme)}/evidence`);
    if (res.ok) setEvidence(await res.json());
  }

  const stats = useMemo(() => {
    const analyzed = feedback.filter((x) => x.theme).length;
    const negative = feedback.filter((x) => x.sentiment === "negative").length;
    return {
      total: feedback.length,
      analyzed,
      negativePct: feedback.length ? Math.round((negative / feedback.length) * 100) : 0,
    };
  }, [feedback]);

  return (
    <main className="shell">
      <div className="topbar">
        <div>
          <div className="eyebrow">Voice of Customer Intelligence</div>
          <h1>SignalIQ</h1>
          <p className="subtitle">
            Turn fragmented customer feedback into evidence-backed product opportunities.
            Every recommendation should be traceable to what users actually said.
          </p>
        </div>
      </div>

      <section className="grid">
        <div className="card"><div className="muted">Feedback imported</div><div className="metric">{stats.total}</div></div>
        <div className="card"><div className="muted">Feedback analyzed</div><div className="metric">{stats.analyzed}</div></div>
        <div className="card"><div className="muted">Negative feedback</div><div className="metric">{stats.negativePct}%</div></div>
      </section>

      <section className="card">
        <h2>1. Import feedback</h2>
        <p className="muted">CSV requires a <b>text</b> column. Optional: source, customer_id.</p>
        <div className="actions">
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button disabled={!file || busy} onClick={upload}>Upload CSV</button>
          <button className="secondary" disabled={!feedback.length || busy} onClick={analyze}>Analyze feedback</button>
        </div>
        <div className="status">{status}</div>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>2. Prioritized opportunities</h2>
        <p className="muted">
          Initial score = frequency + severity + negative sentiment + source diversity.
          We should change this after user research.
        </p>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Opportunity</th><th>Priority</th><th>Mentions</th><th>Severity</th><th>Negative</th><th>Sources</th><th></th>
              </tr>
            </thead>
            <tbody>
              {themes.map((theme) => (
                <tr key={theme.id}>
                  <td>
                    <strong>{theme.name}</strong>
                    <div className="muted" style={{ marginTop: 6 }}>{theme.summary}</div>
                  </td>
                  <td className="score">{theme.priority_score}</td>
                  <td>{theme.count}</td>
                  <td>{theme.avg_severity}/5</td>
                  <td>{Math.round(theme.negative_ratio * 100)}%</td>
                  <td>{theme.source_diversity}</td>
                  <td><button className="secondary" onClick={() => openEvidence(theme.name)}>Evidence</button></td>
                </tr>
              ))}
              {!themes.length && (
                <tr><td colSpan={7} className="muted">Upload and analyze feedback to generate opportunities.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedTheme && (
          <div className="evidence">
            <h3>Evidence — {selectedTheme}</h3>
            {evidence.map((item) => (
              <div className="evidenceItem" key={item.id}>
                <div style={{ marginBottom: 8 }}>{item.text}</div>
                <span className="badge">{item.source}</span>{" "}
                {item.feedback_type && <span className="badge">{item.feedback_type}</span>}{" "}
                {item.sentiment && <span className="badge">{item.sentiment}</span>}{" "}
                {item.severity && <span className="badge">severity {item.severity}/5</span>}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
