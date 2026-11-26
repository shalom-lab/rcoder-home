import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const expected = ['deepseek','openai','gemini','claude','qwen','kimi','minimax','zhipu','siliconflow','ollama'];
for (const page of ['docs/index.html', 'docs/en/index.html']) {
  const html = readFileSync(page, 'utf8');
  const list = html.match(/<ul class="models-list" id="models-list" role="list">([\s\S]*?)<\/ul>/);
  assert.ok(list, page);
  const logos = [...list[1].matchAll(/<img src="([^"]+\/models\/([a-z]+)\.svg)"[^>]*alt="">\s*<span>([^<]+)<\/span>/g)];
  assert.deepEqual(logos.map(m => m[2]), expected, page);
  assert.equal(new Set(logos.map(m => m[3])).size, expected.length, page);
  for (const [, src] of logos) assert.ok(statSync(resolve(dirname(page), src)).size > 0, src);
  const titles = [...html.matchAll(/data-hero-line="(\d+)"[^>]*>(.*?)<\/span>\s*(?:\r?\n|$)/g)];
  assert.deepEqual(titles.map(m => Number(m[1])), Array.from({length:14}, (_,i) => i), page);
  const full = titles.map(m => m[2].replace(/<[^>]+>/g, '').trim());
  assert.equal(new Set(full).size, 14, page);
}
console.log('Both locales: ten named model brands and 14 unique hero lines.');
