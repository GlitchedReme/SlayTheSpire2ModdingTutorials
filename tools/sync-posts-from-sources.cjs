#!/usr/bin/env node
/**
 * Sync tutorial README.md files into Hexo source/_posts.
 * Front-matter `date` is never overwritten once present; new posts get git creation time.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const LANG = (function () {
  const idx = process.argv.indexOf("--lang");
  return idx >= 0 ? process.argv[idx + 1] : null;
})();
const IS_EN = LANG === "en";
const POSTS_DIR = IS_EN
  ? path.join(ROOT, "source", "_posts", "en")
  : path.join(ROOT, "source", "_posts");
const IMAGES_SRC = path.join(ROOT, "images");
const IMAGES_DST = path.join(ROOT, "source", "images");
const MANIFEST = IS_EN
  ? path.join(__dirname, "posts-manifest-en.json")
  : path.join(__dirname, "posts-manifest.json");

function readManifestEntries(manifest) {
  const entries = [];
  entries.push(manifest.home);
  entries.push(...manifest.basics);
  entries.push(manifest.baselib.overview, ...manifest.baselib.articles);
  entries.push(manifest.ritsulib.overview);
  for (const chapter of manifest.ritsulib.chapters) {
    entries.push(...chapter.articles);
  }
  entries.push(...manifest.migrations, ...manifest.visuals);
  return entries;
}

function formatGitDate(gitOutput) {
  const m = gitOutput.trim().match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
  return m ? m[1] : null;
}

function getGitCreationDate(repoRelativePath) {
  if (!repoRelativePath) return null;
  const normalized = repoRelativePath.replace(/\\/g, "/");
  try {
    const out = execFileSync(
      "git",
      ["log", "--diff-filter=A", "--format=%ai", "-1", "--", normalized],
      { cwd: ROOT, encoding: "utf8" }
    );
    return formatGitDate(out);
  } catch {
    return null;
  }
}

function parseFrontMatter(text) {
  text = text.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) return { meta: null, body: text };
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return { meta: null, body: text };
  const raw = text.slice(4, end);
  const body = text.slice(end + 5);
  const meta = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    if (key === "categories") continue;
    meta[key] = value.trim();
  }
  const categories = [];
  const catBlock = raw.match(/categories:\s*\n((?:\s*-\s*.+\n?)+)/);
  if (catBlock) {
    for (const line of catBlock[1].split("\n")) {
      const c = line.match(/^\s*-\s*(.+)\s*$/);
      if (c) categories.push(c[1]);
    }
  }
  if (categories.length) meta.categories = categories;
  return { meta, body };
}

function resolveDate(entry, existingMeta, postRelative) {
  if (existingMeta?.date) {
    return existingMeta.date;
  }
  const postRepoPath = `source/_posts/${postRelative.replace(/\\/g, "/")}`;
  return (
    getGitCreationDate(postRepoPath) ||
    getGitCreationDate(entry.source) ||
    null
  );
}

function formatFrontMatter(entry, existingMeta, postRelative) {
  const title = existingMeta?.title || entry.title;
  const date = resolveDate(entry, existingMeta, postRelative);
  const permalink = existingMeta?.permalink || entry.permalink;
  const categories =
    existingMeta?.categories ??
    (entry.categories !== undefined ? entry.categories : ["Basics"]);
  const author = existingMeta?.author ?? entry.author;

  const lines = ["---", `title: ${title}`];
  if (date) lines.push(`date: ${date}`);
  lines.push(`permalink: ${permalink}`);
  if (author) lines.push(`author: ${author}`);
  if (categories && categories.length) {
    lines.push("categories:");
    for (const c of categories) lines.push(`- ${c}`);
  }
  lines.push("---", "");
  return lines.join("\r\n");
}

function imagePrefixForPermalink(permalink) {
  if (!permalink || permalink === "/") return "images/";
  const depth = permalink.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).length;
  return `${"../".repeat(depth)}images/`;
}

function transformBody(body, entry, permalinkMap) {
  const prefix = imagePrefixForPermalink(entry.permalink);
  let out = body.replace(/(\.\.\/)+images\//g, prefix);
  out = out.replace(/src="images\//g, `src="${prefix}`);
  out = out.replace(/src='images\//g, `src='${prefix}`);
  out = out.replace(/\]\(images\//g, `](${prefix}`);

  for (const [from, to] of permalinkMap) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\]\\(${escaped}[^)]*\\)`, "g"), `](${to})`);
    out = out.replace(new RegExp(`\\]\\(${escaped}#([^)]+)\\)`, "g"), `](${to}#$1)`);
  }

  return out.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n").trimEnd() + "\r\n";
}

function buildPermalinkMap(entries) {
  const map = [];
  map.push(["../README.md", IS_EN ? "/en/" : "/"]);
  map.push(["../../README.md", IS_EN ? "/en/" : "/"]);
  map.push(["../README.md#", IS_EN ? "/en/#" : "/#"]);
  map.push(["../../README.md#", IS_EN ? "/en/#" : "/#"]);
  for (const e of entries) {
    const dir = path.dirname(e.source).replace(/\\/g, "/");
    const permalink = e.permalink.startsWith("/") ? e.permalink : `/${e.permalink}`;
    map.push([`../${path.basename(dir)}/README.md`, permalink]);
    map.push([`./README.md`, permalink]);
  }
  return map;
}

function walkMarkdownFiles(dir) {
  const results = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkMarkdownFiles(full));
    } else if (name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

function rewritePostDate(postPath, date) {
  const content = fs.readFileSync(postPath, "utf8");
  const { meta, body } = parseFrontMatter(content);
  if (!meta) return false;
  meta.date = date;
  const postRelative = path.relative(POSTS_DIR, postPath).replace(/\\/g, "/");
  const front = formatFrontMatter(
    {
      title: meta.title,
      permalink: meta.permalink,
      categories: meta.categories,
      author: meta.author,
    },
    meta,
    postRelative
  );
  fs.writeFileSync(postPath, `${front}${body}`, "utf8");
  return true;
}

function buildPostToSourceMap(manifest) {
  const map = new Map();
  for (const entry of readManifestEntries(manifest)) {
    map.set(entry.post.replace(/\\/g, "/"), entry.source);
  }
  return map;
}

/** Restore all post dates from git first-commit (overwrites current date). */
function restorePostDatesFromGit() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const postToSource = buildPostToSourceMap(manifest);
  const files = walkMarkdownFiles(POSTS_DIR);
  let updated = 0;
  let skipped = 0;

  for (const postPath of files) {
    const rel = path.relative(ROOT, postPath).replace(/\\/g, "/");
    const postKey = path.relative(POSTS_DIR, postPath).replace(/\\/g, "/");
    let gitDate = getGitCreationDate(rel);
    if (!gitDate) {
      const source = postToSource.get(postKey);
      if (source) gitDate = getGitCreationDate(source);
    }
    if (!gitDate) {
      console.warn(`[skip] no git history: ${rel}`);
      skipped++;
      continue;
    }
    const { meta } = parseFrontMatter(fs.readFileSync(postPath, "utf8"));
    if (meta?.date === gitDate) {
      console.log(`[keep] ${rel} (${gitDate})`);
      continue;
    }
    rewritePostDate(postPath, gitDate);
    console.log(`[restore] ${rel} -> ${gitDate}`);
    updated++;
  }

  console.log(`\nRestored ${updated} dates, skipped ${skipped}.`);
}

