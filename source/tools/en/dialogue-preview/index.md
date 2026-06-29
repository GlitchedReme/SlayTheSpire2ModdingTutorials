---
title: Dialogue Preview
date: 2026-06-15 00:00:00
permalink: en/tools/dialogue-preview/
comments: false
reprinted: true
hide_meta: true
---

<style>
@import url("/tools/preview-assets/preview-tools.css");
@import url("/tools/preview-assets/dialogue-preview.css?v=20260616-mobile1");
</style>

<div class="tp-root preview-tool dp-root" data-dialogue-preview-tool>

<div class="tp-cols dp-cols">

<!-- 左栏：Editor -->
<div class="tp-card dp-card-editor">
<h3>Editor</h3>

<!-- 上方：可视化编辑 -->
<div class="dp-visual">

<div class="dp-meta-grid">
<label class="dp-meta-cell">
<span>Ancient</span>
<div class="dp-select-with-btn">
<select id="dpAncientId" class="dp-ancient-select"></select>
<button type="button" id="dpDeleteAncient" class="dp-btn-x" title="Delete Custom Ancient">×</button>
</div>
</label>
<label class="dp-meta-cell">
<span>Character</span>
<div class="dp-select-with-btn">
<select id="dpCharSelect" class="dp-char-select"></select>
<button type="button" id="dpDeleteChar" class="dp-btn-x" title="Delete Custom Character">×</button>
</div>
</label>
<label class="dp-meta-cell">
<span>Title</span>
<input type="text" id="dpAncientName" value="Tezcatara" spellcheck="false">
</label>
<label class="dp-meta-cell">
<span>Epithet</span>
<input type="text" id="dpAncientEpithet" value="Fire Keeper" spellcheck="false">
</label>
</div>

<div class="dp-set-toolbar">
<label class="dp-meta-cell dp-set-picker-cell">
<span>Dialogue Set</span>
<select id="dpSetPicker" class="dp-set-picker"></select>
</label>
<div class="dp-set-toolbar-actions">
<button type="button" id="dpAddSet" class="dp-btn-ghost" title="Add Set">+ Add</button>
<button type="button" id="dpRemoveSet" class="dp-btn-ghost" title="Delete Current Set">✕ Delete</button>
</div>
</div>
<div class="dp-set-fields-row" id="dpSetFields"></div>
<div class="dp-lines-header">
<span>Dialogue Lines</span>
<button type="button" id="dpAddLine" class="dp-btn-ghost">+ Add Line</button>
</div>
<div class="dp-sets" id="dpSets"></div>
</div>

<!-- 下方：JSON 输入框 -->
<div class="dp-json">
<div class="dp-json-header">
<span>JSON</span>
<div class="dp-json-actions">
<label class="dp-json-only"><input type="checkbox" id="dpJsonOnlyCurrent"> Show current character only</label>
<button type="button" id="dpCopyJson" class="dp-btn-ghost">Copy</button>
</div>
</div>
<textarea id="dpJson" spellcheck="false" rows="10" placeholder="ancients.json snippet"></textarea>
</div>

</div><!-- /.tp-card -->

<!-- 右栏：预览 -->
<div class="tp-card dp-card-preview">
<h3><span>Preview</span></h3>

<div class="dp-preview-area" id="dpPreviewArea">
<div class="dp-preview-stage" id="dpPreviewStage">
<div class="dp-banner" id="dpBanner">
<div class="dp-banner-inner">
<span class="dp-banner-title" id="dpBannerTitle">Tezcatara</span>
<span class="dp-banner-epithet" id="dpBannerEpithet">Fire Keeper</span>
</div>
</div>
<div class="dp-dialogue-stack" id="dpDialogueStack"></div>
<div class="dp-next-hint" id="dpNextHint">▼ Click to continue</div>
</div>
<div class="dp-preview-toolbar">
<button type="button" id="dpReset" class="dp-btn-ghost">Reset Dialogue</button>
<label class="dp-visit-inline">
<span>Visit Count</span>
<input type="number" id="dpVisitCount" min="0" step="1" value="0">
</label>
<span class="dp-progress" id="dpProgress">Set 0 / 0 lines</span>
</div>
</div>
</div>

</div><!-- /.tp-cols -->

<div class="tp-toast" id="toast"></div>
</div><!-- /.dp-root -->

<script src="/tools/preview-assets/preview-tools-en.js"></script>
<script src="/tools/preview-assets/dialogue-icons.js"></script>
<script src="/tools/preview-assets/ancients-data-en.js"></script>
<script src="/tools/preview-assets/dialogue-preview-en.js"></script>
