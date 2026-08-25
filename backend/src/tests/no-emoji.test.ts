import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else if (/\.(tsx?|css|html)$/.test(file)) {
      results.push(filePath);
    }
  });
  return results;
}

const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

describe('No Emoji Compliance Guard', () => {
  it('should verify zero emoji characters exist across frontend source files', () => {
    const frontendSrcDir = path.join(__dirname, '../frontend/src');
    if (!fs.existsSync(frontendSrcDir)) return;

    const files = getFilesRecursively(frontendSrcDir);
    const violations: { file: string; match: string }[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const match = content.match(emojiRegex);
      if (match) {
        violations.push({ file: path.basename(file), match: match[0] });
      }
    });

    expect(violations).toEqual([]);
  });
});
