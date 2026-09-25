/* Build data/teams.json and data/sponsors.json from the master roster xlsx.
 *
 *   node tools/build-roster.js "/path/to/PI ROSTER.xlsx"
 *
 * Rerun this whenever Carol sends an updated roster. Do NOT hand edit the two
 * JSON files it writes, the next rebuild overwrites them.
 *
 * PRIVACY. The source workbook holds dates of birth, home addresses,
 * emergency contacts, food allergies, airline rewards numbers, passport
 * names, handicap indexes and apparel sizes. The wall is a PUBLIC URL. This
 * script is the gate: it copies ONLY club, names, the captain's mobile and
 * work email, and the sponsored count. If you add a field here, you are
 * publishing it to the open internet. Ask Jim first.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const os = require("os");

/* Top Sponsors are the Platinum and Gold tiers only, per Donny: everyone who
   sponsored 4 or more. He confirmed the split on Sep 17. Platinum is the top
   two, Trey Showalter at 7 and the Spitzers at 6. Gold is 4 through 5. */
/* How many cards sit on each row of a tier. Yolanda asked for 4 then 5 on
   Gold, Sep 22. Applied only when the numbers still add up, so a roster
   change cannot silently drop a sponsor off the page. */
const TIER_ROWS = { Gold: [4, 5] };

/* Corrections applied on the way out of the workbook, which still carries
   the old values. Keeping them here rather than editing the generated JSON
   means the next rebuild does not quietly undo them. Yolanda, Sep 22. */

/* Keyed on the normalised club name, so it matches whether or not the
   sheet wrote a leading The. These are the legal club names. */
const CLUB_RENAMES = {
  "citrus club": "The Citrus Club",
  "huntington club": "The Huntington Club",
};

/* How the sponsor posters name each couple, which is spouse first. Taken
   from 2026-Top-Sponsors.pdf, Carol Ruskowski, Sep 23. Keyed on the SLUG,
   which is derived from the workbook name and must not move: the uploaded
   photos live at sponsorPhotos/<slug> in Firebase, so renaming the slug
   would silently detach every photo.
   Every name here was read off the artwork itself. */
const SPONSOR_RENAMES = {
  "trey-showalter": "Deidre & Trey Showalter, III",
  "todd-and-jamie-spitzer": "Jamie & Todd Spitzer",
  "rick-mclimore": "Amy & Rick McLimore",
  "kim-and-deanne-ashmore": "Deanne & Kim Ashmore",
  "hyung-and-suzie-cho": "Suzie & Hyung Cho",
  "justin-and-kylie-connelly": "Kylie & Justin Connelly",
  "jeff-blumer-and-kristy-kneiding": "Kristy Kneiding & Jeff Blumer",
  "jordan-and-cynthia-gugino": "Cynthia & Jordan Gugino",
  "blake-and-rochelle-sherman": "Rochelle & Blake Sherman",
};

/* Who is playing, where the workbook still says someone else. Two shapes:

     "Old Name": "New Name"
        The same household keeps the spot, so the workbook's sponsored count
        travels with it. The Sages swapped, so Melissa golfs and Bob does not.

     "Old Name": { name: "New Name", sponsored: <n> }
        A different person takes the spot. Their own sponsored count has to be
        given, because the workbook row belongs to the person leaving and
        their sponsorships are not transferable.

   Substitutions do NOT touch the Top Sponsors page. That list is built from
   the Top Sponsors sheet and keyed on slug, which is right: a member who
   sponsored seven people keeps that credit whether or not he tees it up. */
const PLAYER_RENAMES = {
  "Bob Sage": "Melissa Sage",
  /* Jim, Sep 25. Steve Le takes Trey Showalter's place on the Balcones team.
     Trey stays on Top Sponsors with his 7, which are his. Steve's own figure
     has not been supplied, so he gets the 1 that Yolanda's rule gives every
     player in the field with no recorded count, and the rebuild prints it. */
  "Trey Showalter": { name: "Steve Le", sponsored: null },
};

const TOP_SPONSOR_MIN = 4;
const PLATINUM_MIN = 6;

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) {
  console.error("Usage: node tools/build-roster.js <roster.xlsx>");
  process.exit(1);
}
const REPO = path.resolve(__dirname, "..");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-roster-"));
execFileSync("unzip", ["-o", "-q", SRC, "-d", tmp]);

