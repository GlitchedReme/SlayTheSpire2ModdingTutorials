---
title: 对话预览器
date: 2026-06-15 00:00:00
permalink: tools/dialogue-preview/
comments: false
reprinted: true
hide_meta: true
---

<style>
@import url("../preview-assets/preview-tools.css");
@import url("../preview-assets/dialogue-preview.css");
</style>

<div class="tp-root preview-tool dp-root" data-dialogue-preview-tool>

<div class="tp-cols dp-cols">

<!-- 左栏：编辑器 -->
<div class="tp-card dp-card-editor">
<h3>编辑器</h3>

<!-- 上方：可视化编辑 -->
<div class="dp-visual">

<div class="dp-meta-grid">
<label class="dp-meta-cell">
<span>先古之民</span>
<div class="dp-select-with-btn">
<select id="dpAncientId" class="dp-ancient-select"></select>
<button type="button" id="dpDeleteAncient" class="dp-btn-x" title="删除自定义先古之民">×</button>
</div>
</label>
<label class="dp-meta-cell">
<span>角色</span>
<div class="dp-select-with-btn">
<select id="dpCharSelect" class="dp-char-select"></select>
<button type="button" id="dpDeleteChar" class="dp-btn-x" title="删除自定义角色">×</button>
</div>
</label>
<label class="dp-meta-cell">
<span>名字 title</span>
<input type="text" id="dpAncientName" value="特兹卡塔拉" spellcheck="false">
</label>
<label class="dp-meta-cell">
<span>绰号 epithet</span>
<input type="text" id="dpAncientEpithet" value="饲火者" spellcheck="false">
</label>
</div>

<div class="dp-set-toolbar">
<label class="dp-meta-cell dp-set-picker-cell">
<span>对话集</span>
<select id="dpSetPicker" class="dp-set-picker"></select>
</label>
<div class="dp-set-toolbar-actions">
<button type="button" id="dpAddSet" class="dp-btn-ghost" title="新增一套">＋ 新增</button>
<button type="button" id="dpRemoveSet" class="dp-btn-ghost" title="删除当前套">✕ 删除</button>
</div>
</div>
<div class="dp-set-fields-row" id="dpSetFields"></div>
<div class="dp-lines-header">
<span>对话行</span>
<button type="button" id="dpAddLine" class="dp-btn-ghost">＋ 添加一行</button>
</div>
<div class="dp-sets" id="dpSets"></div>
</div>

<!-- 下方：JSON 输入框 -->
<div class="dp-json">
<div class="dp-json-header">
<span>JSON</span>
<div class="dp-json-actions">
<button type="button" id="dpCopyJson" class="dp-btn-ghost">复制</button>
</div>
</div>
<textarea id="dpJson" spellcheck="false" rows="10" placeholder="ancients.json 片段"></textarea>
</div>

</div><!-- /.tp-card -->

<!-- 右栏：预览 -->
<div class="tp-card dp-card-preview">
<h3><span>预览</span></h3>

<div class="dp-preview-area" id="dpPreviewArea">
<div class="dp-preview-stage" id="dpPreviewStage">
<div class="dp-banner" id="dpBanner">
<div class="dp-banner-inner">
<span class="dp-banner-title" id="dpBannerTitle">特兹卡塔拉</span>
<span class="dp-banner-epithet" id="dpBannerEpithet">饲火者</span>
</div>
</div>
<div class="dp-dialogue-stack" id="dpDialogueStack"></div>
<div class="dp-next-hint" id="dpNextHint">▼ 点击继续</div>
</div>
<div class="dp-preview-toolbar">
<button type="button" id="dpReset" class="dp-btn-ghost">重置对话</button>
<label class="dp-visit-inline">
<span>访问次数</span>
<input type="number" id="dpVisitCount" min="0" step="1" value="0">
</label>
<span class="dp-progress" id="dpProgress">第 0 / 0 行</span>
</div>
</div>
</div>

</div><!-- /.tp-cols -->

<div class="tp-toast" id="toast"></div>
</div><!-- /.dp-root -->

<script src="../preview-assets/preview-tools.js"></script>
<script src="../preview-assets/dialogue-icons.js"></script>
<script src="../preview-assets/ancients-data.js"></script>
<script src="../preview-assets/dialogue-preview.js"></script>
