(function () {
  "use strict";
  const FRAME_B64 = globalThis.RitsuLibTextFramePreviewFrameB64 || {};
//
// === Game named colors with BBCode effect tag (RichText*.cs) ===
//
const NAMED_COLORS = [
  { name: 'gold',    hex: '#EFC851', tag: 'gold',   csVar: 'StsColors.gold'   },
  { name: 'red',     hex: '#FF5555', tag: 'red',    csVar: 'StsColors.red'    },
  { name: 'green',   hex: '#7FFF00', tag: 'green',  csVar: 'StsColors.green'  },
  { name: 'blue',    hex: '#87CEEB', tag: 'blue',   csVar: 'StsColors.blue'   },
  { name: 'purple',  hex: '#EE82EE', tag: 'purple', csVar: 'StsColors.purple' },
  { name: 'orange',  hex: '#FFA518', tag: 'orange', csVar: 'StsColors.orange' },
  { name: 'pink',    hex: '#FF78A0', tag: 'pink',   csVar: 'StsColors.pink'   },
  { name: 'aqua',    hex: '#2AEBBE', tag: 'aqua',   csVar: 'StsColors.aqua'   },
];

//
// === DOM refs ===
//
const $ = id => document.getElementById(id);
const previewRender = $('previewRender');
const CODE_LANGS = {
  codeTres: 'tres',
  codeApply: 'csharp',
  codeBBCode: 'bbcode',
  codeBBNamed: 'bbcode',
  codeCSharp: 'csharp',
  codeCSharpF: 'csharp',
  codeGD: 'gdscript',
  codeSts: 'csharp',
  codeJson: 'json',
  codeCss: 'css',
};

//
// === State ===
//
const MEGA_TEXT_EFFECTS = new Set(['jitter', 'sine', 'fade_in', 'fly_in', 'thinky_dots', 'rainbow']);
const JITTER_NOISE_FREQUENCY = 0.01;
let megaTextStartMs = 0;
let megaTextRaf = 0;
let megaTextChars = [];

//
// === Conversions ===
//
function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }
function pad2(n){ return n.toString(16).padStart(2,'0').toUpperCase(); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeQuadOut(t) { return 1 - (1 - t) * (1 - t); }
function numEnv(env, key, fallback) {
  const n = Number(env && env[key]);
  return Number.isFinite(n) ? n : fallback;
}
function boolEnv(env, key, fallback) {
  if (!env || !(key in env)) return fallback;
  const value = String(env[key]).trim().toLowerCase();
  if (value === 'false' || value === '0' || value === 'no' || value === 'off') return false;
  if (value === 'true' || value === '1' || value === 'yes' || value === 'on') return true;
  return fallback;
}

function rgbToHex({r,g,b,a}, withAlpha=false) {
  const base = '#' + pad2(r) + pad2(g) + pad2(b);
  return withAlpha ? base + pad2(a) : base;
}
function hexToRgb(hex) {
  let s = hex.trim().replace(/^#/, '');
  if (s.length === 3) s = s.split('').map(c=>c+c).join('');
  if (s.length === 6) s += 'FF';
  if (s.length !== 8) return null;
  const n = parseInt(s, 16);
  if (Number.isNaN(n)) return null;
  return {
    r: (n >>> 24) & 0xff,
    g: (n >>> 16) & 0xff,
    b: (n >>> 8)  & 0xff,
    a:  n         & 0xff,
  };
}
function floatStr(n) { return (n/255).toFixed(3); }
function hsvFrameToRgb(h, s, v) {
  const hh = (h * 360) % 360;
  s = Math.min(s, 1);
  v = Math.min(v, 1);
  const c = v * s;
  const hp = hh / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = v - c;
  let r, g, b;
  if      (hp < 1) { r = c;   g = x;   b = 0; }
  else if (hp < 2) { r = x;   g = c;   b = 0; }
  else if (hp < 3) { r = 0;   g = c;   b = x; }
  else if (hp < 4) { r = 0;   g = x;   b = c; }
  else if (hp < 5) { r = x;   g = 0;   b = c; }
  else             { r = c;   g = 0;   b = x; }
  return { r: r + m, g: g + m, b: b + m };
}

function escapeCodeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightBbcode(raw) {
  return escapeCodeHtml(raw).replace(
    /(\[\/?[a-z_]+(?:[=\s][^\]]+)?\])/gi,
    '<span class="rider-token-tag">$1</span>'
  );
}

function highlightGdscript(raw) {
  return escapeCodeHtml(raw)
    .replace(/(#.*)$/gm, '<span class="rider-token-comment">$1</span>')
    .replace(/(&quot;[^&]*&quot;)/g, '<span class="rider-token-string">$1</span>')
    .replace(/\b(Color|Vector2|Vector3|ShaderMaterial|ExtResource)\b/g, '<span class="rider-token-type">$1</span>')
    .replace(/\b(var|const|func|return|if|else|true|false|null)\b/g, '<span class="rider-token-keyword">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?f?)\b/g, '<span class="rider-token-number">$1</span>');
}

function highlightTres(raw) {
  return escapeCodeHtml(raw)
    .replace(/(#.*)$/gm, '<span class="rider-token-comment">$1</span>')
    .replace(/^(\[[^\]\n]+\])/gm, '<span class="rider-token-tag">$1</span>')
    .replace(/(&quot;[^&]*&quot;)/g, '<span class="rider-token-string">$1</span>')
    .replace(/\b(ExtResource|SubResource|ShaderMaterial|Shader|Resource)\b/g, '<span class="rider-token-type">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="rider-token-keyword">$1</span>')
    .replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span class="rider-token-number">$1</span>')
    .replace(/^([a-zA-Z_][\w/.-]*)(\s*=)/gm, '<span class="rider-token-attr">$1</span>$2');
}

function highlightFallback(raw) {
  return escapeCodeHtml(raw)
    .replace(/(\/\/.*|#.*)$/gm, '<span class="rider-token-comment">$1</span>')
    .replace(/(&quot;[^&]*&quot;)/g, '<span class="rider-token-string">$1</span>')
    .replace(/\b(public|static|readonly|var|new|true|false|null|return|class|using)\b/g, '<span class="rider-token-keyword">$1</span>')
    .replace(/\b(Color|ShaderMaterial|ExtResource|String|float|int|bool)\b/g, '<span class="rider-token-type">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?f?)\b/g, '<span class="rider-token-number">$1</span>');
}

function highlightCode(raw, lang) {
  if (lang === 'bbcode') return highlightBbcode(raw);
  if (lang === 'gdscript') return highlightGdscript(raw);
  if (lang === 'tres') return highlightTres(raw);
  if (globalThis.hljs && lang && globalThis.hljs.getLanguage && globalThis.hljs.getLanguage(lang)) {
    try {
      return globalThis.hljs.highlight(raw, { language: lang, ignoreIllegals: true }).value;
    } catch (_) {
      return highlightFallback(raw);
    }
  }
  return highlightFallback(raw);
}

function setCode(id, text) {
  const el = $(id);
  if (!el) return;
  const raw = String(text);
  const lang = el.dataset.lang || CODE_LANGS[id] || '';
  el.dataset.raw = raw;
  el.className = lang ? `language-${lang}` : '';
  el.innerHTML = highlightCode(raw, lang);
}

function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function bindAutoResizeTextareas() {
  [previewText, reverseInput].forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => autoResizeTextarea(el));
    autoResizeTextarea(el);
  });
}

function copyByCommand(text) {
  const box = document.createElement('textarea');
  box.value = text;
  box.setAttribute('readonly', '');
  box.style.position = 'fixed';
  box.style.left = '-9999px';
  box.style.top = '0';
  document.body.appendChild(box);
  box.focus();
  box.select();
  box.setSelectionRange(0, box.value.length);
  let copiedByEvent = false;
  const onCopy = event => {
    if (!event.clipboardData) return;
    event.clipboardData.setData('text/plain', text);
    event.preventDefault();
    copiedByEvent = true;
  };
  document.addEventListener('copy', onCopy);
  try {
    return document.execCommand('copy') || copiedByEvent;
  } catch (_) {
    return false;
  } finally {
    document.removeEventListener('copy', onCopy);
    document.body.removeChild(box);
  }
}

async function writeClipboard(text) {
  if (copyByCommand(text)) return true;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}

  return false;
}

//
// === MegaRichTextLabel-compatible per-character effects ===
//
function hashNoise(seed, x) {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  h ^= Math.imul(x, 0xc2b2ae35);
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

function smoothNoise1D(x, seed) {
  const x0 = Math.floor(x);
  const t = x - x0;
  const u = t * t * (3 - 2 * t);
  return lerp(hashNoise(seed, x0), hashNoise(seed, x0 + 1), u);
}

function fractalNoise1D(x, seed) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let octave = 0; octave < 8; octave++) {
    sum += smoothNoise1D(x * freq, seed + octave * 1009) * amp;
    norm += amp;
    freq *= 2;
    amp *= 0.8;
  }
  return norm ? sum / norm : 0;
}

function parseFxList(el) {
  try {
    const list = JSON.parse(el.dataset.fx || '[]');
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

function applyMegaTextFx(now) {
  if (!megaTextChars.length) {
    megaTextRaf = 0;
    return;
  }

  const elapsed = Math.max(0, (now - megaTextStartMs) / 1000);
  for (const item of megaTextChars) {
    let tx = 0;
    let ty = 0;
    let rot = 0;
    let opacity = 1;
    let visible = true;

    for (const fx of item.effects) {
      const env = fx.env || {};
      const index = Number(fx.index) || 0;

      if (fx.name === 'fade_in') {
        const speed = Math.max(0.001, numEnv(env, 'speed', 4));
        const tick = Math.max(0, numEnv(env, 'tick', 0.01));
        opacity = Math.min(opacity, clamp(elapsed * speed - index * tick, 0, 1));
        visible = visible && boolEnv(env, 'visible', true);
      } else if (fx.name === 'fly_in') {
        const offsetX = numEnv(env, 'offset_x', 0);
        const offsetY = numEnv(env, 'offset_y', 0);
        const alpha = clamp(elapsed * 3 - index * 0.015, 0, 1);
        const t = easeQuadOut(alpha);
        tx += offsetX * (1 - t);
        ty += offsetY * (1 - t);
        rot += easeQuadOut(1 - alpha) * 20 * (offsetX < 0 ? 1 : -1);
        opacity = Math.min(opacity, alpha);
      } else if (fx.name === 'thinky_dots') {
        const val = Math.max(elapsed - index * 0.1, 0);
        const phase = val % 4.4;
        const jump = phase < 0.4 ? 1.5 * Math.sin((phase / 0.4) * Math.PI) : 0;
        ty -= Math.max(jump, 0);
        visible = visible && boolEnv(env, 'visible', true);
      } else if (fx.name === 'sine') {
        ty += 0.8 * Math.sin((elapsed * 1.5 + index * 0.1) * Math.PI * 2 * 0.5);
        visible = visible && boolEnv(env, 'visible', true);
      } else if (fx.name === 'jitter') {
        const x = elapsed * 600 * JITTER_NOISE_FREQUENCY;
        tx += fractalNoise1D(x, (index + 1) * 131) * 3;
        ty += fractalNoise1D(x, (index + 1) * 737) * 3;
        visible = visible && boolEnv(env, 'visible', true);
      } else if (fx.name === 'rainbow') {
        const speed = Math.max(0.1, numEnv(env, 'speed', 0.5));
        const spread = Math.max(0, numEnv(env, 'spread', 0.05));
        const hue = ((elapsed * speed * 360) + index * (1 + spread * 10) * 45) % 360;
        item.el.style.setProperty('color', `hsl(${Math.round(hue)}, 80%, 60%)`, 'important');
        visible = visible && boolEnv(env, 'visible', true);
      }
    }

    item.el.style.opacity = opacity.toFixed(4);
    item.el.style.visibility = visible ? 'visible' : 'hidden';
    item.el.style.transform = `translate3d(${tx.toFixed(3)}px, ${ty.toFixed(3)}px, 0) rotate(${rot.toFixed(3)}deg)`;
  }

  megaTextRaf = requestAnimationFrame(applyMegaTextFx);
}

function restartMegaTextFx(root) {
  megaTextStartMs = performance.now();
  const scope = root || previewRender;
  if (!scope) {
    megaTextChars = [];
    if (megaTextRaf) cancelAnimationFrame(megaTextRaf);
    megaTextRaf = 0;
    return;
  }
  megaTextChars = Array.from(scope.querySelectorAll('.fx-char'))
    .map(el => ({ el, effects: parseFxList(el) }))
    .filter(item => item.effects.length);
  if (megaTextRaf) cancelAnimationFrame(megaTextRaf);
  megaTextRaf = megaTextChars.length ? requestAnimationFrame(applyMegaTextFx) : 0;
}

//
// === BBCode -> HTML renderer ===
//
function bbcodeToHtml(src) {
  const colorMap = Object.fromEntries(
    NAMED_COLORS.filter(c=>c.tag).map(c => [c.tag, c.hex])
  );
  const tokens = [];
  const re = /\[(\/?)([a-zA-Z_]+)([^\]]*)\]/g;
  let last = 0, m;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) tokens.push({ type:'text', value: src.slice(last, m.index) });
    const parsed = parseTagTail(m[3]);
    tokens.push({ type:'tag', close: m[1]==='/', name: m[2].toLowerCase(), arg: parsed.arg, env: parsed.env });
    last = m.index + m[0].length;
  }
  if (last < src.length) tokens.push({ type:'text', value: src.slice(last) });

  const stack = [];
  let out = '';
  function escapeHtml(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function escapeAttr(s) {
    return escapeHtml(String(s)).replace(/"/g, '&quot;');
  }
  function parseTagTail(tail) {
    const raw = (tail || '').trim();
    if (!raw) return { arg: null, env: {} };
    if (raw.startsWith('=')) return { arg: raw.slice(1).trim(), env: {} };
    const env = {};
    raw.replace(/([a-zA-Z_][\w-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s]+)/g, (_, key, value) => {
      env[key] = value.replace(/^['"]|['"]$/g, '');
      return '';
    });
    return { arg: null, env };
  }
  function activeStyles() {
    let color = null, bold = false, italic = false, underline = false, font = null, size = null, fx = [];
    for (const t of stack) {
      if (t.color) color = t.color;
      if (t.font) font = t.font;
      if (t.size) size = t.size;
      if (t.bold) bold = true;
      if (t.italic) italic = true;
      if (t.underline) underline = true;
      if (t.fx) fx.push(t.fx);
    }
    return { color, bold, italic, underline, font, size, fx };
  }
  function wrapCharsInner(text, fx) {
    let s = '';
    [...text].forEach(ch => {
      if (ch === '\n') {
        s += '<br>';
        return;
      }
      const effects = fx.map(owner => ({
        name: owner.name,
        index: owner.index++,
        env: owner.env || {},
      }));
      const attr = escapeAttr(JSON.stringify(effects));
      s += `<span class="fx-char" data-fx="${attr}">${ch === ' ' ? '&nbsp;' : escapeHtml(ch)}</span>`;
    });
    return s;
  }
  function emitText(text) {
    if (!text) return;
    const { color, bold, italic, underline, font, size, fx } = activeStyles();
    const styles = [];
    if (color) styles.push(`color:${color}`);
    // [i] in STS2 (Chinese) renders as fangsong, not Western italic. An explicit [font=...] still wins.
    if (italic && !font) styles.push(`font-family:var(--font-italic)`);
    if (font) styles.push(`font-family:'${escapeAttr(String(font))}'`);
    if (size) styles.push(`font-size:${/^\d+(\.\d+)?$/.test(size) ? size + 'px' : size}`);
    if (bold) styles.push(`font-weight:700`);
    if (underline) styles.push(`text-decoration:underline`);
    const styleAttr = styles.length ? ` style="${styles.join(';')}"` : '';
    if (fx.length) {
      const cls = fx.map(f => 'fx-'+f.name).join(' ');
      out += `<span class="${cls}"${styleAttr}>${wrapCharsInner(text, fx)}</span>`;
    } else {
      out += `<span${styleAttr}>${escapeHtml(text)}</span>`;
    }
  }
  for (const t of tokens) {
    if (t.type === 'text') { emitText(t.value); continue; }
    if (t.close) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === t.name) { stack.splice(i,1); break; }
      }
      continue;
    }
    if (t.name === 'color' && t.arg)       stack.push({ tag:'color', color: t.arg });
    else if (t.name === 'font' && t.arg)   stack.push({ tag:'font', font: t.arg });
    else if (t.name === 'font_size' && t.arg)
                                            stack.push({ tag: t.name, size: t.arg });
    else if (colorMap[t.name])              stack.push({ tag: t.name, color: colorMap[t.name] });
    else if (t.name === 'b')                stack.push({ tag:'b', bold:true });
    else if (t.name === 'i')                stack.push({ tag:'i', italic:true });
    else if (t.name === 'u')                stack.push({ tag:'u', underline:true });
    else if (t.name === 'br')               { out += '<br>'; continue; }
    else if (MEGA_TEXT_EFFECTS.has(t.name)) stack.push({ tag: t.name, fx: { name: t.name, env: t.env || {}, index: 0 } });
    else                                    emitText('[' + t.name + (t.arg?'='+t.arg:'') + ']');
  }
  return out;
}

// Tab switching (works for any .tabs / .tab-panel block)
document.querySelectorAll('.tabs').forEach(group => {
  group.addEventListener('click', e => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    const target = btn.dataset.tab;
    group.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    // Find sibling panels in the parent
    const parent = group.parentElement;
    parent.querySelectorAll(':scope > .tab-panel').forEach(p => p.classList.remove('active'));
    const panel = parent.querySelector(`:scope > #tab-${target}`);
    if (panel) panel.classList.add('active');
  });
});

//
// === UX: toast ===
//
const toastEl = $('toast');
let toastTimer = 0;
function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1400);
}

//
// ============================================================
// CARD FRAME PREVIEW — replicates res://shaders/hsv.gdshader
// ============================================================
//
function initCardFramePreview() {
const frameCanvas = $('frameCanvas');
if (!frameCanvas) return;

const VANILLA_MATS = [
  { name: 'Ironclad Red',     h: 0.025, s: 0.85, v: 1.0,  swatch: '#c44a3a' },
  { name: 'Silent Green',     h: 0.32,  s: 0.45, v: 1.2,  swatch: '#a6e89a' },
  { name: 'Defect Blue',      h: 0.55,  s: 0.90, v: 1.0,  swatch: '#4aa6dd' },
  { name: 'Necrobinder Pink', h: 0.965, s: 0.55, v: 1.2,  swatch: '#f08fb4' },
  { name: 'Regent Orange',    h: 0.12,  s: 1.50, v: 1.2,  swatch: '#f0a020' },
  { name: 'Colorless',        h: 1.0,   s: 0.00, v: 1.2,  swatch: '#e8e8e8' },
  { name: 'Curse',            h: 0.85,  s: 0.05, v: 0.55, swatch: '#5a4d4d' },
  { name: 'Quest',            h: 1.0,   s: 1.00, v: 1.0,  swatch: '#c44a3a' },
];
const frameState = {
  h: 0.025, s: 0.85, v: 1.0,
  frameType: 'skill', ancientType: 'attack', vanillaName: 'Ironclad Red',
};
const NORMAL_FRAME_TYPES = new Set(['skill', 'attack', 'power', 'quest']);
const ANCIENT_FRAME_SIZE = { w: 618, h: 862 };
const ANCIENT_SCENE_SCALE = 2;
const ANCIENT_NODES = {
  glass: { left: -148.46497, top: -210.71002, right: 442.08002, bottom: 621.3, scale: 0.5 },
  border: { left: -154, top: -223, right: 152, bottom: 217, stretch: 'contain', modulate: [1, 0.9776916, 0.9058309, 0.50200003], composite: 'lighter' },
  textBg: { left: -133, top: -22, right: 131, bottom: 181, stretch: 'contain', modulate: [0, 0, 0, 0.66] },
  banner: { left: -163, top: -207, right: 164, bottom: -124, stretch: 'cover' },
};
const ancientCanvas = document.createElement('canvas');
ancientCanvas.id = 'ancientFrameCanvas';
ancientCanvas.width = ANCIENT_FRAME_SIZE.w;
ancientCanvas.height = ANCIENT_FRAME_SIZE.h;
ancientCanvas.hidden = true;
frameCanvas.insertAdjacentElement('afterend', ancientCanvas);
const ancientCtx = ancientCanvas.getContext('2d');
const gl = frameCanvas.getContext('webgl', {
  premultipliedAlpha: false,
  alpha: true,
  preserveDrawingBuffer: true,
});
let glReady = false;
let texMap = {}, imageMap = {}, texSize = {};
let glProgram, glUniforms, glAttribs, vertexBuffer, ancientFrameRaf = 0;
let ancientStaticCacheKey = '', ancientStaticCanvas = null, ancientStaticMissing = [];

const VS_SRC = `
  attribute vec2 a_pos;
  attribute vec2 a_uv;
  varying vec2 v_uv;
  void main() { v_uv = a_uv; gl_Position = vec4(a_pos, 0.0, 1.0); }
`;
const FS_SRC = `
  precision highp float;
  uniform sampler2D u_tex;
  uniform float u_h, u_s, u_v;
  uniform mat3 u_yiq_to_rgb;
  varying vec2 v_uv;
  void main() {
    mat3 RGB_to_YIQ = mat3(
      vec3(0.2989,  0.5959,  0.2115),
      vec3(0.5870, -0.2774, -0.5229),
      vec3(0.1140, -0.3216,  0.3114)
    );
    vec4 col = texture2D(u_tex, v_uv);
    col.rgb = RGB_to_YIQ * col.rgb;
    float hue = (1.0 - u_h) * 6.283185;
    float ch = cos(hue), sh = sin(hue);
    mat3 hue_shift = mat3(vec3(1.0,0.0,0.0), vec3(0.0,ch,-sh), vec3(0.0,sh,ch));
    col.rgb *= hue_shift;
    mat3 sat_shift = mat3(vec3(1.0,0.0,0.0), vec3(0.0,u_s,0.0), vec3(0.0,0.0,u_s));
    col.rgb = sat_shift * col.rgb;
    col.rgb = mix(vec3(0.0), col.rgb, u_v);
    col.rgb = u_yiq_to_rgb * col.rgb;
    gl_FragColor = col;
  }
`;
// Exact inverse of Godot's RGB_to_YIQ. GLSL mat3 columns = math matrix columns.
const YIQ_TO_RGB = new Float32Array([
  1.003061, 0.999257, 0.996674,
  0.955205,-0.271767,-1.105116,
  0.619283,-0.646486, 1.705119,
]);

function compileShader(type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('shader:', gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

function initGL() {
  if (!gl) { $('frameStageInfo').textContent = 'WebGL unavailable'; return false; }
  const vs = compileShader(gl.VERTEX_SHADER, VS_SRC);
  const fs = compileShader(gl.FRAGMENT_SHADER, FS_SRC);
  glProgram = gl.createProgram();
  gl.attachShader(glProgram, vs);
  gl.attachShader(glProgram, fs);
  gl.linkProgram(glProgram);
  if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
    console.error('link:', gl.getProgramInfoLog(glProgram));
    return false;
  }
  gl.useProgram(glProgram);
  glAttribs = {
    pos: gl.getAttribLocation(glProgram, 'a_pos'),
    uv:  gl.getAttribLocation(glProgram, 'a_uv'),
  };
  glUniforms = {
    h:   gl.getUniformLocation(glProgram, 'u_h'),
    s:   gl.getUniformLocation(glProgram, 'u_s'),
    v:   gl.getUniformLocation(glProgram, 'u_v'),
    tex: gl.getUniformLocation(glProgram, 'u_tex'),
    yiqToRgb: gl.getUniformLocation(glProgram, 'u_yiq_to_rgb'),
  };
  const verts = new Float32Array([
    -1, -1, 0, 1,
     1, -1, 1, 1,
    -1,  1, 0, 0,
     1,  1, 1, 0,
  ]);
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(glAttribs.pos);
  gl.enableVertexAttribArray(glAttribs.uv);
  gl.vertexAttribPointer(glAttribs.pos, 2, gl.FLOAT, false, 16, 0);
  gl.vertexAttribPointer(glAttribs.uv,  2, gl.FLOAT, false, 16, 8);
  gl.disable(gl.BLEND);
  glReady = true;
  return true;
}

function loadTexture(key, url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      imageMap[key] = img;
      texSize[key] = { w: img.naturalWidth, h: img.naturalHeight };
      if (gl && NORMAL_FRAME_TYPES.has(key)) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        texMap[key] = tex;
      }
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

function renderFrame() {
  if (!glReady) return;
  if (frameState.frameType === 'ancient') {
    renderAncientFrame();
    return;
  }
  if (ancientFrameRaf) {
    cancelAnimationFrame(ancientFrameRaf);
    ancientFrameRaf = 0;
  }

  const tex = texMap[frameState.frameType];
  const sz = texSize[frameState.frameType];
  if (!tex) return;

  frameCanvas.hidden = false;
  ancientCanvas.hidden = true;
  if (frameCanvas.width !== sz.w || frameCanvas.height !== sz.h) {
    frameCanvas.width = sz.w;
    frameCanvas.height = sz.h;
  }
  gl.viewport(0, 0, frameCanvas.width, frameCanvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(glProgram);
  gl.uniform1f(glUniforms.h, frameState.h);
  gl.uniform1f(glUniforms.s, frameState.s);
  gl.uniform1f(glUniforms.v, frameState.v);
  gl.uniformMatrix3fv(glUniforms.yiqToRgb, false, YIQ_TO_RGB);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(glUniforms.tex, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  $('frameStageInfo').textContent =
    `${frameState.frameType.toUpperCase()} · h:${frameState.h.toFixed(3)} s:${frameState.s.toFixed(3)} v:${frameState.v.toFixed(3)}` +
    (frameState.vanillaName ? ` · ${frameState.vanillaName}` : '');

  setCode('codeTres',
`[gd_resource type="ShaderMaterial" load_steps=2 format=3]

[ext_resource type="Shader" path="res://shaders/hsv.gdshader" id="1"]

[resource]
resource_local_to_scene = true
shader = ExtResource("1")
shader_parameter/h = ${frameState.h}
shader_parameter/s = ${frameState.s}
shader_parameter/v = ${frameState.v}`);

  setFrameCSharpSnippet();
}

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w));
  canvas.height = Math.max(1, Math.ceil(h));
  return canvas;
}

function modulateImageData(data, modulate) {
  if (!modulate) return;
  const [mr, mg, mb, ma] = modulate;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * mr);
    data[i + 1] = Math.round(data[i + 1] * mg);
    data[i + 2] = Math.round(data[i + 2] * mb);
    data[i + 3] = Math.round(data[i + 3] * ma);
  }
}

