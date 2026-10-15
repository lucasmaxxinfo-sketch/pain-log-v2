// Main application logic for Pain Log V2 (moved from manifest.webmanifest)
const STORAGE_KEY = 'pain-log-v2.entries.v1';
const MAX_TEXT_LENGTH = 5000;

const state = {
  entries: loadEntries(),
  activeTab: 'today',
  diaryDate: getLocalDateString(new Date()),
  lastNoticeTimer: null,
  recognition: null,
  mediaRecorder: null,
  mediaStream: null,
  audioChunks: [],
  // limit recordings by default to 2 minutes (120000 ms)
  maxRecordingMs: 120000,
};

const els = {
  saveStatus: document.getElementById('saveStatus'),
  todayLabel: document.getElementById('todayLabel'),
  todayTimeline: document.getElementById('todayTimeline'),
  diaryEntries: document.getElementById('diaryEntries'),
  diaryDateFilter: document.getElementById('diaryDateFilter'),
  reportStart: document.getElementById('reportStart'),
  reportEnd: document.getElementById('reportEnd'),
  toast: document.getElementById('toast'),
  painLevel: document.getElementById('painLevel'),
  painLevelValue: document.getElementById('painLevelValue'),
  reportDailySummary: document.getElementById('reportDailySummary'),
  statPainCount: document.getElementById('statPainCount'),
  statAveragePain: document.getElementById('statAveragePain'),
  statHighestPain: document.getElementById('statHighestPain'),
  statLowestPain: document.getElementById('statLowestPain'),
  statMedicationCount: document.getElementById('statMedicationCount'),
  statNoteCount: document.getElementById('statNoteCount'),
  importFileInput: document.getElementById('importFileInput'),
  recordingStatus: document.getElementById('recordingStatus'),
};

initialize();

function initialize() {
  bindNavigation();
  bindQuickActions();
  bindPanelInteractions();
  bindFormActions();
  bindExportButtons();
  bindDeleteButton();

  if (els.painLevel) {
    els.painLevel.addEventListener('input', () => {
      els.painLevelValue.textContent = String(els.painLevel.value);
    });
  }

  if (els.diaryDateFilter) els.diaryDateFilter.value = state.diaryDate;
  const today = new Date();
  if (els.reportStart) els.reportStart.value = getLocalDateString(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));
  if (els.reportEnd) els.reportEnd.value = getLocalDateString(today);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        /* no-op: service worker is optional */
      });
    });
  }

  renderAll();
}

