// This script minifies the website and put in sauce/ directory
import type { BunFile } from "bun";
import { minify } from "terser";
import { readdir } from "node:fs/promises";
import { extname, join } from 'node:path';

const minifiers: Minifiers = {
  async js(file) {
    const result = await minify(await file.text(), {
      compress: {
        unsafe: true,
        arrows: true,
        booleans_as_integers: true,
        comparisons: true,
        dead_code: true
      }
    });
    return result.code;
  },
  async html(file) {
    return await fetch(
      new URL("/developers/html-minifier/api/raw", "https://www.toptal.com"),
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:
          "input=" +
          encodeURIComponent(
            await file.text()
          ),
      }
    )
      .then(e => e.text())
  },
  async css(file) {
    return await fetch(
      new URL("/developers/cssminifier/api/raw", "https://www.toptal.com"),
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:
          "input=" +
          encodeURIComponent(
            await file.text()
          ),
      }
    )
      .then(e => e.text())
  },
  async json(file) {
    return JSON.stringify(await file.json());
  }
}

const minList = Object.keys(minifiers);
const dir = await readdir('sauce/', { withFileTypes: true });
const files = dir.filter(e => minList.includes(extname(e.name).substring(1)) && !e.isDirectory()).map(e => e.name);
console.log('Building website...');
for (const file of files) {
  (async function () {
    const bf = Bun.file(join('sauce/', file));
    try {
      const ts = Date.now();
      const res = await minifiers[extname(file).substring(1)](bf);
      await Bun.write(join('sauce/min/', file), res);
      console.log('✅ Minified', file, `(${Date.now() - ts}ms)`);
    } catch {
      console.error('❌ Error minifying', file);
      await Bun.write(join('sauce/min/', file), await bf.text());
    }
  })()
}

type Minifiers = {
  [key: string]: (file: BunFile) => Promise<any>
}