function drawModulatedImage(ctx, img, src, dest, opts = {}) {
  if (!img || !dest.w || !dest.h) return false;
  const tmp = makeCanvas(Math.abs(dest.w), Math.abs(dest.h));
  const tctx = tmp.getContext('2d');
  tctx.clearRect(0, 0, tmp.width, tmp.height);
  tctx.drawImage(img, src.x, src.y, src.w, src.h, 0, 0, tmp.width, tmp.height);

  if (opts.modulate) {
    const imageData = tctx.getImageData(0, 0, tmp.width, tmp.height);
    modulateImageData(imageData.data, opts.modulate);
    tctx.putImageData(imageData, 0, 0);
  }

  ctx.save();
  if (opts.composite) ctx.globalCompositeOperation = opts.composite;
  ctx.drawImage(tmp, dest.x, dest.y, dest.w, dest.h);
  ctx.restore();
  return true;
}

function textureRectGeometry(img, rect, stretch) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const src = { x: 0, y: 0, w: iw, h: ih };
  const dest = { ...rect };

  if (stretch === 'contain') {
    const scale = Math.min(rect.w / iw, rect.h / ih);
    dest.w = iw * scale;
    dest.h = ih * scale;
    dest.x = rect.x + (rect.w - dest.w) / 2;
    dest.y = rect.y + (rect.h - dest.h) / 2;
  } else if (stretch === 'cover') {
    const scale = Math.max(rect.w / iw, rect.h / ih);
    src.w = rect.w / scale;
    src.h = rect.h / scale;
    src.x = (iw - src.w) / 2;
    src.y = (ih - src.h) / 2;
  }

  return { src, dest };
}

