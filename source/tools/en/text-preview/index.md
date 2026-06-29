---
title: Text Preview
date: 2026-05-23 05:00:00
permalink: en/tools/text-preview/
comments: false
reprinted: true
hide_meta: true
---

<style>
@import url("/tools/preview-assets/preview-tools.css");

/* ====== 全屏工具(仅桌面) ====== */

@media (min-width: 1001px) {

  /* body 禁止滚动 */
  body:has(.tp-root) {
    overflow: hidden;
  }

  .kira-content:has(.tp-root) {
    overflow: hidden !important;
  }

  body:has(.tp-root) .kira-main-content {
    height: 100% !important;
    min-height: 0 !important;
    padding: 14px !important;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  body:has(.tp-root) .kira-post,
  body:has(.tp-root) .kira-post article {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  /* 文章标题可见，压缩间距 */
  body:has(.tp-root) .kira-post-title {
    display: block !important;
    margin: 0 0 4px 0;
    flex: 0 0 auto;
  }

}

/* ====== 根容器 ====== */
.tp-root {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg, #1a1d23);
  color: var(--text, #e0e6ed);
  font-family: var(--font-ui, system-ui);
  font-size: 14px;
  overflow: hidden;
}

/* ====== 左右两列 ====== */
.tp-cols {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px 20px 12px;
  min-height: 0;
}

/* ====== 卡片 ====== */
.tp-card {
  background: var(--panel, rgba(21,27,35,0.86));
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 12px 16px;
}

.tp-card h3 {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text, #e8edf2);
  letter-spacing: 0;
  text-transform: none;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ====== Editor Area ====== */
.tp-editor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.tp-editor-body textarea {
  flex-shrink: 1;
  min-height: 120px;
  max-height: 45vh;
  width: 100%;
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  line-height: 1.7;
  padding: 10px 12px;
  background: var(--panel-2, rgba(32,38,46,0.92));
  border: 1px solid var(--line, rgba(255,255,255,0.12));
  color: var(--text, #e8edf2);
  border-radius: 6px;
  outline: none;
  resize: none;
  tab-size: 4;
  transition: border-color .15s, box-shadow .15s;
  overflow-y: auto;
}

.tp-editor-body textarea:focus {
  border-color: var(--accent, #d97519);
  box-shadow: 0 0 0 3px var(--accent-glow, rgba(217,117,25,0.18));
}

.tp-editor-body textarea::placeholder {
  color: var(--text-mute, #7f8da3);
  opacity: 0.7;
}

/* ====== 工具栏 ====== */
.tp-toolbar {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-top: 8px;
}

.tp-toolbar-section {
  margin-bottom: 8px;
}

.tp-toolbar-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim, #aeb9c9);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 4px;
}

.tp-toolbar-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tp-toolbar-btns button {
  background: var(--panel-3, rgba(12,16,22,0.45));
  border: 1px solid var(--line, rgba(255,255,255,0.12));
  border-radius: 4px;
  color: var(--text, #e8edf2);
  font-size: 12px;
  font-family: var(--font-mono, monospace);
  padding: 2px 7px;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
  line-height: 1.6;
  white-space: nowrap;
}

.tp-toolbar-btns button:hover {
  background: var(--panel-hover, rgba(187,101,22,0.24));
  border-color: var(--accent-dim, #bb6516);
  color: var(--accent-bright, #f2a14b);
}

/* ====== Preview Area ====== */
.tp-preview-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(30,32,38,0.6);
  border-radius: 6px;
  min-height: 0;
  overflow: hidden;
}

.tp-preview-label {
  font-family: var(--font-ui, system-ui);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: var(--text-mute, #7f8da3);
  padding: 8px 12px 4px;
  flex-shrink: 0;
}

.tp-preview-render {
  flex: 1;
  overflow: auto;
  min-height: 0;
  padding: 0 12px 8px;
  font-family: var(--font-game, serif);
  color: var(--cream, #FFF6E2);
  font-size: 18px;
  line-height: 1.6;
}

/* ====== 复制按钮 ====== */
.tp-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: var(--panel-2, rgba(32,38,46,0.92));
  border: 1px solid var(--line, rgba(255,255,255,0.12));
  border-radius: 4px;
  padding: 3px 8px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-dim, #aeb9c9);
  transition: color .15s, border-color .15s, background .15s;
  opacity: 0.75;
}

.tp-copy-btn:hover {
  color: var(--accent, #d97519);
  border-color: var(--accent-dim, #bb6516);
  background: var(--panel-hover, rgba(187,101,22,0.24));
  opacity: 1;
}

/* ====== Toast 通知 ====== */
.tp-toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--panel, rgba(21,27,35,0.92));
  color: var(--text, #e8edf2);
  border: 1px solid var(--line-accent, rgba(217,117,25,0.48));
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  z-index: 9999;
  opacity: 0;
  pointer-events: none;
  transition: opacity .25s;
}

.tp-toast.show {
  opacity: 1;
}

/* ====== 标签区域两列布局 ====== */
.tp-tag-area {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
  padding-top: 8px;
}

/* ====== 标签列表(左侧可折叠列表) ====== */
.tp-tag-list {
  overflow-y: auto;
  min-height: 0;
}

.tp-tag-fold {
  margin-bottom: 2px;
}

.tp-tag-fold-header {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim, #aeb9c9);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 4px 6px;
  cursor: pointer;
  user-select: none;
  border-radius: 3px;
  transition: background .12s;
}
.tp-tag-fold-header:hover {
  background: rgba(255,255,255,0.04);
}

.tp-fold-icon {
  font-size: 9px;
  transition: transform .15s;
}
.tp-tag-fold-body {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  padding: 2px 6px 6px 14px;
  max-height: 300px;
  overflow: hidden;
  transition: max-height .2s ease, opacity .15s, padding .15s;
}
.tp-tag-fold-body.collapsed {
  max-height: 0 !important;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
  pointer-events: none;
}

.tp-tag-fold-body button {
  background: var(--panel-3, rgba(12,16,22,0.45));
  border: 1px solid var(--line, rgba(255,255,255,0.12));
  border-radius: 4px;
  color: var(--text, #e8edf2);
  font-size: 12px;
  font-family: var(--font-mono, monospace);
  padding: 1px 6px;
  cursor: pointer;
  transition: background .12s, border-color .12s, color .12s;
  line-height: 1.5;
  white-space: nowrap;
}
.tp-tag-fold-body button:hover {
  background: var(--panel-hover, rgba(187,101,22,0.24));
  border-color: var(--accent-dim, #bb6516);
  color: var(--accent-bright, #f2a14b);
}

/* ====== Variable Injection Panel (Right) ====== */
.tp-var-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.tp-var-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim, #aeb9c9);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 6px;
  flex-shrink: 0;
}
.tp-var-rows {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tp-var-row {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto;
  gap: 4px;
  align-items: center;
}
.tp-var-row.dragging {
  opacity: 0.4;
  border-color: var(--accent, #d97519);
}
.tp-var-drag-handle {
  width: 20px;
  cursor: grab;
  color: var(--text-mute, #7f8da3);
  text-align: center;
  user-select: none;
}
.tp-var-drag-handle:active {
  cursor: grabbing;
}
.tp-var-drag-handle:hover {
  color: var(--accent, #d97519);
}
.tp-var-name-wrap {
  position: relative;
}
.tp-var-name-input,
.tp-var-value-input {
  width: 100%;
  box-sizing: border-box;
  font-size: 11px;
  font-family: var(--font-mono, monospace);
  padding: 3px 6px;
  background: var(--panel-3, rgba(12,16,22,0.45));
  border: 1px solid var(--line, rgba(255,255,255,0.12));
  color: var(--text, #e8edf2);
  border-radius: 3px;
  outline: none;
  transition: border-color .12s, box-shadow .12s;
}
.tp-var-name-input:focus,
.tp-var-value-input:focus {
  border-color: var(--accent, #d97519);
  box-shadow: 0 0 0 2px var(--accent-glow, rgba(217,117,25,0.18));
}
.tp-var-name-input::placeholder,
.tp-var-value-input::placeholder {
  color: var(--text-mute, #7f8da3);
  opacity: 0.5;
}
.tp-var-remove {
  background: none;
  border: 1px solid transparent;
  color: var(--text-mute, #7f8da3);
  font-size: 14px;
  line-height: 1;
  padding: 2px 0;
  cursor: pointer;
  text-align: center;
  border-radius: 3px;
  transition: color .12s, border-color .12s, background .12s;
}
.tp-var-remove:hover {
  color: #e05353;
  border-color: rgba(224,83,83,0.3);
  background: rgba(224,83,83,0.08);
}
.tp-var-btn-group {
  display: flex;
  gap: 4px;
  align-items: center;
}
.tp-var-toggle {
  width: 32px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 9px;
  cursor: pointer;
  background: rgba(255,255,255,0.1);
  outline: none;
  transition: background .15s;
  position: relative;
  flex-shrink: 0;
}
.tp-var-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(255,255,255,0.35);
  transition: left .15s, background .15s, transform .15s;
}
.tp-var-toggle[data-on="true"] {
  background: var(--accent, #d97519);
}
.tp-var-toggle[data-on="true"]::after {
  left: 16px;
  background: #fff;
}
.tp-var-toggle[data-on="false"]:hover {
  background: rgba(255,255,255,0.18);
}
.tp-var-add-row {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}
.tp-var-add-btn {
  background: var(--panel-3, rgba(12,16,22,0.45));
  border: 1px dashed var(--line, rgba(255,255,255,0.18));
  border-radius: 4px;
  color: var(--text-dim, #aeb9c9);
  font-size: 12px;
  line-height: 1;
  padding: 4px 16px;
  cursor: pointer;
  transition: background .12s, border-color .12s, color .12s;
  width: 100%;
}
.tp-var-add-btn:hover {
  background: var(--panel-hover, rgba(187,101,22,0.24));
  border-color: var(--accent-dim, #bb6516);
  color: var(--accent-bright, #f2a14b);
}
.tp-var-insert-handle {
  cursor: grab;
  color: var(--text-mute, #7f8da3);
  font-size: 14px;
  line-height: 1;
  padding: 2px 4px;
  user-select: none;
  transition: color .12s;
  flex-shrink: 0;
}
.tp-var-insert-handle:active {
  cursor: grabbing;
}
.tp-var-insert-handle:hover {
  color: var(--accent, #d97519);
}
textarea.tp-editor-drop-hover {
  border-color: var(--accent, #d97519) !important;
  box-shadow: 0 0 0 2px var(--accent-glow, rgba(217,117,25,0.25)) !important;
}

/* ====== 自动补全下拉 ====== */
.tp-var-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: 50;
  background: var(--panel, rgba(21,27,35,0.96));
  border: 1px solid var(--line, rgba(255,255,255,0.12));
  border-radius: 4px;
  max-height: 160px;
  overflow-y: auto;
  margin-top: 2px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.35);
}
.tp-var-dropdown-item {
  padding: 3px 8px;
  font-size: 12px;
  font-family: var(--font-mono, monospace);
  cursor: pointer;
  color: var(--text, #e8edf2);
  transition: background .1s;
}
.tp-var-dropdown-item:hover,
.tp-var-dropdown-item.highlighted {
  background: var(--panel-hover, rgba(187,101,22,0.24));
  color: var(--accent-bright, #f2a14b);
}

/* ====== Editor Card Layout ====== */
.tp-card-editor .tp-editor-body {
  overflow: hidden;
}

/* ====== 移动端：单列堆叠，允许页面滚动(放最后以胜过前面的桌面规则) ====== */
@media (max-width: 1000px) {
  .tp-root {
    flex: 0 0 auto !important;
    height: auto !important;
    min-height: 0;
    overflow: visible !important;
  }
  .tp-cols {
    grid-template-columns: 1fr !important;
    gap: 12px;
    padding: 12px;
  }
  .tp-card {
    overflow: visible !important;
  }
  .tp-editor-body,
  .tp-card-editor .tp-editor-body {
    overflow: visible !important;
  }
  .tp-editor-body textarea {
    max-height: 50vh;
    min-height: 160px;
  }
  .tp-preview-area {
    overflow: visible !important;
  }
  .tp-preview-render {
    overflow: visible !important;
    min-height: 200px;
  }
}

</style>

<div class="tp-root preview-tool" data-text-preview-tool>

<div class="tp-cols">

<!-- 左栏：Editor -->
<div class="tp-card tp-card-editor">
<h3>
  <span>Editor</span>
</h3>

<div class="tp-editor-body">
<textarea id="bbcodeInput" rows="6" spellcheck="false" placeholder='Enter BBCode here'>Gain [gold]Block[/gold] equal to the number of cards in your [gold]Discard Pile[/gold]{IfUpgraded:show: +{CalculationBase}|}.{InCombat:\n(Gain {CalculatedBlock:diff()} [gold]Block[/gold])|}</textarea>
<button id="copyEditorBtn" class="tp-copy-btn" title="Copy BBCode (Ctrl+Enter)">Copy</button>

<div class="tp-tag-area">

<!-- 左侧：可折叠标签列表 -->
<div class="tp-tag-list">

<div class="tp-tag-fold">
<div class="tp-tag-fold-header" data-fold="color">
  <span class="tp-fold-icon">▼</span> Color Tags
</div>
<div class="tp-tag-fold-body" data-fold-body="color">
<button data-insert="[gold]...[/gold]" data-select="...">[gold]</button>
<button data-insert="[red]...[/red]" data-select="...">[red]</button>
<button data-insert="[blue]...[/blue]" data-select="...">[blue]</button>
<button data-insert="[green]...[/green]" data-select="...">[green]</button>
<button data-insert="[purple]...[/purple]" data-select="...">[purple]</button>
<button data-insert="[orange]...[/orange]" data-select="...">[orange]</button>
<button data-insert="[pink]...[/pink]" data-select="...">[pink]</button>
<button data-insert="[aqua]...[/aqua]" data-select="...">[aqua]</button>
<button data-insert="[color=#XXXXXX]...[/color]" data-select="...">[color]</button>
<button data-insert="[font=...]...[/font]" data-select="...">[font]</button>
<button data-insert="[font_size=...]...[/font_size]" data-select="...">[font_size]</button>
</div>
</div>

<div class="tp-tag-fold">
<div class="tp-tag-fold-header" data-fold="fx">
  <span class="tp-fold-icon">▶</span> Text Effects
</div>
<div class="tp-tag-fold-body collapsed" data-fold-body="fx">
<button data-insert="[b]...[/b]" data-select="...">[b]Bold</button>
<button data-insert="[i]...[/i]" data-select="...">[i]Italic</button>
<button data-insert="[u]...[/u]" data-select="...">[u]Underline</button>
<button data-insert="[jitter]...[/jitter]" data-select="...">[jitter]</button>
<button data-insert="[sine]...[/sine]" data-select="...">[sine]</button>
<button data-insert="[fade_in]...[/fade_in]" data-select="...">[fade_in]</button>
<button data-insert="[fly_in]...[/fly_in]" data-select="...">[fly_in]</button>
<button data-insert="[thinky_dots]...[/thinky_dots]" data-select="...">[thinky_dots]</button>
<button data-insert="[rainbow]...[/rainbow]" data-select="...">[rainbow]</button>
</div>
</div>

<div class="tp-tag-fold">
<div class="tp-tag-fold-header" data-fold="var">
  <span class="tp-fold-icon">▶</span> Placeholder Variables
</div>
<div class="tp-tag-fold-body collapsed" data-fold-body="var">
<button data-insert="{Damage}">{Damage}</button>
<button data-insert="{Block}">{Block}</button>
<button data-insert="{Energy}">{Energy}</button>
<button data-insert="{Cards}">{Cards}</button>
<button data-insert="{Repeat}">{Repeat}</button>
<button data-insert="{Heal}">{Heal}</button>
<button data-insert="{HpLoss}">{HpLoss}</button>
<button data-insert="{MaxHp}">{MaxHp}</button>
<button data-insert="{Gold}">{Gold}</button>
<button data-insert="{CalculatedDamage}">{CalculatedDamage}</button>
<button data-insert="{CalculatedBlock}">{CalculatedBlock}</button>
<button data-insert="{Summon}">{Summon}</button>
<button data-insert="{Forge}">{Forge}</button>
<button data-insert="{Stars}">{Stars}</button>
<button data-insert="{StrengthPower}">{StrengthPower}</button>
<button data-insert="{DexterityPower}">{DexterityPower}</button>
<button data-insert="{WeakPower}">{WeakPower}</button>
<button data-insert="{VulnerablePower}">{VulnerablePower}</button>
<button data-insert="{PoisonPower}">{PoisonPower}</button>
<button data-insert="{DoomPower}">{DoomPower}</button>
<button data-insert="{energyPrefix}">{energyPrefix}</button>
</div>
</div>

<div class="tp-tag-fold">
<div class="tp-tag-fold-header" data-fold="cardctx">
  <span class="tp-fold-icon">▶</span> Card Context
</div>
<div class="tp-tag-fold-body collapsed" data-fold-body="cardctx">
<button data-insert="{singleStarIcon}">{singleStarIcon}</button>
<button data-insert="{InCombat:\n(hit {CalculatedHits:diff()} times)|}">{InCombat}</button>
<button data-insert="{IsTargeting:\n(deal {CalculatedDamage:diff()} damage)|}">{IsTargeting}</button>
<button data-insert="{OnTable:On field|Not on field}">{OnTable}</button>
<button data-insert="{IfUpgraded:show:All cards|One card}">{IfUpgraded}</button>
</div>
</div>

<div class="tp-tag-fold">
<div class="tp-tag-fold-header" data-fold="powerctx">
  <span class="tp-fold-icon">▶</span> Power Context
</div>
<div class="tp-tag-fold-body collapsed" data-fold-body="powerctx">
<button data-insert="{Amount}">{Amount}</button>
<button data-insert="{OnPlayer:You|That enemy}">{OnPlayer}</button>
<button data-insert="{IsMultiplayer:(Online)|}">{IsMultiplayer}</button>
<button data-insert="{PlayerCount}">{PlayerCount}</button>
<button data-insert="{OwnerName}">{OwnerName}</button>
<button data-insert="{ApplierName}">{ApplierName}</button>
<button data-insert="{TargetName}">{TargetName}</button>
</div>
</div>

<div class="tp-tag-fold">
<div class="tp-tag-fold-header" data-fold="fmt">
  <span class="tp-fold-icon">▶</span> Formatter
</div>
<div class="tp-tag-fold-body collapsed" data-fold-body="fmt">
<button data-insert="{Damage:diff()}">diff()</button>
<button data-insert="{HpLoss:inverseDiff()}">inverseDiff()</button>
<button data-insert="{Energy:energyIcons()}">energyIcons()</button>
<button data-insert="{Stars:starIcons()}">starIcons()</button>
<button data-insert="{Damage:abs()}">abs</button>
<button data-insert="{IfUpgraded:show:Upgrade Text|Non-upgrade Text}">IfUpgraded</button>
<button data-insert="{X:cond:>0?Active|No effect}">cond</button>
<button data-insert="{X:choose(1):One|Others}">choose</button>
<button data-insert="{Boost:percentMore()}">percentMore()</button>
<button data-insert="{Boost:percentLess()}">percentLess()</button>
<button data-insert="{Cards:plural:card|cards}">plural</button>
<button data-insert="{Cards:list:, |和}">list</button>
</div>
</div>

</div><!-- /.tp-tag-list -->

<!-- 右侧：Variable Injection -->
<div class="tp-var-panel">
<div class="tp-var-header">Variable Injection</div>
<div class="tp-var-rows" id="varRows">
</div>
</div>

</div><!-- /.tp-tag-area -->
</div><!-- /.tp-editor-body -->
</div><!-- /.tp-card -->

<!-- 右栏：Preview Area -->
<div class="tp-card">
<h3>Preview</h3>

<div class="tp-preview-area">
<div class="tp-preview-render" id="previewRender">Type BBCode to preview</div>
</div>
</div>

</div>

<div class="tp-toast" id="toast"></div>
</div>

<script src="/tools/preview-assets/preview-tools-en.js"></script>
