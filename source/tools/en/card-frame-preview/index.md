---
title: Card Frame Preview
date: 2026-05-23 05:00:00
permalink: en/tools/card-frame-preview/
comments: false
reprinted: true
hide_meta: true
---

<style>
@import url("/tools/preview-assets/preview-tools.css?v=20260527-frame-hsv1");
</style>

<div class="preview-tool" data-card-frame-preview-tool>
<section class="section">
<div class="grid-hero">
<div class="panel-flush">
<div class="frame-stage">
<span class="frame-stage-info" id="frameStageInfo">SKILL — h:0 s:0 v:1.2</span>
<canvas id="frameCanvas" width="598" height="844"></canvas>
</div>
<div class="chip-row" style="padding: 10px 4px 4px;">
<button class="chip active" data-frame="skill">Skill</button>
<button class="chip" data-frame="attack">Attack</button>
<button class="chip" data-frame="power">Power</button>
<button class="chip" data-frame="quest">Quest</button>
<button class="chip" data-frame="ancient">Ancient</button>
<button class="chip export-chip" id="exportFramePng" type="button">Export PNG</button>
</div>
<div class="chip-row ancient-type-row" id="ancientTypeRow" hidden>
<button class="chip active" data-ancient-type="attack" type="button">Ancient Attack</button>
<button class="chip" data-ancient-type="skill" type="button">Ancient Skill</button>
<button class="chip" data-ancient-type="power" type="button">Ancient Power</button>
</div>
</div>

<div class="panel">
<div class="hsva-grid">
<div class="hsva-cell">
<label>H · 0-1</label>
<input type="number" id="hsvH" value="0.025" min="0" max="1" step="0.001">
<input type="range" id="hsvHr" min="0" max="1" step="0.001" value="0.025">
</div>
<div class="hsva-cell">
<label>S · 0-5</label>
<input type="number" id="hsvS" value="0.85" min="0" max="5" step="0.01">
<input type="range" id="hsvSr" min="0" max="5" step="0.01" value="0.85">
</div>
<div class="hsva-cell">
<label>V · 0-3</label>
<input type="number" id="hsvV" value="1.0" min="0" max="3" step="0.01">
<input type="range" id="hsvVr" min="0" max="3" step="0.01" value="1.0">
</div>
</div>

<h2 style="margin-top:16px;">Vanilla Textures</h2>
<div class="vanilla-grid" id="vanillaGrid"></div>

<h2 style="margin-top:16px;">Code & Output</h2>
<div class="tabs">
<button class="tab active" data-tab="frame-tres">.tres</button>
<button class="tab" data-tab="frame-cs">C# Code</button>
</div>
<div class="tab-panel active" id="tab-frame-tres">
<pre class="code"><button class="copy kira-codeblock-copy-wrapper" type="button" data-target="codeTres" aria-label="Copy Code" title="Copy Code"></button><code id="codeTres" data-lang="tres"></code></pre>
</div>
<div class="tab-panel" id="tab-frame-cs">
<pre class="code"><button class="copy kira-codeblock-copy-wrapper" type="button" data-target="codeApply" aria-label="Copy Code" title="Copy Code"></button><code id="codeApply" data-lang="csharp"></code></pre>
</div>
</div>
</div>
</section>
<div class="toast" id="toast"></div>
</div>

<style>
@media (min-width: 1001px) {
  body:has([data-card-frame-preview-tool]) .kira-content {
    overflow: hidden !important;
  }

  body:has([data-card-frame-preview-tool]) .kira-main-content {
    height: 100% !important;
    min-height: 0 !important;
    padding: 14px !important;
    box-sizing: border-box;
  }

  body:has([data-card-frame-preview-tool]) .kira-post,
  body:has([data-card-frame-preview-tool]) .kira-post article {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .preview-tool[data-card-frame-preview-tool] {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .preview-tool[data-card-frame-preview-tool] .section {
    flex: 1 1 auto;
    min-height: 0;
    margin-bottom: 0;
  }

  .preview-tool[data-card-frame-preview-tool] .grid-hero {
    height: 100%;
    min-height: 0;
    grid-template-columns: minmax(260px, 0.74fr) minmax(0, 1fr);
  }

  .preview-tool[data-card-frame-preview-tool] .panel,
  .preview-tool[data-card-frame-preview-tool] .panel-flush {
    min-height: 0;
    overflow: hidden;
    padding: 10px;
  }

  .preview-tool[data-card-frame-preview-tool] .panel {
    display: flex;
    flex-direction: column;
  }

  .preview-tool[data-card-frame-preview-tool] .panel-flush {
    display: flex;
    flex-direction: column;
  }

  .preview-tool[data-card-frame-preview-tool] .frame-stage {
    flex: 1 1 auto;
    min-height: 0;
    padding: 8px;
  }

  .preview-tool[data-card-frame-preview-tool] .frame-stage canvas {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .preview-tool[data-card-frame-preview-tool] .chip-row {
    flex: 0 0 auto;
  }

  .preview-tool[data-card-frame-preview-tool] .panel > h2 {
    margin-bottom: 8px !important;
  }

  .preview-tool[data-card-frame-preview-tool] .hint {
    line-height: 1.35;
  }

  .preview-tool[data-card-frame-preview-tool] .hsva-grid {
    gap: 8px;
  }

  .preview-tool[data-card-frame-preview-tool] .vanilla-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }

  .preview-tool[data-card-frame-preview-tool] .vanilla-btn {
    padding: 6px 7px;
  }

  .preview-tool[data-card-frame-preview-tool] .tabs {
    flex: 0 0 auto;
  }

  .preview-tool[data-card-frame-preview-tool] #tab-frame-tres,
  .preview-tool[data-card-frame-preview-tool] #tab-frame-cs {
    flex: 1 1 auto;
    min-height: 0;
  }

  .preview-tool[data-card-frame-preview-tool] #tab-frame-tres.active,
  .preview-tool[data-card-frame-preview-tool] #tab-frame-cs.active {
    display: flex;
  }

  .preview-tool[data-card-frame-preview-tool] #tab-frame-tres pre.code,
  .preview-tool[data-card-frame-preview-tool] #tab-frame-cs pre.code,
  .preview-tool[data-card-frame-preview-tool] pre.code {
    flex: 1 1 auto;
    height: auto;
    min-height: 0;
  }
}
</style>

<script src="/tools/preview-assets/frame-assets.js?v=20260523-fullsize1"></script>
<script src="/tools/preview-assets/preview-tools-en.js?v=20260527-frame-hsv1"></script>