function syncEntry(entry, permalinkMap) {
  const srcPath = path.join(ROOT, entry.source);
  if (!fs.existsSync(srcPath)) {
    console.warn(`[skip] missing source: ${entry.source}`);
    return false;
  }

  const postPath = path.join(POSTS_DIR, entry.post);
  fs.mkdirSync(path.dirname(postPath), { recursive: true });

  const srcBody = fs.readFileSync(srcPath, "utf8");
  let existingMeta = null;
  if (fs.existsSync(postPath)) {
    existingMeta = parseFrontMatter(fs.readFileSync(postPath, "utf8")).meta;
  }

  const transformed = transformBody(srcBody, entry, permalinkMap);
  const front = formatFrontMatter(entry, existingMeta, entry.post);
  fs.writeFileSync(postPath, `${front}${transformed}`, "utf8");
  console.log(`[ok] ${entry.source} -> ${entry.post}`);
  return true;
}

function copyImages() {
  if (!fs.existsSync(IMAGES_SRC)) return;
  fs.mkdirSync(IMAGES_DST, { recursive: true });
  for (const name of fs.readdirSync(IMAGES_SRC)) {
    const from = path.join(IMAGES_SRC, name);
    const to = path.join(IMAGES_DST, name);
    const stat = fs.statSync(from);
    if (stat.isDirectory()) {
      fs.cpSync(from, to, { recursive: true, force: true });
    } else {
      fs.copyFileSync(from, to);
    }
  }
  console.log("[ok] images -> source/images");
}

function main() {
  if (process.argv.includes("--restore-dates")) {
    restorePostDatesFromGit();
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const entries = readManifestEntries(manifest);
  const permalinkMap = buildPermalinkMap(entries);

  copyImages();

  let ok = 0;
  for (const entry of entries) {
    if (syncEntry(entry, permalinkMap)) ok++;
  }

  console.log(`\nSynced ${ok}/${entries.length} posts.`);
}

main();