function drawTextureRect(ctx, img, rect, opts = {}) {
  if (!img) return false;
  const { src, dest } = textureRectGeometry(img, rect, opts.stretch || 'stretch');
  return drawModulatedImage(ctx, img, src, dest, opts);
}

function ancientNodeRect(canvasW, canvasH, spec) {
  const nodeScale = spec.scale || 1;
  return {
    x: canvasW / 2 + spec.left * ANCIENT_SCENE_SCALE,
    y: canvasH / 2 + spec.top * ANCIENT_SCENE_SCALE,
    w: (spec.right - spec.left) * ANCIENT_SCENE_SCALE * nodeScale,
    h: (spec.bottom - spec.top) * ANCIENT_SCENE_SCALE * nodeScale,
  };
}

function drawAncientGlassOverlay(ctx, rect) {
  const main = imageMap.ancientGlass;
  const mask = imageMap.ancientOverlayMask;
  if (!main || !mask) return false;

  const w = Math.max(1, Math.round(rect.w));
  const h = Math.max(1, Math.round(rect.h));
  const mainCanvas = makeCanvas(w, h);
  const maskCanvas = makeCanvas(w, h);
  const outCanvas = makeCanvas(w, h);
  const mainCtx = mainCanvas.getContext('2d');
  const maskCtx = maskCanvas.getContext('2d');
  const outCtx = outCanvas.getContext('2d');

  mainCtx.drawImage(main, 0, 0, w, h);
  maskCtx.drawImage(mask, 0, 0, w, h);
  const mainData = mainCtx.getImageData(0, 0, w, h).data;
  const maskData = maskCtx.getImageData(0, 0, w, h).data;
  const out = outCtx.createImageData(w, h);

  for (let i = 0; i < out.data.length; i += 4) {
    const mainA = mainData[i + 3] / 255;
    const maskG = maskData[i + 1] / 255;
    const maskA = maskData[i + 3] / 255;
    const cornerWeight = maskG * 0.2;
    const screen = 0.15;
    const rgb = lerp(screen, 1, cornerWeight);
    const alpha = lerp(maskA, 1, cornerWeight) * mainA * maskA;
    out.data[i] = Math.round(rgb * 255);
    out.data[i + 1] = Math.round(rgb * 255);
    out.data[i + 2] = Math.round(rgb * 255);
    out.data[i + 3] = Math.round(clamp(alpha, 0, 1) * 255);
  }

  outCtx.putImageData(out, 0, 0);
  ctx.drawImage(outCanvas, rect.x, rect.y, rect.w, rect.h);
  return true;
}

