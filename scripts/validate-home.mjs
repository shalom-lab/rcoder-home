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
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)[1];
  const meta = Object.fromEntries([...html.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]+)">/g)].map(m => [m[1],m[2]]));
  assert.equal(meta.robots,'noindex, follow',page);
  assert.equal(meta['og:url'],canonical,page);
  assert.equal(meta['og:type'],'website',page);
  assert.equal(meta['og:locale'],page.includes('/en/') ? 'en_US' : 'zh_CN',page);
  assert.equal(meta['twitter:card'],'summary_large_image',page);
  assert.equal(meta['twitter:image'],meta['og:image'],page);
  assert.equal(meta['twitter:image:alt'],meta['og:image:alt'],page);
  assert.equal(meta['og:image:width'],'1200',page);
  assert.equal(meta['og:image:height'],'630',page);
  const image = new URL(meta['og:image']);
  assert.equal(image.protocol,'https:',page);
  assert.equal(image.origin,new URL(canonical).origin,page);
  assert.equal(image.pathname.split('/').at(-1),page.includes('/en/') ? 'share-en.jpg' : 'share-zh.jpg',page);
  assert.ok(statSync(resolve('docs/assets',image.pathname.split('/').at(-1))).size > 0,page);
  assert.ok(meta.description && meta['og:title'] && meta['og:description'] && meta['og:image:alt'],page);
  const titles = [...html.matchAll(/data-hero-line="(\d+)"[^>]*>(.*?)<\/span>\s*(?:\r?\n|$)/g)];
  assert.deepEqual(titles.map(m => Number(m[1])), Array.from({length:14}, (_,i) => i), page);
  const full = titles.map(m => m[2].replace(/<[^>]+>/g, '').trim());
  assert.equal(new Set(full).size, 14, page);
}
console.log('Both locales: share metadata and artwork, ten named model brands, and 14 unique hero lines.');
