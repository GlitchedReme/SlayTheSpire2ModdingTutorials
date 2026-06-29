---
title: ID Generator
date: 2026-05-22 12:20:00
permalink: en/tools/id-generator/
comments: false
reprinted: true
hide_meta: true
---

<div class="entry-id-tool" data-entry-id-tool>
<section class="entry-id-tool__panel">
<div class="entry-id-tool__panel-title">Input</div>
<div class="entry-id-tool__form">
<label class="entry-id-tool__field">
<span>Library</span>
<select id="entryIdLibrary">
<option value="baselib">BaseLib</option>
<option value="ritsulib">RitsuLib</option>
</select>
</label>
<div class="entry-id-tool__fields" id="entryIdBaseLibFields">
<label class="entry-id-tool__field">
<span>Namespace</span>
<input id="entryIdNamespace" value="Test.Scripts" spellcheck="false">
</label>
</div>
<div class="entry-id-tool__fields is-hidden" id="entryIdRitsuLibFields">
<label class="entry-id-tool__field">
<span>Mod ID</span>
<input id="entryIdModId" value="Test" spellcheck="false">
</label>
<label class="entry-id-tool__field">
<span>Category</span>
<select id="entryIdModelType"></select>
</label>
</div>
</div>
</section>
<section class="entry-id-tool__panel entry-id-tool__panel--split">
<div class="entry-id-tool__split">
<div class="entry-id-tool__split-pane">
<div class="entry-id-tool__panel-title entry-id-tool__panel-title--with-action">
<span>Names (one per line)</span>
<span class="entry-id-tool__help" tabindex="0" aria-label="Import Help">
<span class="entry-id-tool__help-mark">?</span>
<span class="entry-id-tool__help-tip" role="tooltip">Recursively reads .cs filenames from the selected folder and subfolders (auto-skips .uid/.import metadata). All processing is local, nothing is uploaded.</span>
</span>
<button class="entry-id-tool__copy" id="entryIdImport" type="button">Import Folder</button>
<input type="file" id="entryIdImportInput" webkitdirectory directory multiple hidden>
</div>
<textarea id="entryIdNames" class="entry-id-tool__names" spellcheck="false" placeholder="MyCoolCard&#10;AnotherCard&#10;ThirdCard">MyCoolCard</textarea>
</div>
<div class="entry-id-tool__split-pane">
<div class="entry-id-tool__panel-title entry-id-tool__panel-title--with-action">
<span>Output JSON</span>
<button class="entry-id-tool__copy" id="entryIdCopy" type="button">Copy</button>
</div>
<div id="entryIdError" class="entry-id-tool__error"></div>
<pre id="entryIdFinal" class="entry-id-tool__code"></pre>
</div>
</div>
</section>
</div>

