"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

type View = "overview" | "feedback" | "opportunities";

export default function Home() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [activeView, setActiveView] = useState<View>("overview");

  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [evidence, setEvidence] = useState<Feedback[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function refresh() {
    try {
      const [themeRes, feedbackRes] = await Promise.all([
        fetch(`${API}/themes`),
        fetch(`${API}/feedback`),
      ]);

      if (themeRes.ok) {
        setThemes(await themeRes.json());
      }

      if (feedbackRes.ok) {
        setFeedback(await feedbackRes.json());
      }
    } catch {
      setStatus("Could not connect to the SignalIQ backend.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function uploadFeedback() {
    if (!file) return;

    setBusy(true);
    setStatus("Uploading customer feedback...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API}/feedback/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.detail || "Upload failed.");
        return;
      }

      setStatus(`${data.created} feedback items imported successfully.`);
      setFile(null);
      await refresh();
    } catch {
      setStatus("Could not upload feedback.");
    } finally {
      setBusy(false);
    }
  }

  async function analyzeFeedback() {
    setBusy(true);
    setStatus("SignalIQ is analyzing customer feedback...");

    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("Analysis failed.");
        return;
      }

      setStatus(`${data.analyzed} feedback items analyzed.`);
      await refresh();
    } catch {
      setStatus("Could not run AI analysis.");
    } finally {
      setBusy(false);
    }
  }

  async function openEvidence(theme: Theme) {
    setSelectedTheme(theme);

    try {
      const res = await fetch(
        `${API}/themes/${encodeURIComponent(theme.name)}/evidence`
      );

      if (res.ok) {
        setEvidence(await res.json());
      }
    } catch {
      setEvidence([]);
    }
  }

  const stats = useMemo(() => {
    const analyzed = feedback.filter((item) => item.theme).length;

    const negative = feedback.filter(
      (item) => item.sentiment === "negative"
    ).length;

    const critical = themes.filter(
      (theme) => theme.priority_score >= 70
    ).length;

    return {
      total: feedback.length,
      analyzed,
      negativePercent: feedback.length
        ? Math.round((negative / feedback.length) * 100)
        : 0,
      opportunityCount: themes.length,
      critical,
    };
  }, [feedback, themes]);

  const topThemes = themes.slice(0, 5);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>

          <div>
            <div className="brand-name">SignalIQ</div>
            <div className="brand-subtitle">Product Intelligence</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-section-label">Overview</div>

          <button
            className={`nav-item ${
              activeView === "overview" ? "active" : ""
            }`}
            onClick={() => setActiveView("overview")}
          >
            <span className="nav-indicator" />
            Dashboard
          </button>

          <div className="nav-section-label">Analyze</div>

          <button
            className={`nav-item ${
              activeView === "feedback" ? "active" : ""
            }`}
            onClick={() => setActiveView("feedback")}
          >
            <span className="nav-indicator" />
            Feedback
          </button>

          <button
            className={`nav-item ${
              activeView === "opportunities" ? "active" : ""
            }`}
            onClick={() => setActiveView("opportunities")}
          >
            <span className="nav-indicator" />
            Opportunities
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="workspace-label">Workspace</div>

          <div className="workspace-card">
            <div className="workspace-avatar">A</div>

            <div>
              <div className="workspace-name">Atiksha</div>
              <div className="workspace-plan">SignalIQ Workspace</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">VOICE OF CUSTOMER INTELLIGENCE</div>

            <h1>
              {activeView === "overview" && "Customer Intelligence"}
              {activeView === "feedback" && "Customer Feedback"}
              {activeView === "opportunities" && "Product Opportunities"}
            </h1>

            <p className="page-description">
              {activeView === "overview" &&
                "Understand what customers need, what is changing, and what deserves attention."}

              {activeView === "feedback" &&
                "Explore every piece of customer feedback and its AI-generated product signals."}

              {activeView === "opportunities" &&
                "Review evidence-backed product opportunities ranked by customer impact."}
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setActiveView("feedback")}
          >
            + Import feedback
          </button>
        </header>

        {status && <div className="status-banner">{status}</div>}

        {activeView === "overview" && (
          <>
            <section className="metrics-grid">
              <MetricCard
                label="Feedback analyzed"
                value={stats.analyzed.toLocaleString()}
                secondary={`${stats.total} imported`}
              />

              <MetricCard
                label="Negative sentiment"
                value={`${stats.negativePercent}%`}
                secondary="Across analyzed feedback"
              />

              <MetricCard
                label="Product opportunities"
                value={stats.opportunityCount.toString()}
                secondary="Recurring customer themes"
              />

              <MetricCard
                label="High-priority signals"
                value={stats.critical.toString()}
                secondary="Priority score above 70"
              />
            </section>

            <section className="dashboard-grid">
              <div className="panel opportunity-panel">
                <div className="panel-header">
                  <div>
                    <h2>Top product opportunities</h2>
                    <p>
                      Prioritized using frequency, severity, sentiment and source
                      diversity.
                    </p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActiveView("opportunities")}
                  >
                    View all
                  </button>
                </div>

                {topThemes.length === 0 ? (
                  <EmptyState
                    title="No product opportunities yet"
                    description="Import feedback and run analysis to discover recurring customer problems."
                    buttonLabel="Import feedback"
                    onClick={() => setActiveView("feedback")}
                  />
                ) : (
                  <div className="opportunity-list">
                    {topThemes.map((theme, index) => (
                      <button
                        key={theme.id}
                        className="opportunity-row"
                        onClick={() => openEvidence(theme)}
                      >
                        <div className="rank">#{index + 1}</div>

                        <div className="opportunity-main">
                          <div className="opportunity-title-row">
                            <strong>{theme.name}</strong>

                            <PriorityBadge score={theme.priority_score} />
                          </div>

                          <div className="opportunity-meta">
                            {theme.count} mention
                            {theme.count !== 1 ? "s" : ""} ·{" "}
                            {theme.source_diversity} source
                            {theme.source_diversity !== 1 ? "s" : ""} · Severity{" "}
                            {theme.avg_severity.toFixed(1)}/5
                          </div>

                          <div className="score-track">
                            <div
                              className="score-fill"
                              style={{
                                width: `${Math.min(
                                  theme.priority_score,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="score-number">
                          {theme.priority_score.toFixed(1)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel signal-panel">
                <div className="panel-header">
                  <div>
                    <h2>Signal health</h2>
                    <p>Current quality of the feedback intelligence pipeline.</p>
                  </div>
                </div>

                <div className="signal-stat">
                  <div>
                    <span className="signal-label">Analysis coverage</span>
                    <strong>
                      {stats.total
                        ? Math.round((stats.analyzed / stats.total) * 100)
                        : 0}
                      %
                    </strong>
                  </div>

                  <div className="mini-track">
                    <div
                      className="mini-fill"
                      style={{
                        width: `${
                          stats.total
                            ? Math.round(
                                (stats.analyzed / stats.total) * 100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="signal-stat">
                  <div>
                    <span className="signal-label">Themes detected</span>
                    <strong>{themes.length}</strong>
                  </div>
                </div>

                <div className="signal-stat">
                  <div>
                    <span className="signal-label">Evidence traceability</span>
                    <strong>Enabled</strong>
                  </div>
                </div>

                <div className="signal-note">
                  Every opportunity can be traced back to the original customer
                  evidence.
                </div>
              </div>
            </section>
          </>
        )}

        {activeView === "feedback" && (
          <>
            <section className="panel upload-panel">
              <div className="panel-header">
                <div>
                  <h2>Import customer feedback</h2>
                  <p>
                    Upload a CSV containing a required{" "}
                    <code>text</code> column and optional{" "}
                    <code>source</code> and <code>customer_id</code>.
                  </p>
                </div>
              </div>

              <label className="dropzone">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] || null)
                  }
                />

                <div className="upload-icon">↑</div>

                <div className="upload-title">
                  {file ? file.name : "Upload customer feedback"}
                </div>

                <div className="upload-copy">
                  Drag and drop a CSV here, or click to browse
                </div>

                <div className="upload-format">CSV · Customer feedback</div>
              </label>

              <div className="upload-actions">
                <button
                  className="secondary-button"
                  disabled={!file || busy}
                  onClick={uploadFeedback}
                >
                  Upload CSV
                </button>

                <button
                  className="primary-button"
                  disabled={!feedback.length || busy}
                  onClick={analyzeFeedback}
                >
                  {busy ? "Working..." : "Analyze feedback"}
                </button>
              </div>
            </section>

            <section className="panel table-panel">
              <div className="panel-header">
                <div>
                  <h2>Feedback library</h2>
                  <p>{feedback.length} customer feedback items</p>
                </div>
              </div>

              {feedback.length === 0 ? (
                <EmptyState
                  title="No feedback imported"
                  description="Upload your first CSV to start building a customer intelligence dataset."
                />
              ) : (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Feedback</th>
                        <th>Source</th>
                        <th>Theme</th>
                        <th>Sentiment</th>
                        <th>Severity</th>
                        <th>Confidence</th>
                      </tr>
                    </thead>

                    <tbody>
                      {feedback.map((item) => (
                        <tr key={item.id}>
                          <td className="feedback-text">{item.text}</td>

                          <td>
                            <span className="neutral-badge">
                              {item.source}
                            </span>
                          </td>

                          <td>{item.theme || "Not analyzed"}</td>

                          <td>
                            <SentimentBadge sentiment={item.sentiment} />
                          </td>

                          <td>
                            {item.severity ? `${item.severity}/5` : "—"}
                          </td>

                          <td>
                            {item.confidence
                              ? `${Math.round(item.confidence * 100)}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {activeView === "opportunities" && (
          <section className="panel table-panel">
            <div className="panel-header">
              <div>
                <h2>Prioritized opportunities</h2>
                <p>
                  Product problems ranked by the strength and severity of
                  customer signals.
                </p>
              </div>
            </div>

            {themes.length === 0 ? (
              <EmptyState
                title="No opportunities discovered yet"
                description="Analyze customer feedback to surface recurring themes and product opportunities."
                buttonLabel="Go to feedback"
                onClick={() => setActiveView("feedback")}
              />
            ) : (
              <div className="table-scroll">
                <table className="data-table opportunity-table">
                  <thead>
                    <tr>
                      <th>Opportunity</th>
                      <th>Priority</th>
                      <th>Mentions</th>
                      <th>Severity</th>
                      <th>Negative</th>
                      <th>Sources</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {themes.map((theme) => (
                      <tr key={theme.id}>
                        <td>
                          <div className="theme-name">{theme.name}</div>

                          <div className="theme-summary">
                            {theme.summary}
                          </div>
                        </td>

                        <td>
                          <PriorityBadge score={theme.priority_score} />
                        </td>

                        <td>{theme.count}</td>

                        <td>{theme.avg_severity.toFixed(1)}/5</td>

                        <td>
                          {Math.round(theme.negative_ratio * 100)}%
                        </td>

                        <td>{theme.source_diversity}</td>

                        <td>
                          <button
                            className="evidence-button"
                            onClick={() => openEvidence(theme)}
                          >
                            Evidence →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {selectedTheme && (
        <div
          className="drawer-backdrop"
          onClick={() => setSelectedTheme(null)}
        >
          <aside
            className="drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <div className="eyebrow">PRODUCT OPPORTUNITY</div>

                <h2>{selectedTheme.name}</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setSelectedTheme(null)}
              >
                ×
              </button>
            </div>

            <div className="drawer-score-card">
              <div>
                <span>Priority score</span>
                <strong>{selectedTheme.priority_score.toFixed(1)}</strong>
              </div>

              <PriorityBadge score={selectedTheme.priority_score} />
            </div>

            <div className="drawer-metrics">
              <div>
                <span>Mentions</span>
                <strong>{selectedTheme.count}</strong>
              </div>

              <div>
                <span>Severity</span>
                <strong>
                  {selectedTheme.avg_severity.toFixed(1)}/5
                </strong>
              </div>

              <div>
                <span>Negative</span>
                <strong>
                  {Math.round(selectedTheme.negative_ratio * 100)}%
                </strong>
              </div>

              <div>
                <span>Sources</span>
                <strong>{selectedTheme.source_diversity}</strong>
              </div>
            </div>

            <div className="drawer-section">
              <h3>Signal summary</h3>
              <p>{selectedTheme.summary}</p>
            </div>

            <div className="drawer-section">
              <h3>Customer evidence</h3>

              <div className="evidence-list">
                {evidence.map((item) => (
                  <div className="evidence-card" key={item.id}>
                    <p>“{item.text}”</p>

                    <div className="evidence-meta">
                      <span>{item.source}</span>

                      {item.feedback_type && (
                        <span>{item.feedback_type}</span>
                      )}

                      {item.severity && (
                        <span>Severity {item.severity}/5</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>

      <div className="metric-value">{value}</div>

      <div className="metric-secondary">{secondary}</div>
    </div>
  );
}

function PriorityBadge({ score }: { score: number }) {
  let label = "Low";

  if (score >= 70) label = "Critical";
  else if (score >= 50) label = "High";
  else if (score >= 35) label = "Medium";

  return (
    <span className={`priority-badge priority-${label.toLowerCase()}`}>
      {label}
    </span>
  );
}

function SentimentBadge({
  sentiment,
}: {
  sentiment: string | null;
}) {
  if (!sentiment) {
    return <span className="neutral-badge">Not analyzed</span>;
  }

  return (
    <span className={`sentiment-badge sentiment-${sentiment}`}>
      {sentiment}
    </span>
  );
}

function EmptyState({
  title,
  description,
  buttonLabel,
  onClick,
}: {
  title: string;
  description: string;
  buttonLabel?: string;
  onClick?: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-mark">S</div>

      <h3>{title}</h3>

      <p>{description}</p>

      {buttonLabel && onClick && (
        <button className="primary-button" onClick={onClick}>
          {buttonLabel}
        </button>
      )}
    </div>
  );
}