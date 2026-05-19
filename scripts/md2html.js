const fs = require('fs');
const path = require('path');
const marked = require('marked').marked;

const mdPath = path.resolve(__dirname, '..', '.trae', 'documents', 'YT-MES-技术方案设计-v5.md');
const htmlPath = path.resolve(__dirname, '..', '.trae', 'documents', 'YT-MES-技术方案设计-v6.0.html');

const md = fs.readFileSync(mdPath, 'utf-8');

marked.setOptions({
  gfm: true,
  breaks: true,
});

let body = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YT-MES 电芯生产追溯系统 — 技术方案设计 v6.0</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #1a1a2e;
      --code-bg: #f4f4f5;
      --table-border: #d0d0d0;
      --table-head: #f0f4f8;
      --table-stripe: #fafbfc;
      --link: #2563eb;
      --blockquote: #e8f0fe;
      --blockquote-border: #2563eb;
      --hr: #e5e7eb;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Microsoft YaHei", sans-serif;
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      font-size: 15px;
    }
    h1 {
      font-size: 2rem;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 0.6rem;
      margin-top: 0;
    }
    h2 {
      font-size: 1.5rem;
      border-bottom: 2px solid var(--hr);
      padding-bottom: 0.4rem;
      margin-top: 2.5rem;
    }
    h3 {
      font-size: 1.2rem;
      margin-top: 2rem;
    }
    h4 {
      font-size: 1.05rem;
      margin-top: 1.5rem;
      color: #374151;
    }
    p { margin: 0.8rem 0; }
    a { color: var(--link); text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      background: var(--code-bg);
      padding: 0.15em 0.4em;
      border-radius: 4px;
      font-size: 0.9em;
      font-family: "Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace;
    }
    pre {
      background: #1e293b;
      color: #e2e8f0;
      padding: 1.2rem;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.88em;
      line-height: 1.55;
    }
    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0 1.5rem;
      font-size: 0.92em;
    }
    th, td {
      border: 1px solid var(--table-border);
      padding: 0.55rem 0.8rem;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: var(--table-head);
      font-weight: 600;
      white-space: nowrap;
    }
    tr:nth-child(even) td { background: var(--table-stripe); }
    blockquote {
      margin: 1rem 0;
      padding: 0.6rem 1.2rem;
      background: var(--blockquote);
      border-left: 4px solid var(--blockquote-border);
      border-radius: 0 6px 6px 0;
      color: #374151;
    }
    blockquote p { margin: 0.4rem 0; }
    hr {
      border: none;
      border-top: 1px solid var(--hr);
      margin: 2rem 0;
    }
    ul, ol { padding-left: 1.5rem; }
    li { margin: 0.3rem 0; }
    strong { color: #111827; }
    @media print {
      body { max-width: none; padding: 0; font-size: 13px; }
      pre { white-space: pre-wrap; word-break: break-all; }
      h1, h2 { page-break-after: avoid; }
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('Done:', htmlPath);
