/* Pull every photo off the wall at full resolution, for the slideshow.
 *
 *     node tools/download-photos.js [destination folder]
 *
 * Default destination is ./photo-export. Files are named so they sort into
 * the order they were posted, which is the order you want on a screen:
 *
 *     001_2026-10-05_0742.jpg
 *
 * Re-running skips anything already downloaded, so you can run it Monday
 * night and again Tuesday without fetching Monday's photos twice.
 *
 * This is the reliable path for a big export. The admin panel in the wall
 * also offers a ZIP, which is handier on a phone but holds the whole archive
 * in the browser while it builds.
 */
const fs = require("fs");
const path = require("path");

const DB = "https://cgp-partners-inv-2026.firebaseio.com";
const DEST = path.resolve(process.argv[2] || "photo-export");

const stamp = (ts) => {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_` +
         `${p(d.getHours())}${p(d.getMinutes())}`;
};

(async () => {
  const res = await fetch(`${DB}/photos.json`);
  if (!res.ok) throw new Error("could not read the photo list: " + res.status);
  const photos = (await res.json()) || {};

  const list = Object.entries(photos)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));

  if (!list.length) {
    console.log("no photos on the wall yet");
    return;
  }

  fs.mkdirSync(DEST, { recursive: true });
  console.log(`${list.length} photo${list.length === 1 ? "" : "s"} -> ${DEST}\n`);

  let got = 0, skipped = 0, failed = 0, bytes = 0;

  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const name = `${String(i + 1).padStart(3, "0")}_${stamp(p.ts)}.jpg`;
    const out = path.join(DEST, name);

    if (fs.existsSync(out)) { skipped++; console.log(`  skip  ${name}`); continue; }

    const url = p.full || p.dataUrl;
    if (!url) { failed++; console.log(`  FAIL  ${name}  no url on this record`); continue; }

    try {
      /* Pre-Storage records held the image inline as a data URL. */
      if (url.startsWith("data:")) {
        fs.writeFileSync(out, Buffer.from(url.split(",")[1], "base64"));
      } else {
        const r = await fetch(url);
        if (!r.ok) throw new Error("http " + r.status);
        fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
      }
      const kb = Math.round(fs.statSync(out).size / 1024);
      bytes += fs.statSync(out).size;
      got++;
      console.log(`  ok    ${name}  ${p.w || "?"}x${p.h || "?"}  ${kb}KB`);
    } catch (e) {
      failed++;
      console.log(`  FAIL  ${name}  ${e.message}`);
    }
  }

  console.log(`\ndownloaded ${got}, skipped ${skipped}, failed ${failed}` +
    `, ${Math.round(bytes / 1024 / 1024 * 10) / 10}MB this run`);
})();