function sheet(name) {
  const out = execFileSync("node", [path.join(__dirname, "xlsx.js"), tmp, name],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return out.split("\n")
    .filter((l) => /^\s*\d+ \| /.test(l))
    .map((l) => l.replace(/^\s*\d+ \| /, "").split(" | "));
}

const clean = (s) => (s == null ? "" : String(s).trim());

/* The two sheets disagree on two club names: the pro roster writes "The Oregon
   Golf Club" and "The Nelson Golf & Sports Club", the player sheet drops the
   "The". Without this the clubs split in two, one holding a captain and no
   players, the other holding players and no captain. */
const clubKey = (s) => clean(s).toLowerCase()
  .replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, " ").trim();

/* What the wall shows for a club. Renames win over whatever the sheet says. */
const clubName = (raw) => CLUB_RENAMES[clubKey(raw)] || clean(raw);

const slugify = (s) => clean(s).toLowerCase()
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* Shouty rows exist ("JASON HUMRICH"). Fix a name only when first AND last are
   both all caps, so McNaught, LoPresti and AJ survive untouched. */
const titleOne = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
function fixName(first, last) {
  const f = clean(first), l = clean(last);
  const allCaps = (s) => s.length > 1 && s === s.toUpperCase() && /[A-Z]/.test(s);
  if (allCaps(f) && allCaps(l)) {
    return [f, l].map((s) => s.split(/\s+/).map(titleOne).join(" ")).join(" ").trim();
  }
  return [f, l].filter(Boolean).join(" ").trim();
}

/* Ten digit US numbers become (xxx) xxx-xxxx. Anything else is left exactly as
   typed rather than guessed at, so bad source data stays visible. */
function fixPhone(raw) {
  const s = clean(raw);
  const d = s.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === "1") return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return s;
}

const num = (v) => {
  const n = parseFloat(clean(v));
  return isNaN(n) ? 0 : n;
};

const warnings = [];
const defaultedSponsors = [];

/* ------------------------------------------------------------------ teams */
const pros = sheet("Golf Pro Roster").slice(1);
const playerRows = sheet("Player Profiles").slice(1);

const clubs = new Map();   // key -> { club, captain, players }
function clubEntry(rawName, preferName) {
  const k = clubKey(rawName);
  if (!clubs.has(k)) clubs.set(k, { club: clubName(rawName), players: [] });
  const e = clubs.get(k);
  if (preferName) e.club = clubName(rawName);   // pro roster spelling wins
  return e;
}

for (const r of pros) {
  if (!clean(r[0])) continue;
  const e = clubEntry(r[0], true);
  e.captain = {
    name: fixName(r[2], r[3]),
    mobile: fixPhone(r[4]),
    email: clean(r[7]).toLowerCase(),
  };
  if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(e.captain.mobile)) {
    warnings.push(`captain mobile not a valid US number: ${e.club} / ${e.captain.name} / "${e.captain.mobile}"`);
  }
}

for (const r of playerRows) {
  if (!clean(r[0]) || clean(r[1]) === "Team Captain") continue;
  const rawName = fixName(r[2], r[3]);
  if (!rawName) continue;
  const sub = PLAYER_RENAMES[rawName];
  const name = (typeof sub === "string" ? sub : sub?.name) || rawName;
  /* A blank sponsored count becomes 1. Yolanda, Sep 22: everyone in the
     field sponsored at least one member, so a missing figure is a gap in
     the workbook rather than a zero. Nine of the hundred players hit this.
     A substitute is the same case: in the field, no figure of their own. */
  const substituted = sub && typeof sub === "object";
  const own = substituted ? sub.sponsored : num(r[36]);
  const sponsored = own || 1;
  if (!own) defaultedSponsors.push(name + (substituted ? " (substitute)" : ""));
  if (substituted) {
    warnings.push(`substitution: ${rawName} -> ${sub.name} on ${clean(r[0])}. ` +
      `Top Sponsors still credits ${rawName}.`);
  }
  clubEntry(r[0], false).players.push({ name, sponsored });
}

