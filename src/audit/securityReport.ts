import { NetworkRequest, SecurityGrade } from '../types/index.js';

export function calculateAverageGrade(scores: number[]): { score: number; grade: SecurityGrade } {
  if (scores.length === 0) return { score: 100, grade: 'A+' };
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  let grade: SecurityGrade = 'F';
  if (avg >= 95) grade = 'A+';
  else if (avg >= 85) grade = 'A';
  else if (avg >= 70) grade = 'B';
  else if (avg >= 55) grade = 'C';
  else if (avg >= 40) grade = 'D';
  return { score: avg, grade };
}

/**
 * Generates a GitHub-flavored Markdown security compliance report
 */
export function generateMarkdownSecurityReport(requests: NetworkRequest[]): string {
  const audited = requests.filter(r => r.securityAudit);
  const scores = audited.map(r => r.securityAudit!.score);
  const { score: avgScore, grade: overallGrade } = calculateAverageGrade(scores);

  const lines: string[] = [
    '# APIScope — OWASP HTTP Security Compliance Report',
    '',
    `*Generated on:* ${new Date().toUTCString()}`,
    `*Total Endpoints Analyzed:* ${audited.length}`,
    `*Overall Security Grade:* **${overallGrade}** (${avgScore}/100)`,
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    '| Metric | Value | Status |',
    '| :--- | :--- | :--- |',
    `| **Overall Compliance Score** | ${avgScore} / 100 | ${overallGrade} |`,
    `| **Analyzed Requests** | ${audited.length} | - |`,
    `| **Endpoints with Critical Warnings** | ${audited.filter(r => r.securityAudit!.grade === 'F' || r.securityAudit!.grade === 'D').length} | ${audited.some(r => r.securityAudit!.grade === 'F') ? '⚠️ Requires Attention' : '✅ Optimal'} |`,
    '',
    '---',
    '',
    '## Tested Endpoints & Audit Results',
    '',
    '| Method | URL Path | Status | Grade | Score | Issues Found |',
    '| :--- | :--- | :--- | :--- | :--- | :--- |',
  ];

  for (const r of audited) {
    const audit = r.securityAudit!;
    const fails = audit.findings.filter(f => f.status === 'fail').length;
    const warns = audit.findings.filter(f => f.status === 'warning').length;
    const issues = fails > 0 ? `🚨 ${fails} fails` : warns > 0 ? `⚠️ ${warns} warns` : '✅ Clean';
    lines.push(`| \`${r.method}\` | \`${r.path}\` | \`${r.status}\` | **${audit.grade}** | ${audit.score} | ${issues} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Detailed Findings & OWASP Remediation');
  lines.push('');

  let findingCounter = 1;
  for (const r of audited) {
    const criticals = r.securityAudit!.findings.filter(f => f.status === 'fail' || f.status === 'warning');
    if (criticals.length === 0) continue;

    lines.push(`### ${findingCounter++}. Endpoint: \`${r.method} ${r.path}\` (Grade: ${r.securityAudit!.grade})`);
    lines.push(`**Full URL:** \`${r.url}\``);
    lines.push('');

    for (const f of criticals) {
      const badge = f.status === 'fail' ? '🔴 **FAIL**' : '🟡 **WARNING**';
      lines.push(`- ${badge}: **${f.title}** (\`${f.header}\`)`);
      lines.push(`  - *Description:* ${f.description}`);
      lines.push(`  - *Remediation:* ${f.recommendation}`);
      lines.push(`  - *Score Impact:* -${f.scoreImpact} pts`);
      lines.push('');
    }
  }

  // PII Warnings section if any exist
  const piiRequests = requests.filter(r => r.piiWarnings && r.piiWarnings.length > 0);
  if (piiRequests.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## ⚠️ Data Leakage & PII Alerts');
    lines.push('');
    for (const pr of piiRequests) {
      lines.push(`- **${pr.method} ${pr.path}**:`);
      for (const w of pr.piiWarnings!) {
        lines.push(`  - \`[${w.severity.toUpperCase()}]\` **${w.field}**: ${w.message}`);
        lines.push(`  - *Sample Snippet:* \`${w.maskedSnippet}\``);
        lines.push(`  - *Fix:* ${w.recommendation}`);
      }
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('*Report compiled by APIScope Security Auditor (Chromium MV3 / OWASP ASVS aligned).*');

  return lines.join('\n');
}

/**
 * Generates a standalone styled HTML report
 */
export function generateHtmlSecurityReport(requests: NetworkRequest[]): string {
  const audited = requests.filter(r => r.securityAudit);
  const scores = audited.map(r => r.securityAudit!.score);
  const { score: avgScore, grade: overallGrade } = calculateAverageGrade(scores);

  const gradeColor = (g: SecurityGrade) => {
    switch (g) {
      case 'A+': case 'A': return '#10b981';
      case 'B': return '#06b6d4';
      case 'C': return '#f59e0b';
      case 'D': return '#f97316';
      case 'F': return '#ef4444';
      default: return '#64748b';
    }
  };

  const rows = audited.map(r => {
    const a = r.securityAudit!;
    const failCount = a.findings.filter(f => f.status === 'fail').length;
    const warnCount = a.findings.filter(f => f.status === 'warning').length;
    return `
      <tr>
        <td><span class="badge method-${r.method.toLowerCase()}">${r.method}</span></td>
        <td class="mono font-bold">${escapeHtml(r.path)}</td>
        <td class="mono">${r.status}</td>
        <td><span class="grade-pill" style="background:${gradeColor(a.grade)}20;color:${gradeColor(a.grade)};border:1px solid ${gradeColor(a.grade)}40;">${a.grade}</span></td>
        <td class="mono font-bold">${a.score}/100</td>
        <td>${failCount > 0 ? `<span class="text-danger">● ${failCount} fails</span> ` : ''}${warnCount > 0 ? `<span class="text-warn">▲ ${warnCount} warns</span>` : failCount === 0 ? '<span class="text-success">✔ Clean</span>' : ''}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>APIScope Security Compliance Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #090d16; color: #f1f5f9; margin: 0; padding: 40px 20px; line-height: 1.5; }
    .container { max-width: 960px; margin: 0 auto; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 24px; color: #38bdf8; }
    .subtitle { color: #94a3b8; font-size: 14px; margin-top: 4px; }
    .score-circle { width: 90px; height: 90px; border-radius: 50%; border: 3px solid ${gradeColor(overallGrade)}; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${gradeColor(overallGrade)}15; }
    .score-grade { font-size: 32px; font-weight: 800; color: ${gradeColor(overallGrade)}; line-height: 1; }
    .score-label { font-size: 11px; color: #94a3b8; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th { text-align: left; padding: 10px 12px; background: #1e293b; color: #94a3b8; border-bottom: 2px solid #334155; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 12px; border-bottom: 1px solid #1e293b; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; font-family: monospace; }
    .method-get { background: #1e3a8a; color: #93c5fd; }
    .method-post { background: #064e3b; color: #6ee7b7; }
    .method-put { background: #78350f; color: #fde68a; }
    .method-delete { background: #7f1d1d; color: #fca5a5; }
    .grade-pill { padding: 2px 10px; border-radius: 9999px; font-weight: 800; font-family: monospace; font-size: 13px; }
    .text-danger { color: #f87171; font-weight: 600; }
    .text-warn { color: #fbbf24; font-weight: 600; }
    .text-success { color: #34d399; font-weight: 600; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div>
          <h1>APIScope — OWASP Security Report</h1>
          <div class="subtitle">Generated on ${new Date().toUTCString()} &bull; Total calls: ${audited.length}</div>
        </div>
        <div class="score-circle">
          <div class="score-grade">${overallGrade}</div>
          <div class="score-label">${avgScore}/100</div>
        </div>
      </div>

      <h2>Audit Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Status</th>
            <th>Grade</th>
            <th>Score</th>
            <th>Findings</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <div class="footer">
      Generated automatically by APIScope Extension &bull; Chromium MV3 & OWASP Top 10 Aligned
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