function drawMissingAncientNotice(ctx, w, h, missingLayers) {
  if (!missingLayers.length) return;
  ctx.save();
  ctx.fillStyle = 'rgba(24, 24, 24, 0.78)';
  ctx.fillRect(32, h - 92, w - 64, 56);
  ctx.strokeStyle = 'rgba(255, 205, 120, 0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, h - 92, w - 64, 56);
  ctx.fillStyle = '#ffd28a';
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Missing Ancient resources: ${missingLayers.join(', ')}`, w / 2, h - 64);
  ctx.restore();
}

function drawAncientFlame(ctx, bannerRect) {
  const frame = Math.floor((Date.now() / 100) % 10);
  const img = imageMap[`ancientFlame${frame}`] || imageMap.ancientFlame0;
  if (!img) return false;
  const scale = ANCIENT_SCENE_SCALE * 0.6;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = bannerRect.x + 164 * ANCIENT_SCENE_SCALE - w / 2;
  const y = bannerRect.y - 10 * ANCIENT_SCENE_SCALE - h / 2;
  ctx.drawImage(img, x, y, w, h);
  return true;
}

function ancientTextBgKey(type) {
  const safeType = type === 'skill' || type === 'power' ? type : 'attack';
  return `ancientTextBg${safeType[0].toUpperCase()}${safeType.slice(1)}`;
}

function buildAncientStaticLayer(w, h) {
  const key = `${w}x${h}:${frameState.ancientType}:${Object.keys(imageMap).length}`;
  if (ancientStaticCanvas && ancientStaticCacheKey === key) {
    return ancientStaticCanvas;
  }

  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const missingLayers = [];
  const glassRect = ancientNodeRect(w, h, ANCIENT_NODES.glass);
  const borderRect = ancientNodeRect(w, h, ANCIENT_NODES.border);
  const textBgRect = ancientNodeRect(w, h, ANCIENT_NODES.textBg);
  const bannerRect = ancientNodeRect(w, h, ANCIENT_NODES.banner);
  const textBg = imageMap[ancientTextBgKey(frameState.ancientType)];

  if (!drawAncientGlassOverlay(ctx, glassRect)) missingLayers.push('glass-overlay');
  if (!drawTextureRect(ctx, imageMap.ancientBorder, borderRect, ANCIENT_NODES.border)) missingLayers.push('border');
  if (!drawTextureRect(ctx, textBg, textBgRect, ANCIENT_NODES.textBg)) missingLayers.push(`text-bg-${frameState.ancientType}`);
  if (!drawTextureRect(ctx, imageMap.ancientBanner, bannerRect, ANCIENT_NODES.banner)) missingLayers.push('banner');

  ancientStaticCacheKey = key;
  ancientStaticCanvas = canvas;
  ancientStaticMissing = missingLayers;
  return canvas;
}

function setAncientCodeSnippets() {
  setCode('codeTres',
`# Ancient cards do not use card_frame_*_mat.tres as the visible frame.
# NCard hides %Frame and draws AncientBorderGlassOverlay, AncientBorder,
# AncientTextBg, AncientBanner, and Fire instead.

AncientBorder = res://images/atlases/compressed_atlas.sprites/ancient_card_border.png.tres
AncientTextBg = res://images/atlases/compressed_atlas.sprites/ancient_text_bg_${frameState.ancientType}.png.tres
AncientBanner = res://images/atlases/ui_atlas.sprites/card/ancient_banner.tres
AncientBorderGlassOverlay.Texture = res://images/vfx/ui/ui_card_mask.png
AncientBorderGlassOverlay.Material.mask = res://images/vfx/ui/card/ancient/ui_card_ancient_border_main.png`);

  setFrameCSharpSnippet();
}

