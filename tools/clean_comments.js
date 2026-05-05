const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const exts = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.md'];
const IGNORE_DIRS = ['node_modules', '.git', 'client/dist', 'client/build'];

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (IGNORE_DIRS.includes(name)) continue;
      files.push(...walk(full));
    } else {
      if (exts.includes(path.extname(name))) files.push(full);
    }
  }
  return files;
}

function cleanFile(file) {
  let changed = false;
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const out = [];
  let inBlock = false;
  for (let line of lines) {
    const t = line.trim();
    if (!inBlock && (t.startsWith('//') || t.startsWith('<!--'))) {
      changed = true;
      continue;
    }
    if (!inBlock && t.startsWith('/*')) {
      inBlock = true;
      changed = true;
      if (t.endsWith('*/')) {
        inBlock = false;
      }
      continue;
    }
    if (inBlock) {
      changed = true;
      if (t.endsWith('*/')) inBlock = false;
      continue;
    }
    out.push(line);
  }
  if (changed) {
    fs.writeFileSync(file, out.join('\n'));
    console.log('Cleaned', path.relative(ROOT, file));
  }
}

const files = walk(ROOT);
for (const f of files) {
  // skip the script itself
  if (path.basename(f) === path.basename(__filename)) continue;
  cleanFile(f);
}
console.log('Done');