const teams = [...clubs.values()]
  .sort((a, b) => a.club.localeCompare(b.club))
  .map((e) => {
    /* A captain who also plays (Huntington) appears on both sheets. The
       captain block already names him, so drop the duplicate player row. */
    let players = e.players;
    if (e.captain) {
      const before = players.length;
      players = players.filter((p) => p.name !== e.captain.name);
      if (players.length !== before) {
        warnings.push(`captain also listed as a player, deduped: ${e.club} / ${e.captain.name}`);
      }
    } else {
      warnings.push(`no captain found for club: ${e.club}`);
    }
    const t = { id: slugify(e.club), club: e.club,
      players: players.sort((a, b) => a.name.localeCompare(b.name)) };
    if (e.captain) t.captain = e.captain;
    return t;
  });

fs.writeFileSync(path.join(REPO, "data/teams.json"), JSON.stringify({
  _note: "GENERATED by tools/build-roster.js from the master PI roster xlsx. Do not hand edit. Contact details are captains only, by design. See the privacy note in the script.",
  generated: new Date().toISOString().slice(0, 10),
  teams,
}, null, 2) + "\n");

/* --------------------------------------------------------- top sponsors */
const sponsorRows = sheet("Top Sponsors").slice(1);
const picked = [];
for (const r of sponsorRows) {
  const name = clean(r[5]) || fixName(r[1], r[2]);
  const count = num(r[6]);
  if (!name || count < TOP_SPONSOR_MIN) continue;
  const slug = slugify(name);
  /* Only point at a photo that exists. A path to a missing file is a 404 in
     every attendee's console and a wasted request on venue wifi. Drop a
     headshot in assets/sponsors/ named for the slug and rerun this script.
     Organizers can also upload from the wall, which lands in Firebase and
     wins over the file. */
  /* Carol's poster for this sponsor, which is what the wall shows. */
  const posterRel = `assets/sponsors/poster-${slug}.jpg`;
  const poster = fs.existsSync(path.join(REPO, posterRel)) ? posterRel : null;
  if (!poster) warnings.push(`no poster artwork for ${name} (${posterRel})`);

  const photo = ["jpg", "jpeg", "png", "webp"]
    .map((ext) => `assets/sponsors/${slug}.${ext}`)
    .find((rel) => fs.existsSync(path.join(REPO, rel))) || null;
  picked.push({
    slug,
    name: SPONSOR_RENAMES[slug] || name,
    club: clubName(r[0]),
    count,
    tier: count >= PLATINUM_MIN ? "Platinum" : "Gold",
    poster,
    photo,
  });
}
picked.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

const tiers = ["Platinum", "Gold"].map((tier) => {
  const sponsors = picked.filter((s) => s.tier === tier);
  const plan = TIER_ROWS[tier];
  const fits = Array.isArray(plan) &&
    plan.reduce((a, b) => a + b, 0) === sponsors.length;
  if (plan && !fits && sponsors.length) {
    warnings.push("row plan for " + tier + " is [" + plan + "] but there are " +
      sponsors.length + " sponsors, falling back to one centred row");
  }
  return fits ? { tier, rows: plan, sponsors } : { tier, sponsors };
}).filter((t) => t.sponsors.length);

fs.writeFileSync(path.join(REPO, "data/sponsors.json"), JSON.stringify({
  _note: "GENERATED by tools/build-roster.js from the Top Sponsors sheet, filtered to Platinum and Gold. These are members ranked by full privilege members sponsored, not corporate sponsors. Do not hand edit.",
  generated: new Date().toISOString().slice(0, 10),
  intro: "Our thanks to the members who brought the most new faces into their clubs this year.",
  tiers,
}, null, 2) + "\n");

fs.rmSync(tmp, { recursive: true, force: true });

console.log("teams:", teams.length, "clubs");
console.log("  with captain:", teams.filter((t) => t.captain).length);
console.log("  players:", teams.reduce((n, t) => n + t.players.length, 0));
tiers.forEach((t) => console.log(`${t.tier}: ${t.sponsors.length}`));
const missing = picked.filter((s) => !s.photo);
if (missing.length) {
  console.log(`\nno photo yet for ${missing.length} of ${picked.length} sponsors:`);
  missing.forEach((s) => console.log(`  assets/sponsors/${s.slug}.jpg  (${s.name})`));
}
if (defaultedSponsors.length) {
  console.log("\nsponsored count was blank, defaulted to 1 for " +
    defaultedSponsors.length + ":");
  defaultedSponsors.forEach((n) => console.log("  " + n));
}
if (warnings.length) {
  console.log("\nWARNINGS");
  warnings.forEach((w) => console.log("  ! " + w));
}