function renderAncientFrame() {
  if (frameState.frameType !== 'ancient') return;
  const w = (texSize.ancient && texSize.ancient.w) || ANCIENT_FRAME_SIZE.w;
  const h = (texSize.ancient && texSize.ancient.h) || ANCIENT_FRAME_SIZE.h;
  frameCanvas.hidden = true;
  ancientCanvas.hidden = false;
  if (ancientCanvas.width !== w || ancientCanvas.height !== h) {
    ancientCanvas.width = w;
    ancientCanvas.height = h;
  }
  if (!ancientCtx) return;

  ancientCtx.clearRect(0, 0, w, h);
  const staticLayer = buildAncientStaticLayer(w, h);
  ancientCtx.drawImage(staticLayer, 0, 0);

  const bannerRect = ancientNodeRect(w, h, ANCIENT_NODES.banner);
  const missingLayers = ancientStaticMissing.slice();
  if (!drawAncientFlame(ancientCtx, bannerRect)) missingLayers.push('flame');
  drawMissingAncientNotice(ancientCtx, w, h, missingLayers);

  $('frameStageInfo').textContent =
    `ANCIENT ${frameState.ancientType.toUpperCase()} · ${w}x${h}` +
    (missingLayers.length ? ` · 缺少资源: ${missingLayers.join(', ')}` : ' · 原版叠层');
  setAncientCodeSnippets();

  if (!ancientFrameRaf) {
    ancientFrameRaf = requestAnimationFrame(() => {
      ancientFrameRaf = 0;
      renderAncientFrame();
    });
  }
}

function frameFloat(n) {
  return `${Number(n.toFixed(3))}f`;
}

function setFrameCSharpSnippet() {
  const rgb = hsvFrameToRgb(frameState.h, frameState.s, frameState.v);
  setCode('codeApply',
`// 写在卡池中

// Applies to RitsuLib
private static readonly Material? _poolFrameMaterial = MaterialUtils.CreateHsvShaderMaterial(${frameFloat(frameState.h)}, ${frameFloat(frameState.s)}, ${frameFloat(frameState.v)});
public override Material? PoolFrameMaterial => _poolFrameMaterial;

// Applies to BaseLib
public override Color ShaderColor => new(${frameFloat(rgb.r)}, ${frameFloat(rgb.g)}, ${frameFloat(rgb.b)});`);
}

function setHsv(h, s, v, source) {
  frameState.h = clamp(h, 0, 1);
  frameState.s = clamp(s, 0, 5);
  frameState.v = clamp(v, 0, 3);
  if (source !== 'preset') frameState.vanillaName = null;
  if (source !== 'hsvN') {
    $('hsvH').value = frameState.h.toFixed(3);
    $('hsvS').value = frameState.s.toFixed(3);
    $('hsvV').value = frameState.v.toFixed(3);
  }
  if (source !== 'hsvR') {
    $('hsvHr').value = frameState.h;
    $('hsvSr').value = frameState.s;
    $('hsvVr').value = frameState.v;
  }
  renderFrame();
}

