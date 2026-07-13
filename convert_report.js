const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, 'navneet_industries_internship_report.md');
const htmlPath = path.join(__dirname, 'navneet_industries_internship_report.html');

if (!fs.existsSync(mdPath)) {
  console.error("Markdown report not found at:", mdPath);
  process.exit(1);
}

const markdown = fs.readFileSync(mdPath, 'utf8');

// Simple regex-based markdown to HTML compiler
function compileMarkdown(md) {
  let html = '';
  const lines = md.split(/\r?\n/);
  let inList = false;
  let inCode = false;
  let codeLang = '';
  let codeContent = [];
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Blocks
    if (line.trim().startsWith('```')) {
      if (inCode) {
        // Close code block
        inCode = false;
        html += `<pre><code class="language-${codeLang}">${escapeHtml(codeContent.join('\n'))}</code></pre>\n`;
        codeContent = [];
      } else {
        // Open code block
        inCode = true;
        codeLang = line.trim().substring(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeContent.push(line);
      continue;
    }

    // Handle Tables
    if (line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
      continue;
    } else if (inTable) {
      inTable = false;
      html += renderTable(tableRows);
      tableRows = [];
    }

    // Handle Horizontal Rules / Page Breaks
    if (line.trim() === '---') {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<div class="page-break"></div>\n`;
      continue;
    }

    // Handle Headings
    if (line.startsWith('# ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h1>${parseInline(line.substring(2))}</h1>\n`;
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h2>${parseInline(line.substring(3))}</h2>\n`;
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h3>${parseInline(line.substring(4))}</h3>\n`;
      continue;
    }
    if (line.startsWith('#### ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h4>${parseInline(line.substring(5))}</h4>\n`;
      continue;
    }

    // Handle Lists
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      const itemContent = line.trim().substring(2);
      html += `  <li>${parseInline(itemContent)}</li>\n`;
      continue;
    } else {
      if (inList && line.trim() === '') {
        // Wait for next line to see if list continues
      } else if (inList && !line.trim().startsWith('* ') && !line.trim().startsWith('- ')) {
        html += '</ul>\n';
        inList = false;
      }
    }

    // Handle Blockquotes (Alerts)
    if (line.trim().startsWith('>')) {
      let quoteLine = line.trim().substring(1).trim();
      let alertClass = 'standard-blockquote';
      if (quoteLine.startsWith('[!IMPORTANT]')) {
        alertClass = 'alert-important';
        quoteLine = quoteLine.substring(12).trim();
      } else if (quoteLine.startsWith('[!NOTE]')) {
        alertClass = 'alert-note';
        quoteLine = quoteLine.substring(7).trim();
      } else if (quoteLine.startsWith('[!WARNING]')) {
        alertClass = 'alert-warning';
        quoteLine = quoteLine.substring(10).trim();
      }
      html += `<div class="blockquote-card ${alertClass}">${parseInline(quoteLine)}</div>\n`;
      continue;
    }

    // Handle normal paragraphs
    if (line.trim() !== '') {
      html += `<p>${parseInline(line)}</p>\n`;
    }
  }

  // Final cleanups
  if (inList) html += '</ul>\n';
  if (inTable) html += renderTable(tableRows);

  return html;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseInline(text) {
  // Replace Bold
  let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Replace Italics
  parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Replace Inline Code
  parsed = parsed.replace(/`(.*?)`/g, '<code>$1</code>');
  // Replace Markdown links
  parsed = parsed.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
  return parsed;
}

function renderTable(rows) {
  let tableHtml = '<table class="report-table">\n';
  let hasHeader = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].trim();
    if (row === '') continue;

    // Split columns
    const cols = row.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
    
    // Skip formatting row (e.g. | :--- | :--- |)
    if (row.includes(':---') || row.includes('---:')) {
      continue;
    }

    if (!hasHeader && i === 0) {
      tableHtml += '  <thead>\n    <tr>\n';
      cols.forEach(col => {
        tableHtml += `      <th>${parseInline(col)}</th>\n`;
      });
      tableHtml += '    </tr>\n  </thead>\n  <tbody>\n';
      hasHeader = true;
    } else {
      tableHtml += '    <tr>\n';
      cols.forEach(col => {
        tableHtml += `      <td>${parseInline(col)}</td>\n`;
      });
      tableHtml += '    </tr>\n';
    }
  }

  if (hasHeader) {
    tableHtml += '  </tbody>\n';
  }
  tableHtml += '</table>\n';
  return tableHtml;
}

