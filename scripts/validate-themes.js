#!/usr/bin/env node
// Checks every themes/<name>/<name>.json against the extension's own schema.
// Run: node scripts/validate-themes.js
const fs = require('fs');
const path = require('path');
const { normalize } = require('../extension/schema.js');

const root = path.join(__dirname, '..', 'themes');
let failed = 0, count = 0;

for (const dir of fs.readdirSync(root, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const name = dir.name;
  const problems = [];
  const file = path.join(root, name, `${name}.json`);
  if (!fs.existsSync(file)) problems.push(`missing ${name}.json`);
  if (!['png', 'jpg', 'jpeg', 'webp', 'gif'].some(ext => fs.existsSync(path.join(root, name, `preview.${ext}`))))
    console.log(`! ${name}: no preview image yet, a placeholder will be shown`);

  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (data.format !== 'youtube-theme-studio') problems.push('format must be "youtube-theme-studio"');
      if (![1, 2, 3].includes(data.version)) problems.push('version must be 1, 2 or 3');
      if (!data.settings || typeof data.settings !== 'object') problems.push('settings object missing');
      else {
        const clean = normalize(data.settings);
        for (const [k, v] of Object.entries(data.settings)) {
          if (!(k in clean)) problems.push(`unknown setting "${k}"`);
          else if (typeof v !== 'object' && clean[k] !== v && !(typeof v === 'string' && clean[k] === v.toLowerCase()))
            problems.push(`setting "${k}" = ${JSON.stringify(v)} is invalid (would become ${JSON.stringify(clean[k])})`);
        }
      }
      const m = data.meta;
      if (!m || typeof m !== 'object') problems.push('add a "meta" block with name, description, author, tags, added');
      else {
        if (typeof m.name !== 'string' || !m.name.trim()) problems.push('meta.name is required');
        if (m.description !== undefined && typeof m.description !== 'string') problems.push('meta.description must be text');
        if (m.author !== undefined && !/^[a-z0-9-]{1,39}$/i.test(m.author)) problems.push('meta.author must be a GitHub username');
        if (m.tags !== undefined && (!Array.isArray(m.tags) || m.tags.some(t => typeof t !== 'string'))) problems.push('meta.tags must be a list of words');
        if (m.added !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(m.added)) problems.push('meta.added must look like 2026-11-28');
      }
      if (data.profiles && !Array.isArray(data.profiles)) problems.push('profiles must be an array');
      for (const p of data.profiles || []) if (!/^[a-z0-9-]{1,80}$/i.test(p.id || '')) problems.push(`profile id "${p.id}" must be letters, numbers and dashes`);
      if (fs.statSync(file).size > 5 * 1024 * 1024) problems.push('theme file is over 5 MB; keep big backgrounds out of the repo');
    } catch (e) { problems.push(`invalid JSON: ${e.message}`); }
  }

  count++;
  if (problems.length) { failed++; console.log(`✗ ${name}\n  - ${problems.join('\n  - ')}`); }
  else console.log(`✓ ${name}`);
}

console.log(`\n${count - failed}/${count} themes valid`);
process.exit(failed ? 1 : 0);