<style>
  .entry-id-tool {
    --entry-panel: rgba(21, 27, 35, 0.86);
    --entry-panel-2: rgba(32, 38, 46, 0.92);
    --entry-border: rgba(255, 255, 255, 0.12);
    --entry-text: #e8edf2;
    --entry-muted: #aeb9c9;
    --entry-accent: #d97519;
    --entry-danger: #ff9b9b;
    display: grid;
    gap: 18px;
    width: 100%;
    max-width: none;
    overflow: visible;
  }

  body:has([data-entry-id-tool]) .kira-content {
    overflow: hidden !important;
  }

  @media (min-width: 1001px) {
    body:has([data-entry-id-tool]) .kira-main-content {
      height: 100% !important;
      min-height: 0 !important;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    body:has([data-entry-id-tool]) .kira-post,
    body:has([data-entry-id-tool]) .kira-post article {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    body:has([data-entry-id-tool]) .entry-id-tool {
      flex: 1 1 auto;
      min-height: 0;
      grid-template-rows: auto minmax(0, 1fr);
    }

    body:has([data-entry-id-tool]) .entry-id-tool__panel:last-child {
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    body:has([data-entry-id-tool]) .entry-id-tool__result {
      flex: 1 1 auto;
      min-height: 0;
      grid-template-rows: auto minmax(0, 1fr);
    }

    body:has([data-entry-id-tool]) .entry-id-tool__output {
      align-content: start;
    }
  }

  .entry-id-tool *,
  .entry-id-tool *::before,
  .entry-id-tool *::after {
    box-sizing: border-box;
  }

  .entry-id-tool__panel {
    min-width: 0;
    border: 1px solid var(--entry-border);
    border-radius: 8px;
    background: var(--entry-panel);
    overflow: visible;
  }

  .entry-id-tool__panel-title {
    padding: 16px 18px 0;
    color: var(--entry-text);
    font-weight: 700;
    font-size: 1rem;
  }

  .entry-id-tool__form,
  .entry-id-tool__fields,
  .entry-id-tool__result {
    display: grid;
    gap: 14px;
    padding: 18px;
  }

  .entry-id-tool__fields {
    grid-template-columns: minmax(0, 1fr);
    padding: 0;
  }

  #entryIdRitsuLibFields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .entry-id-tool__panel--split {
    padding: 0;
  }

  .entry-id-tool__split {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0;
    min-height: 360px;
    height: 100%;
  }

  .entry-id-tool__split-pane {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }

  .entry-id-tool__split-pane + .entry-id-tool__split-pane {
    border-left: 1px solid var(--entry-border);
  }

  .entry-id-tool__panel-title--with-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .entry-id-tool__panel-title--with-action > span:first-child {
    margin-right: auto;
  }

  .entry-id-tool__help {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    cursor: help;
  }

  .entry-id-tool__help-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1px solid var(--entry-border);
    color: var(--entry-muted);
    font-size: 0.72rem;
    font-weight: 700;
    user-select: none;
  }

  .entry-id-tool__help:hover .entry-id-tool__help-mark,
  .entry-id-tool__help:focus-within .entry-id-tool__help-mark {
    border-color: rgba(217, 117, 25, 0.78);
    color: var(--entry-text);
  }

  .entry-id-tool__help-tip {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 20;
    width: max-content;
    max-width: 280px;
    padding: 8px 10px;
    border: 1px solid var(--entry-border);
    border-radius: 6px;
    background: rgba(12, 16, 22, 0.96);
    color: var(--entry-text);
    font-size: 0.78rem;
    font-weight: 400;
    line-height: 1.45;
    letter-spacing: 0;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    white-space: normal;
    text-align: left;
  }

  .entry-id-tool__help:hover .entry-id-tool__help-tip,
  .entry-id-tool__help:focus-within .entry-id-tool__help-tip {
    opacity: 1;
    visibility: visible;
  }

  .entry-id-tool__names {
    flex: 1 1 auto;
    margin: 0 18px 18px;
    min-height: 220px;
    resize: none;
    border: 1px solid var(--entry-border);
    border-radius: 6px;
    background: rgba(12, 16, 22, 0.45);
    color: var(--entry-text);
    padding: 10px 12px;
    outline: none;
    font: 0.95rem/1.5 "Cascadia Mono", "Consolas", monospace;
    letter-spacing: 0;
  }

  .entry-id-tool__names:focus {
    border-color: rgba(217, 117, 25, 0.72);
  }

  .entry-id-tool__field {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .entry-id-tool__field span,
  .entry-id-tool__output span {
    color: var(--entry-muted);
    font-size: 0.84rem;
  }

  .entry-id-tool input,
  .entry-id-tool select {
    display: block;
    width: 100%;
    min-width: 100%;
    min-height: 40px;
    border: 1px solid var(--entry-border);
    border-radius: 6px;
    background: rgba(12, 16, 22, 0.45);
    color: var(--entry-text);
    padding: 8px 10px;
    outline: none;
    font: inherit;
    letter-spacing: 0;
  }

  .entry-id-tool input:focus,
  .entry-id-tool select:focus {
    border-color: rgba(217, 117, 25, 0.72);
  }

  .entry-id-tool option {
    width: 100%;
    min-width: 100%;
    background: #151b23;
    color: var(--entry-text);
  }

  .entry-id-tool__copy {
    min-height: 30px;
    border: 1px solid var(--entry-border);
    border-radius: 6px;
    background: rgba(12, 16, 22, 0.45);
    color: var(--entry-text);
    cursor: pointer;
    font: inherit;
    font-size: 0.84rem;
    letter-spacing: 0;
    padding: 0 12px;
    transition: background-color 0.18s ease, border-color 0.18s ease;
  }

  .entry-id-tool__copy:hover {
    border-color: rgba(217, 117, 25, 0.78);
    background: rgba(187, 101, 22, 0.24);
  }

  .entry-id-tool__error {
    margin: 0 18px;
    color: var(--entry-danger);
    font-weight: 700;
    min-height: 0;
  }

  .entry-id-tool__error:empty {
    display: none;
  }

  .entry-id-tool__code {
    flex: 1 1 auto;
    margin: 8px 18px 18px;
    padding: 12px 14px;
    border-radius: 8px;
    background: var(--entry-panel-2);
    color: var(--entry-text);
    font-family: "Cascadia Mono", "Consolas", monospace;
    font-size: 0.92rem;
    line-height: 1.5;
    white-space: pre;
    overflow: auto;
    min-height: 200px;
    max-width: 100%;
    box-sizing: border-box;
  }

  .entry-id-tool__code .json-key { color: #9cdcfe; }
  .entry-id-tool__code .json-string { color: #ce9178; }
  .entry-id-tool__code .json-number { color: #b5cea8; }
  .entry-id-tool__code .json-bool { color: #569cd6; }
  .entry-id-tool__code .json-null { color: #569cd6; font-style: italic; }
  .entry-id-tool__code .json-punct { color: #d4d4d4; }

  .entry-id-tool__panel--split .entry-id-tool__panel-title {
    padding: 14px 18px 8px;
  }

  .entry-id-tool .is-hidden {
    display: none;
  }

  @media (max-width: 900px) {
    #entryIdRitsuLibFields {
      grid-template-columns: 1fr;
    }

    .entry-id-tool__split {
      grid-template-columns: 1fr;
    }

    .entry-id-tool__split-pane + .entry-id-tool__split-pane {
      border-left: none;
      border-top: 1px solid var(--entry-border);
    }
  }
</style>

<script src="/tools/id-generator/id-generator.js"></script>
<script>
  (function () {
    const api = globalThis.RitsuLibEntryId;
    const library = document.getElementById("entryIdLibrary");
    const baseLibFields = document.getElementById("entryIdBaseLibFields");
    const ritsuLibFields = document.getElementById("entryIdRitsuLibFields");
    const namespaceInput = document.getElementById("entryIdNamespace");
    const modId = document.getElementById("entryIdModId");
    const modelType = document.getElementById("entryIdModelType");
    const namesInput = document.getElementById("entryIdNames");
    const importBtn = document.getElementById("entryIdImport");
    const importInput = document.getElementById("entryIdImportInput");
    const error = document.getElementById("entryIdError");
    const final = document.getElementById("entryIdFinal");
    const copy = document.getElementById("entryIdCopy");

    if (!api || !library || !baseLibFields || !ritsuLibFields || !namespaceInput || !modId || !modelType || !namesInput || !importBtn || !importInput || !error || !final || !copy) {
      return;
    }

    const storageKey = "sts2modding:id-generator:state";

    const modelTypes = [
      "afflicition",
      "card",
      "cardpile",
      "cardtag",
      "character",
      "enchantment",
      "encounter",
      "event",
      "keyword",
      "modelcapability",
      "modifier",
      "monster",
      "orb",
      "poolfilter",
      "potion",
      "power",
      "relic",
      "reward",
      "targettype",
      "topbarbutton",
    ];

    // Suffix templates derived from sts2 localization (zhs)
    // Categories not listed fall back to default ["title", "description"]
    const suffixTemplates = {
      CARDPILE: ["title"],
      ENCOUNTER: ["title", "loss"],
      EVENT: ["title", "pages.INITIAL.description"],
      MONSTER: ["name"],
      POWER: ["title", "description", "smartDescription"],
      RELIC: ["title", "description", "flavor"],
    };

    // BaseLib has no category notion — assume general entries with title+description
    const baseLibSuffixes = ["title", "description"];

    modelType.replaceChildren(...modelTypes.map((type) => {
      const option = document.createElement("option");
      option.value = type.toUpperCase();
      option.textContent = type.toUpperCase();
      return option;
    }));

    restoreState();

    [library, namespaceInput, modId, modelType, namesInput].forEach((control) => {
      control.addEventListener("input", update);
      control.addEventListener("change", update);
    });

    copy.addEventListener("click", async () => {
      const value = final.textContent || "";
      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);
        copy.textContent = "Copied!";
      } catch (ex) {
        copy.textContent = "Failed";
      }

      setTimeout(() => {
        copy.textContent = "Copy";
      }, 1200);
    });

    importBtn.addEventListener("click", () => importInput.click());

    importInput.addEventListener("change", () => {
      const files = Array.from(importInput.files || []);
      if (files.length === 0) return;

      const stems = [];
      for (const f of files) {
        const path = (f.webkitRelativePath || f.name || "").replace(/\\/g, "/");
        const base = path.split("/").pop() || "";
        // Only .cs files; ignore .uid, .import, .meta, etc.
        if (!/\.cs$/i.test(base)) continue;
        const stem = base.slice(0, -3);
        if (stem.length > 0) stems.push(stem);
      }

      const existing = new Set(
        namesInput.value.split(/\r?\n/).map((s) => s.trim()).filter((s) => s.length > 0)
      );

      const added = [];
      for (const stem of stems) {
        if (existing.has(stem)) continue;
        existing.add(stem);
        added.push(stem);
      }

      if (added.length === 0) {
        importBtn.textContent = "No new items";
      } else {
        const prefix = namesInput.value.length > 0 && !namesInput.value.endsWith("\n") ? "\n" : "";
        namesInput.value = namesInput.value + prefix + added.join("\n");
        importBtn.textContent = `Imported ${added.length}  items`;
        update();
      }

      importInput.value = "";
      setTimeout(() => { importBtn.textContent = "Import Folder"; }, 1500);
    });

    render();

    function update() {
      saveState();
      render();
    }

    function saveState() {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          library: library.value,
          namespace: namespaceInput.value,
          modId: modId.value,
          modelType: modelType.value,
          names: namesInput.value,
        }));
      } catch (ex) {}
    }

    function restoreState() {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;

        const state = JSON.parse(raw);
        setControlValue(library, state.library);
        setControlValue(namespaceInput, state.namespace);
        setControlValue(modId, state.modId);
        setControlValue(modelType, state.modelType);
        if (typeof state.names === "string") namesInput.value = state.names;
      } catch (ex) {}
    }

    function setControlValue(control, value) {
      if (typeof value !== "string") return;
      if (control.tagName === "SELECT") {
        const hasOption = Array.prototype.some.call(control.options, (option) => option.value === value);
        if (!hasOption) return;
      }
      control.value = value;
    }

    function render() {
      const isBaseLib = library.value === "baselib";
      baseLibFields.classList.toggle("is-hidden", !isBaseLib);
      ritsuLibFields.classList.toggle("is-hidden", isBaseLib);

      error.textContent = "";

      const names = namesInput.value
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (names.length === 0) {
        final.textContent = "";
        return;
      }

      const suffixes = isBaseLib
        ? baseLibSuffixes
        : (suffixTemplates[modelType.value] || baseLibSuffixes);

      try {
        const out = {};
        for (const name of names) {
          const id = isBaseLib
            ? api.buildBaseLibEntryId(namespaceInput.value, name)
            : api.buildRitsuLibEntryId(modId.value, modelType.value, name);

          for (const suffix of suffixes) {
            out[`${id}.${suffix}`] = "";
          }
        }
        final.innerHTML = highlightJson(JSON.stringify(out, null, 2));
      } catch (ex) {
        error.textContent = ex.message;
        final.textContent = "";
      }
    }

    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      })[c]);
    }

    function highlightJson(text) {
      // Token-by-token, regex-based JSON highlighter (input is JSON.stringify output, so safe).
      const tokenRe = /"(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],]/g;
      let result = "";
      let lastIndex = 0;
      let m;
      while ((m = tokenRe.exec(text)) !== null) {
        result += escapeHtml(text.slice(lastIndex, m.index));
        const tok = m[0];
        if (tok.endsWith(":") || /:\s*$/.test(tok)) {
          // Trailing colon means this is a key
          const colonIdx = tok.lastIndexOf(":");
          const key = tok.slice(0, colonIdx).trimEnd();
          const after = tok.slice(colonIdx);
          result += '<span class="json-key">' + escapeHtml(key) + "</span>" + escapeHtml(after);
        } else if (tok.startsWith('"')) {
          result += '<span class="json-string">' + escapeHtml(tok) + "</span>";
        } else if (tok === "true" || tok === "false") {
          result += '<span class="json-bool">' + tok + "</span>";
        } else if (tok === "null") {
          result += '<span class="json-null">' + tok + "</span>";
        } else if (/^-?\d/.test(tok)) {
          result += '<span class="json-number">' + tok + "</span>";
        } else {
          result += '<span class="json-punct">' + escapeHtml(tok) + "</span>";
        }
        lastIndex = tokenRe.lastIndex;
      }
      result += escapeHtml(text.slice(lastIndex));
      return result;
    }
  })();
</script>