const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yashpreet Kour - Internship Report - Navneet Industries</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --text-color: #1e293b;
      --heading-color: #0f172a;
      --border-color: #e2e8f0;
      --code-bg: #f8fafc;
      --accent-color: #2563eb;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--text-color);
      line-height: 1.6;
      font-size: 11pt;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }

    /* Print styling layout */
    .report-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }

    .page-break {
      page-break-before: always;
      margin-top: 40px;
      border: none;
      height: 1px;
    }

    /* Headings */
    h1, h2, h3, h4 {
      color: var(--heading-color);
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
    }

    h1 {
      font-size: 24pt;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 8px;
      margin-top: 0;
    }

    h2 {
      font-size: 16pt;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 4px;
    }

    h3 {
      font-size: 13pt;
    }

    h4 {
      font-size: 11pt;
    }

    p {
      margin-top: 0;
      margin-bottom: 1em;
      text-align: justify;
      text-justify: inter-word;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 1em;
      padding-left: 24px;
    }

    li {
      margin-bottom: 0.4em;
    }

    /* Tables */
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    .report-table th, .report-table td {
      border: 1px solid var(--border-color);
      padding: 8px 12px;
      text-align: left;
    }

    .report-table th {
      background-color: #f1f5f9;
      color: var(--heading-color);
      font-weight: 600;
    }

    .report-table tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* Code blocks */
    pre {
      background-color: var(--code-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 12px 16px;
      overflow-x: auto;
      margin: 1.5em 0;
      page-break-inside: avoid;
    }

    code {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 9pt;
      color: #0f172a;
    }

    p code, li code {
      background-color: var(--code-bg);
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      font-size: 9.5pt;
    }

    /* Alerts and Blockquotes */
    .blockquote-card {
      border-left: 4px solid var(--accent-color);
      background-color: #f8fafc;
      padding: 12px 16px;
      margin: 1.5em 0;
      border-radius: 0 6px 6px 0;
      font-size: 10.5pt;
    }

    .alert-important {
      border-left-color: #ef4444;
      background-color: #fef2f2;
    }

    .alert-note {
      border-left-color: #3b82f6;
      background-color: #eff6ff;
    }

    .alert-warning {
      border-left-color: #f59e0b;
      background-color: #fffbeb;
    }

    /* Title Page Formatting */
    .title-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 90vh;
      page-break-after: always;
      padding-top: 40px;
    }

    .title-page h1 {
      border: none;
      font-size: 22pt;
      margin-bottom: 20px;
      line-height: 1.3;
    }

    .title-page h2 {
      border: none;
      font-size: 14pt;
      margin-top: 10px;
      margin-bottom: 40px;
      font-weight: 500;
      color: #475569;
    }

    .title-page h3 {
      font-size: 13pt;
      font-weight: 600;
      margin-top: 5px;
      margin-bottom: 5px;
    }

    .title-page p {
      text-align: center;
      margin-bottom: 30px;
    }

    .meta-details {
      margin-top: 50px;
      text-align: left;
      width: 100%;
      max-width: 450px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px 24px;
      background-color: #fafafa;
    }

    .meta-details table {
      width: 100%;
      border-collapse: collapse;
    }

    .meta-details td {
      padding: 6px 0;
      vertical-align: top;
      font-size: 10.5pt;
    }

    .meta-details td:first-child {
      font-weight: 600;
      color: #475569;
      width: 160px;
    }

    /* Print media customization */
    @media print {
      body {
        font-size: 10pt;
        color: #000000;
      }
      .report-container {
        padding: 0;
        max-width: 100%;
      }
      .page-break {
        page-break-before: always;
        height: 0;
        margin: 0;
      }
      a {
        text-decoration: none;
        color: #000000;
      }
      pre, code, .report-table, .blockquote-card {
        page-break-inside: avoid;
      }
      thead {
        display: table-header-group;
      }
      tr {
        page-break-inside: avoid;
      }
      @page {
        size: A4;
        margin: 20mm;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    ${compileMarkdown(markdown)}
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, styledHtml, 'utf8');
console.log("Successfully compiled Markdown report to styled HTML:", htmlPath);