function bindNavigation() {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;
      state.activeTab = tab;
      document.querySelectorAll('.nav-btn').forEach((nav) => nav.classList.toggle('active', nav === button));
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${tab}`));
    });
  });
}

function bindQuickActions() {
  document.querySelectorAll('[data-quick]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.quick;
      const cards = {
        pain: 'painFormCard',
        medication: 'medicationFormCard',
        note: 'noteFormCard',
        voice: 'voiceFormCard',
      };
      const openId = cards[action];
      if (!openId) return;
      const card = document.getElementById(openId);
      if (!card) return;
      document.querySelectorAll('.panel-form').forEach((panel) => {
        panel.classList.toggle('hidden', panel !== card);
      });
      if (action === 'pain' && document.getElementById('painLevel')) {
        document.getElementById('painLevel').focus();
      }
      if (action === 'medication' && document.getElementById('medicationName')) {
        document.getElementById('medicationName').focus();
      }
      if (action === 'note' && document.getElementById('noteText')) {
        document.getElementById('noteText').focus();
      }
      if (action === 'voice' && document.getElementById('voiceNoteText')) {
        document.getElementById('voiceNoteText').focus();
      }
    });
  });
}

function bindPanelInteractions() {
  document.querySelectorAll('[data-close-panel]').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.dataset.closePanel);
      if (panel) {
        panel.classList.add('hidden');
      }
    });
  });

  const speechBtn = document.getElementById('speechToTextBtn');
  if (speechBtn) speechBtn.addEventListener('click', useSpeechToText);
  const recordBtn = document.getElementById('recordVoiceBtn');
  if (recordBtn) recordBtn.addEventListener('click', toggleVoiceRecording);
  const clearBtn = document.getElementById('clearTodayBtn');
  if (clearBtn) clearBtn.addEventListener('click', clearTodayEntries);
  const importBtn = document.getElementById('importJsonBtn');
  if (importBtn) importBtn.addEventListener('click', () => document.getElementById('importFileInput').click());
  if (els.importFileInput) els.importFileInput.addEventListener('change', handleImportFile);
  if (els.diaryDateFilter) els.diaryDateFilter.addEventListener('change', (event) => {
    state.diaryDate = event.target.value || getLocalDateString(new Date());
    renderDiary();
  });
  if (els.reportStart) els.reportStart.addEventListener('change', renderReports);
  if (els.reportEnd) els.reportEnd.addEventListener('change', renderReports);
}

function bindFormActions() {
  const savePain = document.getElementById('savePainBtn');
  if (savePain) savePain.addEventListener('click', savePainEntry);
  const saveMed = document.getElementById('saveMedicationBtn');
  if (saveMed) saveMed.addEventListener('click', saveMedicationEntry);
  const saveNote = document.getElementById('saveNoteBtn');
  if (saveNote) saveNote.addEventListener('click', saveNoteEntry);
}

function bindExportButtons() {
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJsonBackup);
  const exportTextBtn = document.getElementById('exportTextBtn');
  if (exportTextBtn) exportTextBtn.addEventListener('click', exportTextReport);
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => {
    showToast('Use the browser print dialog to save as PDF.');
    window.print();
  });
}

function bindDeleteButton() {
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  if (deleteAllBtn) deleteAllBtn.addEventListener('click', () => {
    if (!window.confirm('Delete all entries from this device? This cannot be undone.')) return;
    state.entries = [];
    persistEntries();
    renderAll();
    showToast('All diary data deleted.');
  });
}

function renderAll() {
  if (els.todayLabel) els.todayLabel.textContent = formatFriendlyDate(new Date());
  renderTodayTimeline();
  renderDiary();
  renderReports();
}

function renderTodayTimeline() {
  const today = getLocalDateString(new Date());
  const items = state.entries.filter((entry) => getLocalDateString(new Date(entry.timestamp)) === today).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (!items.length) {
    if (els.todayTimeline) els.todayTimeline.innerHTML = '<div class="empty-state">No entries for today yet. Use quick log to add one.</div>';
    return;
  }

  if (els.todayTimeline) {
    els.todayTimeline.innerHTML = items.map((entry) => renderTimelineItem(entry)).join('');
    bindItemActions();
  }
}

function renderDiary() {
  const selectedDate = state.diaryDate || getLocalDateString(new Date());
  const items = state.entries.filter((entry) => getLocalDateString(new Date(entry.timestamp)) === selectedDate).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (!items.length) {
    if (els.diaryEntries) els.diaryEntries.innerHTML = '<div class="empty-state">No diary entries for this date.</div>';
    return;
  }

  if (els.diaryEntries) {
    els.diaryEntries.innerHTML = items.map((entry) => renderTimelineItem(entry)).join('');
    bindItemActions();
  }
}

function renderReports() {
  const startValue = (els.reportStart && els.reportStart.value) || getLocalDateString(new Date(Date.now() - 6 * 86400000));
  const endValue = (els.reportEnd && els.reportEnd.value) || getLocalDateString(new Date());
  const start = new Date(`${startValue}T00:00:00`);
  const end = new Date(`${endValue}T23:59:59`);
  const filtered = state.entries.filter((entry) => {
    const ts = new Date(entry.timestamp);
    return ts >= start && ts <= end;
  });

  let painValues = filtered.filter((entry) => entry.type === 'pain' && Number.isFinite(Number(entry.painLevel))).map((entry) => Number(entry.painLevel));
  const painCount = painValues.length;
  const avg = painCount ? (painValues.reduce((sum, value) => sum + value, 0) / painCount).toFixed(1) : '0';
  const highest = painCount ? Math.max(...painValues) : 0;
  const lowest = painCount ? Math.min(...painValues) : 0;
  const medicationCount = filtered.filter((entry) => entry.type === 'medication').length;
  const noteCount = filtered.filter((entry) => entry.type === 'note').length;

  if (els.statPainCount) els.statPainCount.textContent = String(painCount);
  if (els.statAveragePain) els.statAveragePain.textContent = String(avg);
  if (els.statHighestPain) els.statHighestPain.textContent = String(highest);
  if (els.statLowestPain) els.statLowestPain.textContent = String(lowest);
  if (els.statMedicationCount) els.statMedicationCount.textContent = String(medicationCount);
  if (els.statNoteCount) els.statNoteCount.textContent = String(noteCount);

  const summaryMap = new Map();
  filtered.forEach((entry) => {
    const key = getLocalDateString(new Date(entry.timestamp));
    if (!summaryMap.has(key)) {
      summaryMap.set(key, { painTotal: 0, painCount: 0, medication: 0, notes: 0 });
    }
    const summary = summaryMap.get(key);
    if (entry.type === 'pain') {
      summary.painTotal += Number(entry.painLevel || 0);
      summary.painCount += 1;
    }
    if (entry.type === 'medication') summary.medication += 1;
    if (entry.type === 'note') summary.notes += 1;
  });

  const dailySummary = Array.from(summaryMap.entries()).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  if (!dailySummary.length) {
    if (els.reportDailySummary) els.reportDailySummary.innerHTML = '<div class="empty-state">No entries in the date range yet.</div>';
    return;
  }

  if (els.reportDailySummary) {
    els.reportDailySummary.innerHTML = dailySummary.map(([date, summary]) => {
      const avgPain = summary.painCount ? (summary.painTotal / summary.painCount).toFixed(1) : '0';
      return `
        <div class="timeline-item">
          <div class="timeline-item-header">
            <div>
              <div class="timeline-item-type">${formatFriendlyDate(new Date(`${date}T00:00:00`))}</div>
            </div>
            <div class="event-badge note">${summary.painCount} pain events</div>
          </div>
          <div class="event-detail">
            Average pain: ${avgPain} · Medication: ${summary.medication} · Notes: ${summary.notes}
          </div>
        </div>
      `;
    }).join('');
  }
}

function bindItemActions() {
  document.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.deleteId;
      if (!window.confirm('Delete this entry?')) return;
      state.entries = state.entries.filter((entry) => entry.id !== targetId);
      persistEntries();
      renderAll();
      showToast('Entry deleted.');
    });
  });

  document.querySelectorAll('[data-edit-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const entryId = button.dataset.editId;
      const entry = state.entries.find((item) => item.id === entryId);
      if (!entry) return;
      if (entry.type === 'pain') {
        const pl = document.getElementById('painLevel');
        if (pl) pl.value = entry.painLevel ?? 5;
        if (document.getElementById('painLevelValue')) document.getElementById('painLevelValue').textContent = String(entry.painLevel ?? 5);
        if (document.getElementById('painLocation')) document.getElementById('painLocation').value = entry.location || '';
        if (document.getElementById('painSymptoms')) document.getElementById('painSymptoms').value = entry.symptoms || '';
        if (document.getElementById('painTrigger')) document.getElementById('painTrigger').value = entry.trigger || '';
        if (document.getElementById('painNote')) document.getElementById('painNote').value = entry.note || '';
        const card = document.getElementById('painFormCard'); if (card) card.classList.remove('hidden');
        const saveBtn = document.getElementById('savePainBtn'); if (saveBtn) { saveBtn.dataset.editId = entry.id; saveBtn.textContent = 'Update pain entry'; }
      }
      if (entry.type === 'medication') {
        if (document.getElementById('medicationName')) document.getElementById('medicationName').value = entry.medicationName || '';
        if (document.getElementById('medicationDose')) document.getElementById('medicationDose').value = entry.dose || '';
        if (document.getElementById('medicationUnit')) document.getElementById('medicationUnit').value = entry.unit || '';
        if (document.getElementById('medicationNote')) document.getElementById('medicationNote').value = entry.note || '';
        const card = document.getElementById('medicationFormCard'); if (card) card.classList.remove('hidden');
        const saveBtn = document.getElementById('saveMedicationBtn'); if (saveBtn) { saveBtn.dataset.editId = entry.id; saveBtn.textContent = 'Update medication'; }
      }
      if (entry.type === 'note' || entry.type === 'voice') {
        if (document.getElementById('noteText')) document.getElementById('noteText').value = entry.note || '';
        const card = document.getElementById('noteFormCard'); if (card) card.classList.remove('hidden');
        const saveBtn = document.getElementById('saveNoteBtn'); if (saveBtn) { saveBtn.dataset.editId = entry.id; saveBtn.textContent = 'Update note'; }
      }
    });
  });
}

function savePainEntry() {
  const painLevel = clampNumber(Number(document.getElementById('painLevel').value), 0, 10);
  const painNote = sanitizeText(document.getElementById('painNote').value, 1000);
  const location = sanitizeText(document.getElementById('painLocation').value, 200);
  const symptoms = sanitizeText(document.getElementById('painSymptoms').value, 200);
  const trigger = sanitizeText(document.getElementById('painTrigger').value, 200);
  const payload = {
    type: 'pain',
    painLevel,
    location,
    symptoms,
    trigger,
    note: painNote,
  };

  const editId = document.getElementById('savePainBtn').dataset.editId;
  if (editId) {
    updateEntry(editId, payload);
    document.getElementById('savePainBtn').dataset.editId = '';
    document.getElementById('savePainBtn').textContent = 'Save pain entry';
  } else {
    addEntry(payload);
  }

  clearPainForm();
  const card = document.getElementById('painFormCard'); if (card) card.classList.add('hidden');
  showToast('Pain entry saved.');
}

function saveMedicationEntry() {
  const medicationName = sanitizeText(document.getElementById('medicationName').value, 200);
  const dose = sanitizeText(document.getElementById('medicationDose').value, 80);
  const unit = sanitizeText(document.getElementById('medicationUnit').value, 50);
  const note = sanitizeText(document.getElementById('medicationNote').value, 1000);

  if (!medicationName.trim()) {
    showToast('Medication name is required.');
    return;
  }

  const payload = {
    type: 'medication',
    medicationName: medicationName.trim(),
    dose: dose.trim(),
    unit: unit.trim(),
    note,
  };

  const editId = document.getElementById('saveMedicationBtn').dataset.editId;
  if (editId) {
    updateEntry(editId, payload);
    document.getElementById('saveMedicationBtn').dataset.editId = '';
    document.getElementById('saveMedicationBtn').textContent = 'Save medication';
  } else {
    addEntry(payload);
  }

  clearMedicationForm();
  const card = document.getElementById('medicationFormCard'); if (card) card.classList.add('hidden');
  showToast('Medication saved.');
}

function saveNoteEntry() {
  const noteText = sanitizeText(document.getElementById('noteText').value, MAX_TEXT_LENGTH);
  if (!noteText.trim()) {
    showToast('Note cannot be empty.');
    return;
  }

  const payload = {
    type: 'note',
    note: noteText,
  };

  const editId = document.getElementById('saveNoteBtn').dataset.editId;
  if (editId) {
    updateEntry(editId, payload);
    document.getElementById('saveNoteBtn').dataset.editId = '';
    document.getElementById('saveNoteBtn').textContent = 'Save note';
  } else {
    addEntry(payload);
  }

  if (document.getElementById('noteText')) document.getElementById('noteText').value = '';
  const card = document.getElementById('noteFormCard'); if (card) card.classList.add('hidden');
  showToast('Note saved.');
}

function addEntry(entry) {
  const timestamp = new Date().toISOString();
  state.entries.unshift({
    id: generateId(),
    timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...entry,
  });
  persistEntries();
  renderAll();
}

function updateEntry(id, nextData) {
  state.entries = state.entries.map((entry) => {
    if (entry.id !== id) return entry;
    return {
      ...entry,
      ...nextData,
      updatedAt: new Date().toISOString(),
    };
  });
  persistEntries();
  renderAll();
}

function clearTodayEntries() {
  const today = getLocalDateString(new Date());
  const total = state.entries.filter((entry) => getLocalDateString(new Date(entry.timestamp)) === today).length;
  if (!total) {
    showToast('No entries for today to clear.');
    return;
  }
  if (!window.confirm('Delete all entries for today?')) return;
  state.entries = state.entries.filter((entry) => getLocalDateString(new Date(entry.timestamp)) !== today);
  persistEntries();
  renderAll();
  showToast('Today cleared.');
}

function persistEntries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
    if (els.saveStatus) els.saveStatus.textContent = 'Saved locally';
  } catch (error) {
    console.error('Storage error:', error);
    if (els.saveStatus) els.saveStatus.textContent = 'Storage unavailable';
    showToast('Storage is full or unavailable.');
  }
}

function renderTimelineItem(entry) {
  const type = entry.type || 'note';
  const timeLabel = formatDateTime(new Date(entry.timestamp));
  const badgeClass = type;
  const summary = renderEntrySummary(entry);
  const details = renderEntryDetails(entry);
  const audioBlock = entry.audioReference ? `<audio class="audio-player" controls src="${escapeHtml(entry.audioReference)}"></audio>` : '';
  const editDeleteButtons = `
    <div class="event-actions">
      <button class="secondary-action" type="button" data-edit-id="${entry.id}">Edit</button>
      <button class="secondary-action" type="button" data-delete-id="${entry.id}">Delete</button>
    </div>
  `;

  return `
    <article class="timeline-item">
      <div class="timeline-item-header">
        <div class="timeline-item-type">${capitalize(type)}</div>
        <span class="event-badge ${badgeClass}">${type === 'pain' ? 'Pain' : type === 'medication' ? 'Medication' : type === 'note' ? 'Note' : 'Voice'}</span>
      </div>
      <div class="timeline-meta">${timeLabel}</div>
      <div class="event-detail"><strong>${escapeHtml(summary)}</strong></div>
      ${details ? `<div class="event-detail">${details}</div>` : ''}
      ${audioBlock}
      ${editDeleteButtons}
    </article>
  `;
}

function renderEntrySummary(entry) {
  if (entry.type === 'pain') return `Pain ${entry.painLevel ?? 0}/10`;
  if (entry.type === 'medication') {
    const doseText = [entry.dose, entry.unit].filter(Boolean).join(' ');
    return entry.medicationName || 'Medication';
  }
  if (entry.type === 'voice') return 'Voice note';
  return 'Note';
}

function renderEntryDetails(entry) {
  if (entry.type === 'pain') {
    const pieces = [];
    if (entry.location) pieces.push(`Location: ${entry.location}`);
    if (entry.symptoms) pieces.push(`Symptoms: ${entry.symptoms}`);
    if (entry.trigger) pieces.push(`Trigger: ${entry.trigger}`);
    if (entry.note) pieces.push(`Note: ${entry.note}`);
    return pieces.join(' • ');
  }

  if (entry.type === 'medication') {
    const pieces = [];
    if (entry.medicationName) pieces.push(`Medication: ${entry.medicationName}`);
    if (entry.dose || entry.unit) pieces.push(`Dose: ${[entry.dose, entry.unit].filter(Boolean).join(' ')}`);
    if (entry.note) pieces.push(`Note: ${entry.note}`);
    return pieces.join(' • ');
  }

  if (entry.type === 'voice') {
    const note = entry.note ? `Note: ${entry.note}` : 'Voice recording';
    return note;
  }

  return entry.note || '';
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add('show');
  if (state.lastNoticeTimer) {
    clearTimeout(state.lastNoticeTimer);
  }
  state.lastNoticeTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
}

function useSpeechToText() {
  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionClass) {
    showToast('Speech recognition is not supported in this browser.');
    return;
  }

  const recognition = new SpeechRecognitionClass();
  state.recognition = recognition;
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ');
    const voiceNote = document.getElementById('voiceNoteText');
    if (voiceNote) {
      voiceNote.value = transcript.trim();
    }
    showToast('Speech converted to text.');
  };

  recognition.onerror = () => {
    showToast('Speech recognition failed. You can still type a note manually.');
  };

  recognition.onend = () => {
    state.recognition = null;
  };

  recognition.start();
  showToast('Listening for speech...');
}

async function toggleVoiceRecording() {
  const button = document.getElementById('recordVoiceBtn');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Microphone recording is unsupported in this browser.');
    return;
  }

  if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
    state.mediaRecorder.stop();
    if (button) button.textContent = 'Record audio';
    if (els.recordingStatus) els.recordingStatus.textContent = 'Recording stopped.';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.mediaStream = stream;
    const recorder = new MediaRecorder(stream);
    state.mediaRecorder = recorder;
    state.audioChunks = [];
    let recordingTimeout = null;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        state.audioChunks.push(event.data);
      }
    };

    recorder.onstop = async () => {
      if (recordingTimeout) clearTimeout(recordingTimeout);
      const blob = new Blob(state.audioChunks, { type: recorder.mimeType || 'audio/webm' });
      const dataUrl = await blobToDataUrl(blob);
      const noteText = sanitizeText(document.getElementById('voiceNoteText').value, MAX_TEXT_LENGTH);
      addEntry({
        type: 'voice',
        note: noteText || 'Voice recording',
        audioReference: dataUrl,
      });
      stream.getTracks().forEach((track) => track.stop());
      state.mediaRecorder = null;
      state.mediaStream = null;
      if (button) button.textContent = 'Record audio';
      if (els.recordingStatus) els.recordingStatus.textContent = 'Voice recording saved locally.';
      showToast('Voice recording saved.');
    };

    recorder.start();
    if (button) button.textContent = 'Stop recording';
    if (els.recordingStatus) els.recordingStatus.textContent = 'Recording in progress. Press again to stop.';

    // enforce max recording length
    recordingTimeout = setTimeout(() => {
      if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
        state.mediaRecorder.stop();
      }
    }, state.maxRecordingMs);
  } catch (error) {
    console.error('Microphone access error:', error);
    showToast('Microphone permission was denied or unavailable.');
    if (els.recordingStatus) els.recordingStatus.textContent = 'Microphone permission denied.';
  }
}

function handleImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || '');
      const parsed = JSON.parse(text);
      const entries = Array.isArray(parsed) ? parsed : Array.isArray(parsed.entries) ? parsed.entries : null;
      if (!entries) throw new Error('Import file does not contain a valid array of entries.');

      const cleaned = entries
        .map((entry) => normalizeImportedEntry(entry))
        .filter(Boolean);

      if (!cleaned.length) {
        throw new Error('No valid entries found in the imported file.');
      }

      const existingIds = new Set(state.entries.map((entry) => entry.id));
      const merged = [];
      cleaned.forEach((entry) => {
        if (existingIds.has(entry.id)) return;
        merged.push(entry);
        existingIds.add(entry.id);
      });

      state.entries = [...merged, ...state.entries];
      persistEntries();
      renderAll();
      showToast(`${merged.length} entries imported.`);
    } catch (error) {
      console.error('Import failed:', error);
      showToast('Import failed: invalid or malformed JSON file.');
    } finally {
      event.target.value = '';
    }
  };

  reader.onerror = () => {
    showToast('The selected file could not be read.');
    event.target.value = '';
  };

  reader.readAsText(file);
}

function exportJsonBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'Pain Log V2',
    version: 1,
    entries: state.entries,
  };
  downloadText('pain-log-v2-backup.json', JSON.stringify(payload, null, 2), 'application/json');
  showToast('JSON backup downloaded.');
}

function exportTextReport() {
  if (!state.entries.length) {
    showToast('No entries to export.');
    return;
  }
  const lines = state.entries
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map((entry) => {
      const stamp = formatDateTime(new Date(entry.timestamp));
      if (entry.type === 'pain') return `${stamp} | Pain ${entry.painLevel ?? 0}/10${entry.location ? ` | ${entry.location}` : ''}${entry.note ? ` | ${entry.note}` : ''}`;
      if (entry.type === 'medication') return `${stamp} | Medication: ${entry.medicationName || 'Unknown'}${entry.dose ? ` | Dose: ${entry.dose}` : ''}${entry.unit ? ` ${entry.unit}` : ''}${entry.note ? ` | ${entry.note}` : ''}`;
      if (entry.type === 'voice') return `${stamp} | Voice note${entry.note ? ` | ${entry.note}` : ''}`;
      return `${stamp} | Note: ${entry.note || ''}`;
    });
  downloadText('pain-log-v2-report.txt', lines.join('\n'), 'text/plain');
  showToast('Text report downloaded.');
}

function downloadText(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const tempAnchor = document.createElement('a');
  tempAnchor.href = url;
  tempAnchor.download = fileName;
  document.body.appendChild(tempAnchor);
  tempAnchor.click();
  tempAnchor.remove();
  URL.revokeObjectURL(url);
}

function normalizeImportedEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const timestamp = typeof entry.timestamp === 'string' && !Number.isNaN(Date.parse(entry.timestamp)) ? entry.timestamp : new Date().toISOString();
  const type = ['pain', 'medication', 'note', 'voice'].includes(entry.type) ? entry.type : 'note';
  const safeNote = sanitizeText(entry.note || '', MAX_TEXT_LENGTH);

  const normalized = {
    id: typeof entry.id === 'string' && entry.id.trim() ? entry.id : generateId(),
    timestamp,
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : timestamp,
    updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : timestamp,
    type,
  };

  if (type === 'pain') {
    const value = clampNumber(Number(entry.painLevel), 0, 10);
    normalized.painLevel = value;
    normalized.location = sanitizeText(entry.location || '', 200);
    normalized.symptoms = sanitizeText(entry.symptoms || '', 200);
    normalized.trigger = sanitizeText(entry.trigger || '', 200);
    normalized.note = safeNote;
    return normalized;
  }

  if (type === 'medication') {
    normalized.medicationName = sanitizeText(entry.medicationName || '', 200);
    normalized.dose = sanitizeText(entry.dose || '', 80);
    normalized.unit = sanitizeText(entry.unit || '', 50);
    normalized.note = safeNote;
    return normalized;
  }

  normalized.note = safeNote;
  normalized.audioReference = typeof entry.audioReference === 'string' ? entry.audioReference : '';
  return normalized;
}

function clearPainForm() {
  const pl = document.getElementById('painLevel'); if (pl) pl.value = '5';
  const plv = document.getElementById('painLevelValue'); if (plv) plv.textContent = '5';
  if (document.getElementById('painLocation')) document.getElementById('painLocation').value = '';
  if (document.getElementById('painSymptoms')) document.getElementById('painSymptoms').value = '';
  if (document.getElementById('painTrigger')) document.getElementById('painTrigger').value = '';
  if (document.getElementById('painNote')) document.getElementById('painNote').value = '';
}

function clearMedicationForm() {
  if (document.getElementById('medicationName')) document.getElementById('medicationName').value = '';
  if (document.getElementById('medicationDose')) document.getElementById('medicationDose').value = '';
  if (document.getElementById('medicationUnit')) document.getElementById('medicationUnit').value = '';
  if (document.getElementById('medicationNote')) document.getElementById('medicationNote').value = '';
}

function sanitizeText(value, maxLength) {
  const trimmed = String(value || '').trim();
  return trimmed.slice(0, maxLength || 1000);
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function generateId() {
  return `entry-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean).map((entry) => normalizeImportedEntry(entry)).filter(Boolean);
  } catch (error) {
    console.error('Failed to read stored entries:', error);
    return [];
  }
}

function persistEntries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
    if (els.saveStatus) els.saveStatus.textContent = 'Saved locally';
  } catch (error) {
    console.error('Storage error:', error);
    if (els.saveStatus) els.saveStatus.textContent = 'Storage unavailable';
    showToast('Storage is full or unavailable.');
  }
}

function getLocalDateString(date) {
  const local = new Date(date);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, '0');
  const day = String(local.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFriendlyDate(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function capitalize(value) {
  return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

