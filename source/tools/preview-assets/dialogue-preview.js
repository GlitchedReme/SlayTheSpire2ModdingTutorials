/* dialogue-preview.js
 * Editor + preview for ancient-encounter dialogue sets.
 * Depends on globalThis.SpireBBCode (preview-tools.js)
 * and globalThis.DialoguePreviewIcons (dialogue-icons.js).
 */
(function () {
  'use strict';

  const root = document.querySelector('[data-dialogue-preview-tool]');
  if (!root) return;

  const SpireBBCode = globalThis.SpireBBCode || {
    toHtml: (s) => String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    restartFx: () => {},
  };
  const ICONS = globalThis.DialoguePreviewIcons || {};

  // ---------- DOM ----------
  const $ = (id) => root.querySelector('#' + id);
  const dom = {
    ancientId: $('dpAncientId'),
    ancientName: $('dpAncientName'),
    ancientEpithet: $('dpAncientEpithet'),
    charSelect: $('dpCharSelect'),
    setPicker: $('dpSetPicker'),
    setFields: $('dpSetFields'),
    addSet: $('dpAddSet'),
    removeSet: $('dpRemoveSet'),
    addLine: $('dpAddLine'),
    sets: $('dpSets'),
    json: $('dpJson'),
    copyJson: $('dpCopyJson'),
    jsonOnlyCurrent: $('dpJsonOnlyCurrent'),
    previewStage: $('dpPreviewStage'),
    dialogueStack: $('dpDialogueStack'),
    nextHint: $('dpNextHint'),
    reset: $('dpReset'),
    visitCount: $('dpVisitCount'),
    progress: $('dpProgress'),
    toast: root.querySelector('#toast'),
    bannerTitle: $('dpBannerTitle'),
    bannerEpithet: $('dpBannerEpithet'),
    deleteAncient: $('dpDeleteAncient'),
    deleteChar: $('dpDeleteChar'),
  };

  // ---------- Constants ----------
  // Special pseudo-character keys (in real game these are first-encounter and unknown-character buckets)
  const FIRST_VISIT = 'firstVisitEver';
  const ANY_CHAR = 'ANY';

  function updateBanner() {
    if (dom.bannerTitle) dom.bannerTitle.textContent = state.ancientName || state.ancientId || '';
    if (dom.bannerEpithet) {
      dom.bannerEpithet.textContent = state.ancientEpithet || '';
      dom.bannerEpithet.style.display = state.ancientEpithet ? '' : 'none';
    }
  }

  // Map char ID -> icon set keys (from DialoguePreviewIcons)
  const CHAR_ICONS = {
    IRONCLAD: 'ironclad',
    SILENT: 'silent',
    DEFECT: 'defect',
    NECROBINDER: 'necrobinder',
    REGENT: 'regent',
  };
  const ANY_CHAR_ICON = 'any_character';
  function getAncientIcon(id) {
    const key = 'ancient_' + id.toLowerCase();
    if (ICONS[key]) return key;
    return 'ancient_tezcatara';
  }
  const ANCIENT_LABELS = {
    TEZCATARA: '特兹卡塔拉',
    DARV: '达弗',
    NEOW: '涅奥',
    NONUPEIPE: '诺奴佩普',
    OROBAS: '欧洛巴斯',
    PAEL: '佩尔',
    TANX: '坦克斯',
    THE_ARCHITECT: '建筑师',
    VAKUU: '瓦库',
  };

  // ---------- Custom ancient persistence (localStorage) ----------
  const CUSTOM_PREFIX = 'dp_cus_';
  function getCustomIds() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_PREFIX + 'ids') || '[]'); } catch(e) { return []; }
  }
  function saveCustomIds(ids) {
    localStorage.setItem(CUSTOM_PREFIX + 'ids', JSON.stringify(ids));
  }
  function saveCustomData(id, name, epithet, chars) {
    localStorage.setItem(CUSTOM_PREFIX + 'data_' + id, JSON.stringify({ name: name || '', epithet: epithet || '', chars: chars || {} }));
  }
  function loadCustomData(id) {
    try { return JSON.parse(localStorage.getItem(CUSTOM_PREFIX + 'data_' + id)); } catch(e) { return null; }
  }
  function deleteCustomData(id) {
    localStorage.removeItem(CUSTOM_PREFIX + 'data_' + id);
  }
  function isCustomAncient(id) {
    return getCustomIds().indexOf(id) !== -1;
  }
  function saveCurrentCustom() {
    if (!state.ancientId || !isCustomAncient(state.ancientId)) return;
    saveCustomData(state.ancientId, state.ancientName, state.ancientEpithet, state.chars);
  }

  // ---------- Parse full ancients dataset ----------
  let allData = null;
  try { if (globalThis.ALL_ANCIENTS_RAW) allData = JSON.parse(globalThis.ALL_ANCIENTS_RAW); }
  catch (e) { console.warn('Failed to parse ALL_ANCIENTS_RAW', e); }
  function getAllAncientIds() {
    if (!allData) return ['TEZCATARA'];
    const ids = new Set();
    Object.keys(allData).forEach((k) => {
      const p = k.split('.')[0];
      if (p && !p.includes('ERROR') && !p.includes('PROCEED')) ids.add(p);
    });
    return Array.from(ids).sort((a, b) => {
      const ai = ['TEZCATARA','DARV','NEOW','NONUPEIPE','OROBAS','PAEL','TANX','THE_ARCHITECT','VAKUU'];
      return ai.indexOf(a) - ai.indexOf(b);
    });
  }
  function filterAncientData(id) {
    if (!allData) return null;
    const out = {};
    Object.keys(allData).forEach((k) => {
      if (k === id || k.startsWith(id + '.')) out[k] = allData[k];
    });
    return out;
  }
  // ---------- Initial state ----------
  const state = {
    ancientId: 'TEZCATARA',
    ancientName: '特兹卡塔拉',
    ancientEpithet: '饲火者',
    activeChar: 'IRONCLAD',     // selected character
    editingSetIdx: 0,           // index into chars[activeChar] currently shown for editing
    visitCount: 0,              // player's visit count, drives pickActiveSet for preview
    cursor: 0,                  // visible-line counter for preview
    /** Map<charId, Set[]>; Set = { visitIndex:number, repeatable:boolean, lines: Line[] } */
    chars: {},
  };

  // Standard char order for tabs
  const STD_CHARS = ['IRONCLAD', 'SILENT', 'DEFECT', 'NECROBINDER', 'REGENT', ANY_CHAR, FIRST_VISIT];

  // ---------- Parse a flat JSON object into state.chars structure ----------
  // JSON key shape: <ancientId>.talk.<charId>.<dialogueIdx>-<lineIdx>[r].<ancient|char|next>
  // Optional baselib override: <ancientId>.talk.<charId>.<dialogueIdx>-visit -> custom visitIndex
  // dialogueIdx is the set's POSITION in the array; visitIndex is what visit count triggers it.
  // Vanilla default: visitIndex = autoVisitIndex(dialogueIdx), i.e. 0,1,4,7,10,...
  function importFromJson(obj) {
    state.chars = {};
    const meta = { title: null, epithet: null };
    const ancientIds = new Set();
    const talkRe = /^([^.]+)\.talk\.([^.]+)\.(\d+)-(\d+)(r?)\.(ancient|char|next)$/;
    const visitRe = /^([^.]+)\.talk\.([^.]+)\.(\d+)-visit$/;
    const visitOverrides = {}; // charId -> { dialogueIdx -> number }

    Object.keys(obj).forEach((k) => {
      const m = k.match(talkRe);
      if (m) {
        ancientIds.add(m[1]);
        const charId = m[2];
        const dialogueIdx = Number(m[3]);
        const lineIdx = Number(m[4]);
        const repeatable = m[5] === 'r';
        const role = m[6];
        const charSets = state.chars[charId] || (state.chars[charId] = []);
        let s = charSets.find((it) => it.dialogueIdx === dialogueIdx);
        if (!s) {
          s = { dialogueIdx: dialogueIdx, visitIndex: autoVisitIndex(dialogueIdx), repeatable: repeatable, lines: [] };
          charSets.push(s);
        } else if (repeatable) {
          s.repeatable = true;
        }
        const line = s.lines[lineIdx] || (s.lines[lineIdx] = { speaker: 'ancient', text: '', next: '' });
        if (role === 'ancient') { line.speaker = 'ancient'; line.text = String(obj[k]); }
        else if (role === 'char') { line.speaker = 'character'; line.text = String(obj[k]); }
        else if (role === 'next') { line.next = String(obj[k]); }
        return;
      }
      const vm = k.match(visitRe);
      if (vm) {
        ancientIds.add(vm[1]);
        const charId = vm[2];
        const dialogueIdx = Number(vm[3]);
        const v = parseInt(String(obj[k]), 10);
        if (!Number.isNaN(v)) {
          (visitOverrides[charId] || (visitOverrides[charId] = {}))[dialogueIdx] = v;
        }
        return;
      }
      const metaM = k.match(/^([^.]+)\.(title|epithet)$/);
      if (metaM) {
        ancientIds.add(metaM[1]);
        meta[metaM[2]] = { id: metaM[1], val: String(obj[k]) };
      }
    });

    // Pick a sensible ancientId
    let pickedId = null;
    if (ancientIds.size > 0) {
      pickedId = ancientIds.values().next().value;
      if (meta.title) pickedId = meta.title.id;
    }
    if (pickedId) state.ancientId = pickedId;
    state.ancientName = meta.title ? meta.title.val : '';
    state.ancientEpithet = meta.epithet ? meta.epithet.val : '';

    // Sort sets per char by dialogueIdx; apply visit overrides; collapse line holes.
    Object.keys(state.chars).forEach((c) => {
      state.chars[c].sort((a, b) => a.dialogueIdx - b.dialogueIdx);
      const ov = visitOverrides[c] || {};
      state.chars[c].forEach((s, i) => {
        // Re-derive dialogueIdx from final position so it stays canonical
        s.dialogueIdx = i;
        if (ov[i] != null) s.visitIndex = ov[i];
        s.lines = s.lines.filter((l) => l != null);
        if (s.lines.length === 0) s.lines.push({ speaker: 'ancient', text: '', next: '' });
      });
    });

    const order = STD_CHARS.filter((c) => state.chars[c]);
    if (order.length > 0 && !state.chars[state.activeChar]) state.activeChar = order[0];
    if (Object.keys(state.chars).length > 0 && !state.chars[state.activeChar]) {
      state.activeChar = Object.keys(state.chars)[0];
    }
  }

  // ---------- Export structured state back to a flat JSON object ----------
  function exportToJson(onlyCurrentChar) {
    const out = {};
    if (state.ancientName) out[state.ancientId + '.title'] = state.ancientName;
    if (state.ancientEpithet) out[state.ancientId + '.epithet'] = state.ancientEpithet;
    Object.keys(state.chars).forEach((charId) => {
      if (onlyCurrentChar && charId !== state.activeChar) return;
      state.chars[charId].forEach((s, i) => {
        const dIdx = i; // dialogueIdx is position
        const rTag = s.repeatable ? 'r' : '';
        s.lines.forEach((line, j) => {
          const baseKey = state.ancientId + '.talk.' + charId + '.' + dIdx + '-' + j + rTag;
          const speakerKey = line.speaker === 'character' ? 'char' : 'ancient';
          out[baseKey + '.' + speakerKey] = line.text || '';
          if (line.next) out[baseKey + '.next'] = line.next;
        });
        // Emit baselib visit override only when it differs from the auto default
        if (s.visitIndex !== autoVisitIndex(dIdx)) {
          out[state.ancientId + '.talk.' + charId + '.' + dIdx + '-visit'] = String(s.visitIndex);
        }
      });
    });
    return out;
  }

  // ---------- Visit-index lookup (mirrors in-game logic from 08-ancient-dialogue.md) ----------
  // Visit count -> set picked from this character's sets.
  // Rules:
  //   - If visit==0 AND globally first time: firstVisitEver. We don't track "global first" so we
  //     show firstVisitEver only when activeChar === firstVisitEver, which the user can pick manually.
  //   - Otherwise: pick the set whose visitIndex == count if any.
  //   - If none, fall back to highest repeatable set whose visitIndex <= count.
  //   - If still none (rare): null.
  // pickActiveSet:
  //   - firstVisitEver short-circuit.
  //   - Exact match: any set with visitIndex == count.
  //   - Otherwise: random pick from all repeatable sets whose visitIndex <= count.
  //   - If still none (rare): null.
  function pickActiveSet(charId, count) {
    if (charId === FIRST_VISIT) {
      const sets = state.chars[FIRST_VISIT] || [];
      return sets[0] || null;
    }
    const sets = (state.chars[charId] || []).slice().sort((a, b) => a.visitIndex - b.visitIndex);
    if (sets.length === 0) {
      // Fallback to ANY if char unknown
      if (charId !== ANY_CHAR && state.chars[ANY_CHAR]) {
        return pickActiveSet(ANY_CHAR, count);
      }
      return null;
    }
    const exact = sets.find((s) => s.visitIndex === count);
    if (exact) return exact;
    const candidates = sets.filter((s) => s.repeatable && s.visitIndex <= count);
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function toast(msg) {
    if (!dom.toast) return;
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 1600);
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ---------- Render: char tabs ----------
  function renderCharSelect() {
    const present = new Set(Object.keys(state.chars));
    const ordered = STD_CHARS.filter((c) => present.has(c)).concat(
      Array.from(present).filter((c) => !STD_CHARS.includes(c))
    );
    if (!ordered.includes(state.activeChar)) {
      state.activeChar = ordered[0] || 'IRONCLAD';
    }
    const opts = ordered.map((c) => {
      const label = c === FIRST_VISIT ? '首次相遇'
                  : c === ANY_CHAR    ? '任意角色'
                  : c;
      const count = (state.chars[c] || []).length;
      return '<option value="' + escapeHtml(c) + '"'
        + (c === state.activeChar ? ' selected' : '') + '>'
        + escapeHtml(label) + ' · ' + count + ' 套</option>';
    });
    opts.push('<option value="__add__">＋ 添加新角色…</option>');
    dom.charSelect.innerHTML = opts.join('');
    if (dom.deleteChar) {
      const c = state.activeChar;
      dom.deleteChar.style.display = c && !STD_CHARS.includes(c) ? '' : 'none';
    }
  }

  function addNewChar() {
    const name = prompt('新角色 ID（大写，例如 WATCHER）：');
    if (!name) {
      renderCharSelect(); // restore select to current active
      return;
    }
    const id = String(name).trim().toUpperCase();
    if (!id) { renderCharSelect(); return; }
    if (state.chars[id]) { toast('已存在: ' + id); renderCharSelect(); return; }
    state.chars[id] = [{ visitIndex: 0, repeatable: false, lines: [{ speaker: 'ancient', text: '', next: '' }] }];
    state.activeChar = id;
    state.editingSetIdx = 0;
    renderAll();
    schedulePreview();
  }

  dom.charSelect.addEventListener('change', () => {
    const v = dom.charSelect.value;
    if (v === '__add__') { addNewChar(); return; }
    state.activeChar = v;
    state.editingSetIdx = 0;
    renderCharSelect();
    renderSets();
    renderPreview(true);
    jsonFromVisual();
  });


  // ---------- Render: set picker + currently-edited set's lines ----------
  // Auto-numbering rule used ONLY when the user adds a brand-new set:
  //   set #0 -> VisitIndex 0, set #1 -> 1, set #i (i>=2) -> 3i-2.
  //   So sets land at 0, 1, 4, 7, 10, ... mirroring the standard ancients pattern.
  // We never rewrite a set's visitIndex / repeatable that was loaded from JSON.
  function autoVisitIndex(i) { return i < 2 ? i : 3 * i - 2; }

  function setLabel(s, sIdx, total) {
    return '第 ' + (sIdx + 1) + ' 套 · 第 ' + s.visitIndex + ' 次访问' + (s.repeatable ? ' · 可重复' : '');
  }

  function renderSetPickerOnly() {
    const charId = state.activeChar;
    const sets = state.chars[charId] || [];
    const isFirstVisit = charId === FIRST_VISIT;
    if (sets.length === 0) {
      dom.setPicker.innerHTML = '<option value="-1">无对话集</option>';
    } else if (isFirstVisit) {
      dom.setPicker.innerHTML = '<option value="0" selected>首次相遇</option>';
    } else {
      dom.setPicker.innerHTML = sets.map(function (s, i) {
        return '<option value="' + i + '"' + (i === state.editingSetIdx ? ' selected' : '') + '>'
          + escapeHtml(setLabel(s, i, sets.length)) + '</option>';
      }).join('');
    }
  }

  function renderSets() {
    const charId = state.activeChar;
    const sets = state.chars[charId] || (state.chars[charId] = []);
    const isFirstVisit = charId === FIRST_VISIT;
    if (state.editingSetIdx >= sets.length) state.editingSetIdx = Math.max(0, sets.length - 1);
    if (state.editingSetIdx < 0) state.editingSetIdx = 0;

    // Picker dropdown
    if (sets.length === 0) {
      dom.setPicker.innerHTML = '<option value="-1">无对话集</option>';
    } else if (isFirstVisit) {
      dom.setPicker.innerHTML = '<option value="0" selected>首次相遇</option>';
    } else {
      dom.setPicker.innerHTML = sets.map(function (s, i) {
        return '<option value="' + i + '"' + (i === state.editingSetIdx ? ' selected' : '') + '>'
          + escapeHtml(setLabel(s, i, sets.length)) + '</option>';
      }).join('');
    }

    const cur = sets[state.editingSetIdx];

    // Visit-index + repeatable controls for the currently picked set
    if (cur && !isFirstVisit) {
      dom.setFields.innerHTML =
        '<label class="dp-meta-cell">' +
          '<span>访问次数</span>' +
          '<input type="number" data-field="visitIndex" min="0" step="1" value="' + cur.visitIndex + '">' +
        '</label>' +
        '<label class="dp-meta-cell dp-meta-checkbox">' +
          '<input type="checkbox" data-field="repeatable"' + (cur.repeatable ? ' checked' : '') + '>' +
          '<span>可重复 (r)</span>' +
        '</label>';
    } else if (cur && isFirstVisit) {
      dom.setFields.innerHTML = '<span class="dp-set-fields-note">首次相遇专用，无访问次数</span>';
    } else {
      dom.setFields.innerHTML = '';
    }

    // Lines list of the picked set only
    dom.sets.innerHTML = '';
    if (!cur) return;
    cur.lines.forEach(function (line, lIdx) {
      const row = document.createElement('div');
      row.className = 'dp-line-row dp-speaker-' + (line.speaker === 'character' ? 'char' : 'ancient');
      row.dataset.lineIdx = String(lIdx);
      const optA = '<option value="ancient"' + (line.speaker === 'ancient' ? ' selected' : '') + '>先古</option>';
      const optC = '<option value="character"' + (line.speaker === 'character' ? ' selected' : '') + '>角色</option>';
      row.innerHTML =
        '<div class="dp-line-speaker">' +
          '<select data-field="speaker">' + optA + optC + '</select>' +
          '<span class="dp-line-idx">#' + lIdx + '</span>' +
        '</div>' +
        '<div class="dp-line-text">' +
          '<textarea data-field="text" rows="2" spellcheck="false">' + escapeHtml(line.text) + '</textarea>' +
          '<input type="text" class="dp-line-next-input" data-field="next" placeholder="按钮文字" value="' + escapeHtml(line.next || '') + '">' +
        '</div>' +
        '<div class="dp-line-actions">' +
          '<button type="button" data-action="lineUp" title="上移">▲</button>' +
          '<button type="button" data-action="lineDown" title="下移">▼</button>' +
          '<button type="button" class="dp-line-remove" data-action="lineRemove" title="删除">✕</button>' +
        '</div>';
      dom.sets.appendChild(row);
    });
  }

  // Set picker dropdown change
  dom.setPicker.addEventListener('change', function () {
    const v = parseInt(dom.setPicker.value, 10);
    if (Number.isFinite(v) && v >= 0) {
      state.editingSetIdx = v;
      renderSets();
    }
  });

  // Player visit count: drives pickActiveSet for the preview
  dom.visitCount.addEventListener('input', function () {
    state.visitCount = Math.max(0, parseInt(dom.visitCount.value, 10) || 0);
    renderPreview(true);
  });

  // Per-set visitIndex / repeatable edits
  dom.setFields.addEventListener('input', function (e) {
    const t = e.target;
    const sets = state.chars[state.activeChar] || [];
    const cur = sets[state.editingSetIdx];
    if (!cur) return;
    const field = t.dataset.field;
    if (field === 'visitIndex') cur.visitIndex = Math.max(0, parseInt(t.value, 10) || 0);
    else if (field === 'repeatable') cur.repeatable = t.checked;
    schedulePreview();
    // Refresh dropdown label to reflect new visitIndex / repeatable, but keep this field's focus.
    const focused = document.activeElement;
    renderSetPickerOnly();
    if (focused && focused.dataset && focused.dataset.field) focused.focus();
  });

  // Lines: input edits + button actions
  dom.sets.addEventListener('input', function (e) {
    const t = e.target;
    const lineRow = t.closest('.dp-line-row');
    if (!lineRow) return;
    const lIdx = Number(lineRow.dataset.lineIdx);
    const field = t.dataset.field;
    const sets = state.chars[state.activeChar] || [];
    const cur = sets[state.editingSetIdx];
    if (!cur || !cur.lines[lIdx] || !field) return;
    cur.lines[lIdx][field] = t.value;
    if (field === 'speaker') {
      lineRow.classList.remove('dp-speaker-ancient', 'dp-speaker-char');
      lineRow.classList.add('dp-speaker-' + (t.value === 'character' ? 'char' : 'ancient'));
    }
    schedulePreview();
  });

  dom.sets.addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const sets = state.chars[state.activeChar] || [];
    const cur = sets[state.editingSetIdx];
    if (!cur) return;
    const lineRow = btn.closest('.dp-line-row');
    if (!lineRow) return;
    const lIdx = Number(lineRow.dataset.lineIdx);
    const action = btn.dataset.action;
    if (action === 'lineRemove') {
      cur.lines.splice(lIdx, 1);
      if (cur.lines.length === 0) cur.lines.push({ speaker: 'ancient', text: '', next: '' });
    } else if (action === 'lineUp' && lIdx > 0) {
      const tmp = cur.lines[lIdx - 1]; cur.lines[lIdx - 1] = cur.lines[lIdx]; cur.lines[lIdx] = tmp;
    } else if (action === 'lineDown' && lIdx < cur.lines.length - 1) {
      const tmp = cur.lines[lIdx + 1]; cur.lines[lIdx + 1] = cur.lines[lIdx]; cur.lines[lIdx] = tmp;
    } else { return; }
    renderSets();
    schedulePreview();
  });

  // Add a new line to the currently-picked set
  dom.addLine.addEventListener('click', function () {
    const sets = state.chars[state.activeChar] || (state.chars[state.activeChar] = []);
    const cur = sets[state.editingSetIdx];
    if (!cur) return;
    const last = cur.lines[cur.lines.length - 1];
    cur.lines.push({
      speaker: last && last.speaker === 'ancient' ? 'character' : 'ancient',
      text: '', next: '',
    });
    renderSets();
    schedulePreview();
  });

  // Remove the currently-picked set
  dom.removeSet.addEventListener('click', function () {
    const sets = state.chars[state.activeChar] || [];
    if (sets.length === 0) return;
    sets.splice(state.editingSetIdx, 1);
    if (state.editingSetIdx >= sets.length) state.editingSetIdx = Math.max(0, sets.length - 1);
    renderCharSelect();
    renderSets();
    schedulePreview();
  });

  dom.addSet.addEventListener('click', function () {
    const sets = state.chars[state.activeChar] || (state.chars[state.activeChar] = []);
    const nextVisit = autoVisitIndex(sets.length);
    sets.push({ visitIndex: nextVisit, repeatable: false, lines: [{ speaker: 'ancient', text: '', next: '' }] });
    state.editingSetIdx = sets.length - 1;
    renderCharSelect();
    renderSets();
    schedulePreview();
  });


  // ---------- Ancient select ----------
  function renderAncientSelect() {
    const builtinIds = getAllAncientIds();
    const customIds = getCustomIds();
    const parts = [];
    builtinIds.forEach((id) => {
      parts.push('<option value="' + escapeHtml(id) + '"'
        + (id === state.ancientId ? ' selected' : '') + '>'
        + escapeHtml(ANCIENT_LABELS[id] || id) + '</option>');
    });
    if (customIds.length > 0) {
      parts.push('<option disabled>── 自定义 ──</option>');
      customIds.forEach((id) => {
        const raw = loadCustomData(id);
        const label = (raw && raw.name) || id;
        parts.push('<option value="' + escapeHtml(id) + '"'
          + (id === state.ancientId ? ' selected' : '') + '>'
          + escapeHtml(label) + '</option>');
      });
    }
    parts.push('<option value="__add__">+ 新建先古之民</option>');
    dom.ancientId.innerHTML = parts.join('');
    if (dom.deleteAncient) {
      dom.deleteAncient.style.display = state.ancientId && isCustomAncient(state.ancientId) ? '' : 'none';
    }
  }

  function loadAncient(id) {
    if (id === state.ancientId && Object.keys(state.chars).length > 0) return;
    saveCurrentCustom();
    if (isCustomAncient(id)) {
      const raw = loadCustomData(id);
      if (!raw) { toast('自定义先古之民数据丢失: ' + id); return; }
      state.ancientId = id;
      state.ancientName = raw.name || '';
      state.ancientEpithet = raw.epithet || '';
      state.chars = raw.chars || {};
      if (Object.keys(state.chars).length > 0) {
        const order = STD_CHARS.filter((c) => state.chars[c]);
        state.activeChar = order[0] || 'IRONCLAD';
      } else {
        state.activeChar = 'IRONCLAD';
      }
      state.editingSetIdx = 0;
      state.visitCount = 0;
      state.cursor = 0;
      dom.ancientName.value = state.ancientName;
      dom.ancientEpithet.value = state.ancientEpithet;
      dom.visitCount.value = '0';
      updateBanner();
      renderAncientSelect();
      renderCharSelect();
      renderSets();
      renderPreview(true);
      jsonFromVisual();
      return;
    }
    const filtered = filterAncientData(id);
    if (!filtered || Object.keys(filtered).length === 0) {
      toast('未找到先古之民数据: ' + id);
      renderAncientSelect();
      return;
    }
    importFromJson(filtered);
    state.ancientId = id;
    dom.ancientName.value = state.ancientName || '';
    dom.ancientEpithet.value = state.ancientEpithet || '';
    updateBanner();
    renderAncientSelect();
    renderCharSelect();
    renderSets();
    state.cursor = 0;
    dom.visitCount.value = String(state.visitCount);
    renderPreview(true);
    jsonFromVisual();
  }

  dom.ancientId.addEventListener('change', () => {
    const val = dom.ancientId.value;
    if (val === '__add__') {
      const idInput = prompt('新先古之民 ID（大写，例如 MY_ANCIENT）：');
      if (!idInput) { renderAncientSelect(); return; }
      const newId = String(idInput).trim().toUpperCase();
      if (!newId) { renderAncientSelect(); return; }
      if (ANCIENT_LABELS[newId] || isCustomAncient(newId)) {
        toast('已存在: ' + newId);
        renderAncientSelect();
        return;
      }
      const nameInput = prompt('显示名称（例如 我的先古之民）：');
      const newName = nameInput ? String(nameInput).trim() : newId;
      const ids = getCustomIds();
      ids.push(newId);
      saveCustomIds(ids);
      const defaultChars = {};
      STD_CHARS.forEach((c) => {
        defaultChars[c] = [{ visitIndex: 0, repeatable: false, lines: [{ speaker: 'ancient', text: '', next: '' }] }];
      });
      saveCustomData(newId, newName, '', defaultChars);
      loadAncient(newId);
      return;
    }
    loadAncient(val);
  });

  // Delete custom ancient
  dom.deleteAncient.addEventListener('click', () => {
    if (!state.ancientId || !isCustomAncient(state.ancientId)) return;
    if (!confirm('删除自定义先古之民 "' + (state.ancientName || state.ancientId) + '"？不可撤销。')) return;
    const ids = getCustomIds().filter((id) => id !== state.ancientId);
    saveCustomIds(ids);
    deleteCustomData(state.ancientId);
    const firstId = getAllAncientIds()[0] || 'TEZCATARA';
    loadAncient(firstId);
  });

  // Delete custom character
  dom.deleteChar.addEventListener('click', () => {
    const c = state.activeChar;
    if (!c || STD_CHARS.includes(c)) return;
    if (!confirm('删除角色 "' + c + '" 及其所有对话集？不可撤销。')) return;
    delete state.chars[c];
    state.editingSetIdx = 0;
    const remaining = Object.keys(state.chars);
    state.activeChar = remaining.length > 0
      ? (STD_CHARS.filter((id) => remaining.includes(id))[0] || remaining[0]) : 'IRONCLAD';
    renderCharSelect();
    renderSets();
    schedulePreview();
  });

  // ---------- Meta inputs ----------
  ['ancientName','ancientEpithet'].forEach((k) => {
    const el = dom[k];
    if (!el) return;
    el.addEventListener('input', () => {
      if (k === 'ancientName') state.ancientName = el.value;
      else if (k === 'ancientEpithet') state.ancientEpithet = el.value;
      updateBanner();
      schedulePreview();
    });
  });

  // ---------- JSON sync (live, two-way) ----------
  // We use focus to decide direction: when JSON textarea is focused, parse JSON -> visual;
  // when anything else has focus, write visual -> JSON. Avoids overwriting whatever the user is typing.

  function jsonFromVisual() {
    if (document.activeElement === dom.json) return;
    const onlyCurrent = dom.jsonOnlyCurrent && dom.jsonOnlyCurrent.checked;
    dom.json.value = JSON.stringify(exportToJson(onlyCurrent), null, 2);
  }

  function visualFromJson(silent) {
    let parsed;
    try { parsed = JSON.parse(dom.json.value || '{}'); }
    catch (err) { if (!silent) toast('JSON 解析失败: ' + err.message); return false; }
    if (!parsed || typeof parsed !== 'object') { if (!silent) toast('JSON 必须是对象'); return false; }
    importFromJson(parsed);
    renderAncientSelect();
    dom.ancientName.value = state.ancientName || '';
    dom.ancientEpithet.value = state.ancientEpithet || '';
    renderAll();
    state.cursor = 0;
    renderPreview(true);
    return true;
  }

  let jsonInputTimer = null;
  dom.json.addEventListener('input', () => {
    clearTimeout(jsonInputTimer);
    jsonInputTimer = setTimeout(() => visualFromJson(true), 300);
  });

  dom.copyJson.addEventListener('click', async () => {
    if (!dom.json.value) jsonFromVisual();
    try {
      await navigator.clipboard.writeText(dom.json.value);
      toast('JSON 已复制');
    } catch (e) {
      dom.json.select();
      try { document.execCommand && document.execCommand('copy'); } catch (e2) {}
      toast('已复制（兼容模式）');
    }
  });

  if (dom.jsonOnlyCurrent) {
    dom.jsonOnlyCurrent.addEventListener('change', () => { jsonFromVisual(); });
  }

  // ---------- SVG sprites ----------
  // Bubble corner radius and tail point recreate dialogue_nine_patch + dialogue_tail.
  function tailSvg() {
    // 22x40 viewBox; tail tip at left, base at right (joins bubble)
    return '<svg viewBox="0 0 22 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M22 4 L4 18 L1 19 Q0 19.5 1 20 L4 21 L22 35 Z" fill="currentColor" />' +
    '</svg>';
  }

  function iconHtml(side, kind) {
    const key = kind === 'ancient' ? getAncientIcon(state.ancientId) : (CHAR_ICONS[kind] || ANY_CHAR_ICON);
    const src = ICONS[key] || '';
    if (!src) return '';
    return '<div class="dp-icon dp-icon-' + side + '">' +
      '<img src="' + src + '" alt="">' +
    '</div>';
  }

  function lineHtml(line, charIdForCharSpeaker) {
    const speaker = line.speaker === 'character' ? 'character' : 'ancient';
    const bbHtml = SpireBBCode.toHtml(line.text || '');
    const charKind = (charIdForCharSpeaker === ANY_CHAR || charIdForCharSpeaker === FIRST_VISIT)
      ? 'any' : charIdForCharSpeaker;
    const leftIcon = iconHtml('left', 'ancient');
    const rightIcon = iconHtml('right', charKind);
    const tailL = '<div class="dp-tail dp-tail-left" style="color:var(--dp-bubble-fill);">' + tailSvg() + '</div>';
    const tailR = '<div class="dp-tail dp-tail-right" style="color:var(--dp-bubble-fill);">' + tailSvg() + '</div>';
    const bubble = '<div class="dp-bubble"><div class="dp-bubble-text">' + bbHtml + '</div></div>';
    return '<div class="dp-line dp-speaker-' + speaker + '">' +
      leftIcon +
      '<div class="dp-bubble-wrap">' + tailL + bubble + tailR + '</div>' +
      rightIcon +
    '</div>';
  }

  // ---------- Preview ----------
  // We cache the currently-shown set so random repeatable picks stay stable
  // while the user clicks through lines. Re-pick only on reset / visit-count change.
  let activePreviewSet = null;

  function pickPreviewSet() {
    activePreviewSet = pickActiveSet(state.activeChar, state.visitCount);
    return activePreviewSet;
  }

  function renderPreview(resetCursor) {
    const charId = state.activeChar;
    const set = resetCursor ? pickPreviewSet() : (activePreviewSet || pickPreviewSet());
    const lines = (set && set.lines) || [];
    const total = lines.length;
    if (resetCursor || state.cursor < 0 || state.cursor > total) {
      state.cursor = total > 0 ? 1 : 0;
    }
    if (state.cursor < 1 && total > 0) state.cursor = 1;

    const visible = lines.slice(0, state.cursor);
    const charIdForCharSpeaker = (charId === FIRST_VISIT) ? 'IRONCLAD' : charId;
    const parts = visible.map((l) => lineHtml(l, charIdForCharSpeaker));
    if (state.cursor > 0 && state.cursor < total) {
      const last = lines[state.cursor - 1];
      if (last && last.next) parts.push('<div class="dp-next-btn">' + escapeHtml(last.next) + ' ▶</div>');
    }
    if (parts.length === 0) {
      parts.push('<div class="dp-empty-hint">这套对话为空</div>');
    }
    dom.dialogueStack.innerHTML = parts.join('');
    dom.progress.textContent = '第 ' + state.cursor + ' / ' + total + ' 行';
    dom.nextHint.hidden = state.cursor >= total;
    if (typeof SpireBBCode.restartFx === 'function') SpireBBCode.restartFx(dom.dialogueStack);
    requestAnimationFrame(() => { dom.previewStage.scrollTop = dom.previewStage.scrollHeight; });
  }

  dom.previewStage.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    const set = activePreviewSet || pickPreviewSet();
    const total = (set && set.lines.length) || 0;
    if (state.cursor < total) state.cursor += 1; else return;
    renderPreview(false);
  });

  dom.reset.addEventListener('click', (e) => {
    e.stopPropagation();
    renderPreview(true);
  });

  // ---------- Render orchestration ----------
  function renderAll() {
    renderCharSelect();
    renderSets();
  }

  let scheduleTimer = null;
  function schedulePreview() {
    clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(() => {
      renderPreview(false);
      jsonFromVisual();
      saveCurrentCustom();
    }, 80);
  }

  // ---------- Init ----------
  const ids = getAllAncientIds();
  const firstId = ids[0] || 'TEZCATARA';
  const firstData = filterAncientData(firstId);
  if (firstData) importFromJson(firstData);
  state.ancientId = firstId;
  updateBanner();
  renderAncientSelect();
  dom.ancientName.value = state.ancientName || '';
  dom.ancientEpithet.value = state.ancientEpithet || '';
  dom.visitCount.value = String(state.visitCount);
  renderAll();
  renderPreview(true);
  jsonFromVisual();
})();