function buildVanillaButtons() {
  const grid = $('vanillaGrid');
  for (const m of VANILLA_MATS) {
    const b = document.createElement('button');
    b.className = 'vanilla-btn';
    b.innerHTML =
      `<span class="sw" style="background:${m.swatch}"></span>
       <span class="vname"><b>${m.name}</b><br><span class="vhsv">h=${m.h} s=${m.s} v=${m.v}</span></span>`;
    b.onclick = () => {
      frameState.vanillaName = m.name;
      setHsv(m.h, m.s, m.v, 'preset');
    };
    grid.appendChild(b);
  }
}

function wireFramePreview() {
  $('hsvH').addEventListener('input',  e => setHsv(+e.target.value, frameState.s, frameState.v, 'hsvN'));
  $('hsvS').addEventListener('input',  e => setHsv(frameState.h, +e.target.value, frameState.v, 'hsvN'));
  $('hsvV').addEventListener('input',  e => setHsv(frameState.h, frameState.s, +e.target.value, 'hsvN'));
  $('hsvHr').addEventListener('input', e => setHsv(+e.target.value, frameState.s, frameState.v, 'hsvR'));
  $('hsvSr').addEventListener('input', e => setHsv(frameState.h, +e.target.value, frameState.v, 'hsvR'));
  $('hsvVr').addEventListener('input', e => setHsv(frameState.h, frameState.s, +e.target.value, 'hsvR'));

  document.querySelectorAll('.chip[data-frame]').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-frame]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      frameState.frameType = b.dataset.frame;
      $('ancientTypeRow').hidden = frameState.frameType !== 'ancient';
      renderFrame();
    });
  });

  document.querySelectorAll('.chip[data-ancient-type]').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-ancient-type]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      frameState.ancientType = b.dataset.ancientType;
      renderFrame();
    });
  });

  $('exportFramePng').addEventListener('click', exportFramePng);
}

function currentFrameCanvas() {
  return frameState.frameType === 'ancient' ? ancientCanvas : frameCanvas;
}

