:root {
  --bg: #0f172a;
  --bg-2: #111827;
  --card: #132238;
  --panel: #152b46;
  --panel-soft: #1a3257;
  --border: #2e4a6c;
  --text: #edf3ff;
  --muted: #a9bfd9;
  --primary: #8ec5ff;
  --primary-strong: #4f9df8;
  --accent: #7ef0c8;
  --danger: #ff6c7a;
  --warning: #f3b75e;
  --success: #5bd49b;
  --shadow: 0 12px 30px rgba(15, 23, 42, 0.25);
  --radius: 18px;
}

* { box-sizing: border-box; }

html {
  color-scheme: dark;
  font-size: 16px;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%);
  color: var(--text);
}

button, input, select, textarea {
  font: inherit;
}

button {
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

button:active {
  transform: scale(0.98);
}

.app-shell {
  max-width: 980px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 18px 16px 80px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0 20px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

h1, h2, h3, p {
  margin-top: 0;
}

h1 {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  margin-bottom: 0;
}

.main-nav {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.nav-btn {
  background: var(--panel-soft);
  color: var(--text);
  padding: 12px 10px;
  font-weight: 700;
  border: 1px solid transparent;
}

.nav-btn.active {
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-strong) 100%);
  color: #0f172a;
  border-color: rgba(255, 255, 255, 0.2);
}

.tab-panel {
  display: none;
}

.tab-panel.active {
  display: block;
}

.card {
  background: rgba(19, 34, 56, 0.95);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-header h2,
.section-header h3 {
  margin-bottom: 0;
}

.section-header.compact {
  align-items: flex-start;
}

.label-inline,
.status-pill {
  font-size: 0.8rem;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(255,255,255,0.02);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.primary-action,
.secondary-action,
.ghost-button,
.danger-button,
.inline-close {
  min-height: 52px;
  font-weight: 700;
  padding: 12px 16px;
}

.primary-action {
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-strong) 100%);
  color: #071521;
}

.secondary-action {
  background: var(--panel-soft);
  color: var(--text);
  border: 1px solid var(--border);
}

.ghost-button {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
}

.danger-button {
  background: linear-gradient(180deg, #ff7d8a 0%, var(--danger) 100%);
  color: white;
  width: 100%;
}

.inline-close {
  background: transparent;
  color: var(--muted);
  padding: 8px 10px;
  min-height: auto;
  border: 1px solid var(--border);
}

.full-width {
  width: 100%;
}

.panel-form.hidden,
.hidden-file-input {
  display: none;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 0.92rem;
  font-weight: 700;
}

.field-grid {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}

.field-grid.two-up {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

input[type="text"],
input[type="date"],
textarea {
  width: 100%;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  padding: 12px 14px;
}

input::placeholder,
textarea::placeholder {
  color: #7f92b2;
}

input[type="range"] {
  width: 100%;
  accent-color: var(--primary-strong);
}

.pain-scale-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.pain-value-pill {
  min-width: 88px;
  background: rgba(142, 197, 255, 0.12);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 12px 14px;
  text-align: center;
  font-weight: 700;
  color: var(--primary);
}

.voice-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.recording-status {
  margin-top: 12px;
  color: var(--muted);
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-item {
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.02);
  border-radius: 14px;
  padding: 12px 14px;
}

.timeline-item-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-item-type {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.event-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.8rem;
  font-weight: 700;
}

.event-badge.pain { background: rgba(255, 108, 122, 0.12); color: #ffb2bb; }
.event-badge.medication { background: rgba(126, 240, 200, 0.12); color: #bafada; }
.event-badge.note { background: rgba(142, 197, 255, 0.12); color: #cfe6ff; }
.event-badge.voice { background: rgba(243, 183, 94, 0.12); color: #f9d88b; }

.timeline-meta {
  color: var(--muted);
  font-size: 0.9rem;
}

.event-detail {
  color: var(--text);
  margin: 8px 0 0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.event-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.event-actions button {
  min-height: 38px;
  padding: 8px 12px;
}

.report-summary,
.report-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.range-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-box {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px 14px;
}

.stat-label {
  display: block;
  color: var(--muted);
  margin-bottom: 6px;
  font-size: 0.8rem;
}

.stat-box strong {
  font-size: 1.5rem;
}

.export-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.content-block {
  line-height: 1.65;
  color: var(--text);
}

.content-block p {
  margin-bottom: 12px;
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border);
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 84px;
  transform: translateX(-50%);
  background: rgba(5, 10, 18, 0.92);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 999px;
  padding: 10px 16px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.toast.show {
  opacity: 1;
}

.empty-state {
  border: 1px dashed var(--border);
  border-radius: 14px;
  color: var(--muted);
  background: rgba(255,255,255,0.02);
  padding: 18px;
  text-align: center;
}

.audio-player {
  width: 100%;
  margin-top: 10px;
}

@media (max-width: 640px) {
  .app-shell {
    padding-left: 12px;
    padding-right: 12px;
  }

  .main-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quick-grid,
  .field-grid.two-up,
  .stat-grid {
    grid-template-columns: 1fr;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .section-header,
  .range-controls,
  .export-buttons {
    flex-direction: column;
    align-items: stretch;
  }
}

@media print {
  body {
    background: white;
    color: black;
  }

  .main-nav,
  .footer-bar,
  .toast,
  .event-actions,
  .quick-actions,
  .hidden-file-input,
  .panel-form,
  .button,
  .ghost-button,
  .secondary-action,
  .primary-action,
  .danger-button {
    display: none !important;
  }

  .app-shell {
    max-width: none;
    padding: 0;
  }

  .card {
    box-shadow: none;
    border: 1px solid #d0d0d0;
    background: white;
    color: black;
  }

  .timeline-item {
    background: white;
    color: black;
    border: 1px solid #d0d0d0;
  }
}