function exportFramePng() {
  const canvas = currentFrameCanvas();
  if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
  const suffix = frameState.frameType === 'ancient'
    ? `${frameState.frameType}-${frameState.ancientType}`
    : `${frameState.frameType}-h${frameState.h.toFixed(3)}-s${frameState.s.toFixed(2)}-v${frameState.v.toFixed(2)}`;
  const link = document.createElement('a');
  link.download = `sts2-card-frame-${suffix}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast(`已导出 ${canvas.width}x${canvas.height} PNG`);
}

async function initFramePreview() {
  if (!initGL()) return;
  buildVanillaButtons();
  wireFramePreview();
  const results = await Promise.all(
    Object.entries(FRAME_B64).map(([k, url]) => loadTexture(k, url))
  );
  const normalLoaded = [...NORMAL_FRAME_TYPES].every(k => texMap[k]);
  if (!results.some(Boolean) || !normalLoaded) {
    $('frameStageInfo').textContent = '⚠ 卡牌框图片加载失败';
    return;
  }
  setHsv(0.025, 0.85, 1.0, 'preset');
}
initFramePreview();
}
initCardFramePreview();

//
// === TEXT PREVIEW ONLY (dedicated page) ===
//
function initTextPreviewOnly() {
  const bbcodeInput = document.getElementById('bbcodeInput');
  const previewRender = document.getElementById('previewRender');
  const toast = document.getElementById('toast');

  if (!bbcodeInput || !previewRender) return;

  // ── Undo / Redo history ──
  const MAX_UNDO = 100;
  const undoStack = [bbcodeInput.value];
  let redoStack = [];
  let ignoreUndo = false;

  function pushUndo() {
    if (ignoreUndo) return;
    const val = bbcodeInput.value;
    if (undoStack[undoStack.length - 1] === val) return;
    undoStack.push(val);
    redoStack.length = 0;
    if (undoStack.length > MAX_UNDO) undoStack.shift();
  }

  function doUndo() {
    if (undoStack.length <= 1) return;
    redoStack.push(undoStack.pop());
    ignoreUndo = true;
    bbcodeInput.value = undoStack[undoStack.length - 1];
    bbcodeInput.dispatchEvent(new Event('input'));
    ignoreUndo = false;
  }

  function doRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack.pop();
    undoStack.push(next);
    ignoreUndo = true;
    bbcodeInput.value = next;
    bbcodeInput.dispatchEvent(new Event('input'));
    ignoreUndo = false;
  }

  // ── Variable injection state ──
  const VAR_NAMES = ['Damage','Block','Energy','Cards','Repeat','Heal','HpLoss','MaxHp','Gold',
    'CalculatedDamage','CalculatedBlock','Summon','Forge','Stars',
    'StrengthPower','DexterityPower','WeakPower','VulnerablePower','PoisonPower','DoomPower',
    'energyPrefix','Amount','OnPlayer','IsMultiplayer','PlayerCount','OwnerName','ApplierName',
    'TargetName','singleStarIcon','InCombat','IsTargeting','OnTable','IfUpgraded'];

  const VAR_STORAGE_KEY = 'tp-var-state';
  const TEXT_STORAGE_KEY = 'tp-text-state';

  const DEFAULTS = [
    { name: 'IsUpgraded', value: 'true' },
    { name: 'CalculationBase', value: '5' },
    { name: 'CalculatedBlock', value: '15' },
    { name: 'InCombat', value: 'true' },
  ];

  function loadVarState() {
    try {
      const saved = localStorage.getItem(VAR_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          // Ensure IsUpgraded is always present
          if (!parsed.some(v => v.name.trim() === 'IsUpgraded')) {
            parsed.unshift({ name: 'IsUpgraded', value: 'true' });
          }
          return parsed;
        }
      }
    } catch (_) { /* ignore corrupt data */ }
    return null; // no saved data → caller uses defaults
  }

  function saveVarState() {
    try {
      localStorage.setItem(VAR_STORAGE_KEY, JSON.stringify(varState));
    } catch (_) { /* storage full, ignore */ }
  }

  let varState = loadVarState() || DEFAULTS;

  // Variable names that should render as toggles instead of text inputs
  const BOOL_VARS = ['IsUpgraded', 'InCombat', 'IsTargeting', 'OnTable', 'IfUpgraded'];

  // ── Render ──
  function render() {
    let src = bbcodeInput.value.replace(/\\n/g, '[br]');

    // Determine if this card is in "upgraded" state
    const isUpgraded = varState.some(
      v => v.name === 'IsUpgraded' &&
           (v.value === 'true' || v.value === '1')
    );

    // Handle [ifupgrade] … [/ifupgrade] — show green when upgraded, hide otherwise
    if (isUpgraded) {
      src = src.replace(/\[ifupgrade\]/gi, '[green]');
      src = src.replace(/\[\/ifupgrade\]/gi, '[/green]');
    } else {
      src = src.replace(/\[ifupgrade\](.*?)\[\/ifupgrade\]/gis, '');
    }

    // Handle {VarName:diff()} — green when upgraded, plain otherwise
    if (isUpgraded) {
      src = src.replace(/\{(\w+):diff\(\)\}/gi, '[green]{$1}[/green]');
    } else {
      src = src.replace(/\{(\w+):diff\(\)\}/gi, '{$1}');
    }

    // Handle {VarName:list:joinSep|andJoinSep} — auto-split by first non-text char in value
    src = src.replace(/\{(\w+):list:([^|}]*)\|?([^}]*)\}/gi, (m, varName, joinSep, andJoinSep) => {
      const v = varState.find(x => x.name === varName);
      if (!v || !v.value) return '';
      // Find first non-alphanumeric, non-space, non-CJK character as splitter
      const splitterMatch = v.value.match(/[^a-zA-Z0-9\u4e00-\u9fff\s]/);
      const splitter = splitterMatch ? splitterMatch[0] : ',';
      const parts = v.value.split(splitter).map(s => s.trim()).filter(Boolean);
      if (parts.length === 0) return '';
      if (parts.length === 1) return parts[0];
      const sep = joinSep || splitter;
      if (andJoinSep) {
        return parts.slice(0, -1).join(sep) + andJoinSep + parts[parts.length - 1];
      }
      return parts.join(sep);
    });

    // Handle conditional variables: {VarName:show?:trueText|falseText} or {VarName:trueText|falseText}
    src = src.replace(/\{(\w+):(?:show:)?([^|]*)\|([^}]*)\}/gi, (m, varName, trueText, falseText) => {
      let truthy = false;
      if (varName === 'IfUpgraded') {
        truthy = isUpgraded;
      } else {
        const v = varState.find(x => x.name === varName);
        truthy = v && (v.value === 'true' || v.value === '1');
      }
      let result = truthy ? trueText : falseText;
      // Wrap IfUpgraded true-branch in green to match game behavior
      if (varName === 'IfUpgraded' && truthy) {
        result = '[green]' + result + '[/green]';
      }
      return result;
    });

    // Substitute injected variables: {Name} → value (case-sensitive)
    for (const v of varState) {
      if (!v.name) continue;
      const re = new RegExp('\\{' + v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\}', 'g');
      src = src.replace(re, v.value || '');
    }
    const html = bbcodeToHtml(src);
    previewRender.innerHTML = html || '&nbsp;';
    restartMegaTextFx();
  }

  // ── Load saved editor text ──
  try {
    const savedText = localStorage.getItem(TEXT_STORAGE_KEY);
    if (savedText !== null) bbcodeInput.value = savedText;
  } catch (_) {}

  // ── Input: snapshot + render + save ──
  bbcodeInput.addEventListener('input', () => {
    try { localStorage.setItem(TEXT_STORAGE_KEY, bbcodeInput.value); } catch (_) {}
    pushUndo();
    render();
  });
  render();

  // ── Quick-insert buttons ──
  document.querySelectorAll('[data-insert]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tmpl = btn.dataset.insert;
      const sel  = btn.dataset.select;
      const ta = bbcodeInput;
      ta.focus();
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const selText = ta.value.substring(start, end);
      let inserted;
      if (sel && selText) {
        inserted = tmpl.replace(sel, selText);
      } else if (sel) {
        inserted = tmpl.replace(sel, sel);
      } else {
        inserted = tmpl;
      }
      ta.setRangeText(inserted, start, end, 'end');
      ta.dispatchEvent(new Event('input'));

      // Auto-add missing injected variables as new rows
      const varMatches = inserted.match(/\{(\w+)(?::[^}]*)?\}/g);
      if (varMatches) {
        let changed = false;
        const names = new Set(varState.map(v => v.name.trim()));
        for (const match of varMatches) {
          const name = match.replace(/^\{/, '').replace(/\:.*/, '');
          if (name && !names.has(name)) {
            varState.push({ name, value: '' });
            saveVarState();
            names.add(name);
            changed = true;
          }
        }
        if (changed) renderVariableRows();
      }
    });
  });

  // ── Reference tabs ──
  document.querySelectorAll('.ref-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('.ref-tabs');
      if (!group) return;
      group.querySelectorAll('.ref-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetId = 'ref-' + tab.dataset.ref;
      const container = tab.closest('.panel');
      if (container) {
        container.querySelectorAll('.ref-panel').forEach(p => p.classList.remove('active'));
        const target = container.querySelector('#' + targetId);
        if (target) target.classList.add('active');
      }
    });
  });

  // ── Toast & copy ──
  function showToastForText(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  async function copyTextToClipboard(txt) {
    try {
      await navigator.clipboard.writeText(txt);
      showToastForText('已复制 BBCode');
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) showToastForText('已复制 BBCode');
      return ok;
    }
  }

  // ── Keyboard shortcuts ──
  bbcodeInput.addEventListener('keydown', e => {
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === 'Enter') {
      e.preventDefault();
      copyTextToClipboard(bbcodeInput.value);
      return;
    }

    if (e.key === 'Enter' && !ctrl) {
      e.preventDefault();
      const start = bbcodeInput.selectionStart;
      const end   = bbcodeInput.selectionEnd;
      bbcodeInput.setRangeText('\\n', start, end, 'end');
      bbcodeInput.dispatchEvent(new Event('input'));
      return;
    }

    if (ctrl && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      doUndo();
      return;
    }

    if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      doRedo();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = bbcodeInput.selectionStart;
      const end   = bbcodeInput.selectionEnd;
      bbcodeInput.setRangeText('  ', start, end, 'end');
      bbcodeInput.dispatchEvent(new Event('input'));
      return;
    }
  });

  // Editor copy button
  const copyEditorBtn = document.getElementById('copyEditorBtn');
  if (copyEditorBtn) {
    copyEditorBtn.addEventListener('click', async () => {
      await copyTextToClipboard(bbcodeInput.value);
    });
  }

  // ── Auto-resize (respect max-height) ──
  function autoResize(el) {
    el.style.height = 'auto';
    const max = parseFloat(getComputedStyle(el).maxHeight) || Infinity;
    el.style.height = Math.min(el.scrollHeight, max) + 'px';
  }
  bbcodeInput.addEventListener('input', () => autoResize(bbcodeInput));
  setTimeout(() => autoResize(bbcodeInput), 0);

  // ── Fold toggles for tag sections ──
  document.querySelectorAll('.tp-tag-fold-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.parentElement.querySelector('.tp-tag-fold-body');
      if (!body) return;
      const icon = header.querySelector('.tp-fold-icon');
      body.classList.toggle('collapsed');
      if (icon) icon.textContent = body.classList.contains('collapsed') ? '▶' : '▼';
    });
  });

  // ── Variable injection UI ──
  const varRowsEl = document.getElementById('varRows');
  const varEmptyHint = document.getElementById('varEmptyHint');

  // ── Drag-to-editor: drop variables onto textarea ──
  bbcodeInput.addEventListener('dragover', (e) => {
    if (e.dataTransfer.types.includes('text/x-var-name')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      bbcodeInput.classList.add('tp-editor-drop-hover');
    }
  });
  bbcodeInput.addEventListener('dragenter', (e) => {
    if (e.dataTransfer.types.includes('text/x-var-name')) {
      e.preventDefault();
      bbcodeInput.classList.add('tp-editor-drop-hover');
    }
  });
  bbcodeInput.addEventListener('dragleave', () => {
    bbcodeInput.classList.remove('tp-editor-drop-hover');
  });
  bbcodeInput.addEventListener('drop', (e) => {
    const varName = e.dataTransfer.getData('text/x-var-name');
    if (varName) {
      e.preventDefault();
      bbcodeInput.classList.remove('tp-editor-drop-hover');
      // Insert at cursor position (or end if no focus)
      const pos = bbcodeInput.selectionStart ?? bbcodeInput.value.length;
      bbcodeInput.setRangeText(varName, pos, pos, 'end');
      bbcodeInput.focus();
      bbcodeInput.dispatchEvent(new Event('input'));
      // Auto-add missing variable
      const match = varName.match(/^\{(\w+)\}$/);
      if (match) {
        const name = match[1];
        const names = new Set(varState.map(v => v.name.trim()));
        if (!names.has(name)) {
          varState.push({ name, value: '' });
          saveVarState();
          renderVariableRows();
        }
      }
    }
  });

  function hideVarDropdown() {
    document.querySelectorAll('.tp-var-dropdown').forEach(d => d.remove());
  }

  function showVarDropdown(input, matches) {
    hideVarDropdown();
    if (!matches.length) return;
    const wrap = input.closest('.tp-var-name-wrap');
    if (!wrap) return;
    const dd = document.createElement('div');
    dd.className = 'tp-var-dropdown';
    matches.forEach(name => {
      const item = document.createElement('div');
      item.className = 'tp-var-dropdown-item';
      item.textContent = '{' + name + '}';
      item.addEventListener('mousedown', e => { e.preventDefault(); input.value = name; input.dispatchEvent(new Event('input', {bubbles: true})); hideVarDropdown(); });
      dd.appendChild(item);
    });
    wrap.appendChild(dd);
  }

  function renderVariableRows() {
    varRowsEl.innerHTML = '';
    varState.forEach((v, idx) => {
      const row = document.createElement('div');
      row.className = 'tp-var-row';
      row.dataset.idx = idx;

      // Drag handle — only this element initiates row reorder
      const dragHandle = document.createElement('div');
      dragHandle.className = 'tp-var-drag-handle';
      dragHandle.textContent = '⠿';
      dragHandle.addEventListener('mousedown', () => { row.draggable = true; });
      dragHandle.addEventListener('mouseup', () => { row.draggable = false; });

      const nameWrap = document.createElement('div');
      nameWrap.className = 'tp-var-name-wrap';
      const nameInput = document.createElement('input');
      nameInput.className = 'tp-var-name-input';
      nameInput.type = 'text';
      nameInput.placeholder = 'Variable name';
      nameInput.value = v.name || '';
      nameInput.dataset.idx = idx;
      nameWrap.appendChild(nameInput);

      // Drag-to-editor handle
      const insertHandle = document.createElement('span');
      insertHandle.className = 'tp-var-insert-handle';
      insertHandle.title = 'Drag into editor to insert variable';
      insertHandle.textContent = '⊕';
      insertHandle.draggable = true;
      insertHandle.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/x-var-name', '{' + (v.name || '') + '}');
        e.dataTransfer.setData('text/plain', '{' + (v.name || '') + '}');
      });

      const isBool = BOOL_VARS.includes(v.name.trim());
      let valEl;
      if (isBool) {
        valEl = document.createElement('button');
        valEl.className = 'tp-var-toggle';
        const on = v.value === 'true';
        valEl.dataset.idx = idx;
        valEl.dataset.on = on ? 'true' : 'false';
        valEl.textContent = '';
        valEl.addEventListener('click', () => {
          const i = parseInt(valEl.dataset.idx);
          const newOn = varState[i].value !== 'true';
          varState[i].value = newOn ? 'true' : 'false';
          saveVarState();
          renderVariableRows();
          render();
        });
      } else {
        valEl = document.createElement('input');
        valEl.className = 'tp-var-value-input';
        valEl.type = 'text';
        valEl.placeholder = 'Value';
        valEl.value = v.value || '';
        valEl.dataset.idx = idx;
      }

      const btnGroup = document.createElement('div');
      btnGroup.className = 'tp-var-btn-group';

      const rmBtn = document.createElement('button');
      rmBtn.className = 'tp-var-remove';
      rmBtn.title = 'Remove';
      rmBtn.textContent = '✕';
      rmBtn.dataset.idx = idx;
      btnGroup.appendChild(rmBtn);

      row.appendChild(dragHandle);
      row.appendChild(nameWrap);
      row.appendChild(insertHandle);
      row.appendChild(valEl);
      row.appendChild(btnGroup);

      // Drag-and-drop event handlers for reordering
      row.addEventListener('dragstart', (e) => {
        row.classList.add('tp-var-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        row.classList.add('tp-var-drop-target');
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('tp-var-drop-target');
      });

      row.addEventListener('dragend', () => {
        row.draggable = false;
        document.querySelectorAll('.tp-var-row').forEach(r => {
          r.classList.remove('tp-var-dragging');
          r.classList.remove('tp-var-drop-target');
        });
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        document.querySelectorAll('.tp-var-row').forEach(r => {
          r.classList.remove('tp-var-dragging');
          r.classList.remove('tp-var-drop-target');
        });
        const oldIdx = parseInt(e.dataTransfer.getData('text/plain'));
        const newIdx = idx;
        if (!isNaN(oldIdx) && !isNaN(newIdx) && oldIdx !== newIdx) {
          const [moved] = varState.splice(oldIdx, 1);
          varState.splice(newIdx, 0, moved);
          saveVarState();
          renderVariableRows();
          render();
        }
      });

      varRowsEl.appendChild(row);
    });

    // Standalone add-button row (always visible, even when empty)
    const addRow = document.createElement('div');
    addRow.className = 'tp-var-add-row';
    const addBtn = document.createElement('button');
    addBtn.className = 'tp-var-add-btn';
    addBtn.textContent = '+ Add Variable';
    addBtn.addEventListener('click', addVariable);
    addRow.appendChild(addBtn);
    varRowsEl.appendChild(addRow);

    // Name input handlers with autocomplete
    varRowsEl.querySelectorAll('.tp-var-name-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.dataset.idx);
        const prev = varState[idx].name;
        varState[idx].name = inp.value;
        saveVarState();
        const val = inp.value;
        if (val) {
          showVarDropdown(inp, VAR_NAMES.filter(n => n.toLowerCase().includes(val.toLowerCase())));
        } else {
          hideVarDropdown();
        }
        // Re-render rows when name crosses bool/non-bool boundary
        const now = inp.value.trim();
        const wasBool = BOOL_VARS.includes(prev.trim());
        const isBool = BOOL_VARS.includes(now);
        if (wasBool !== isBool) {
          renderVariableRows();
        }
        render();
      });
      inp.addEventListener('blur', () => setTimeout(hideVarDropdown, 200));
      inp.addEventListener('focus', () => {
        const val = inp.value;
        if (val) showVarDropdown(inp, VAR_NAMES.filter(n => n.includes(val)));
      });
    });

    // Value input handlers
    varRowsEl.querySelectorAll('.tp-var-value-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.dataset.idx);
        varState[idx].value = inp.value;
        saveVarState();
        render();
      });
    });

    // Remove button handlers
    varRowsEl.querySelectorAll('.tp-var-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        varState.splice(idx, 1);
        saveVarState();
        renderVariableRows();
        render();
      });
    });
  }

  function addVariable() {
    varState.push({ name: '', value: '' });
    saveVarState();
    renderVariableRows();
    const inputs = varRowsEl.querySelectorAll('.tp-var-name-input');
    if (inputs.length) inputs[inputs.length-1].focus();
  }

  // Init variable rows
  renderVariableRows();
}

// Auto-start if on the text-preview page
if (document.querySelector('[data-text-preview-tool]')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextPreviewOnly);
  } else {
    initTextPreviewOnly();
  }
}

// Expose shared BBCode rendering for other tools (e.g. dialogue-preview)
globalThis.SpireBBCode = {
  toHtml: bbcodeToHtml,
  restartFx: restartMegaTextFx,
};
})();
