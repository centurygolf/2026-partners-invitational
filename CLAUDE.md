# CLAUDE.md

Standing instructions for this repository. Read before acting in any session.

---

## The project

A mobile web application serving as the live wall for the 18th Annual Partners
Invitational, October 4 to 7, 2026, at PGA WEST in La Quinta, California, with
lodging at the La Quinta Resort & Club. Attendees reach it by QR code. The
audience is partners and owners, so the register is polished and upscale. The
look is mid-century Palm Springs: light, airy, cream and aqua and mustard,
breeze block and butterfly roof motifs. The masthead carries the official
Partners Invitational wordmark (golfer plus serif type), which replaced both
the typographic title and the PGA WEST mark on Sep 21. The wordmark is
supplied black on white with no alpha, so it renders with mix-blend-mode
multiply to drop the white onto the cream. PGA WEST still appears in the
masthead venue line and with its own logo on the Program Guide.

The golf: two-person teams. Round 1 Monday is a two-person scramble on the
Nicklaus Private (35% low index + 15% high). Round 2 Tuesday is a two-person
shamble on the Palmer Private (70% of GHIN). Top three teams and ties advance
to a two-hole Shoot-Out. The leaderboard carries NET TEAM SCORES PER ROUND
entered by the scoring table, not hole-by-hole gross.

Source of truth for event facts: docs/2026-partners-final-agenda.docx. Known
discrepancy in that doc: the schedule puts the Shoot-Out at Tuesday 2:00 pm,
the Q&A section says Wednesday after play. The wall follows the schedule.

You are working with Jim Creighton, Director of People Development and
Innovation at CGP.

Reference documents:
- `ROADMAP.md` in this repo. Phased task list with acceptance criteria. Work it in order.
- The predecessor build lives at `../Membership Live Wall 2026`. Its CLAUDE.md
  records the hard lessons. Most of the rules below were earned there.

Open content gaps (do not invent any of these):
- Attendee roster
- Team pairings
- Real scorecard pars for the Nicklaus and Palmer Private courses
- Team Captain Host names and numbers for Who to Call

---

## How to work with Jim

**Plan before executing.** For any structural change, new feature, or bulk
operation, state what you are going to do and get a green light. For typos,
copy tweaks, and single-value adjustments, just do it.

**Ask instead of assuming.** When scope or content is ambiguous, ask one focused
question with two to four concrete options. Do not fill gaps with invented
roster entries, club names, financial figures, or attendee data. If real data is
missing, use a clearly labeled placeholder and say so.

**Read before you write.** Read any file before editing it. Do not pattern-match
from memory when the file is available.

**Never delete without approval.** Confirm what is being removed and wait.

**Verify your own work.** Check syntax after every code edit. babel-standalone
means a JSX error is a white screen, not a build failure. Load the page in a
browser before calling anything done.

**Report against the roadmap.** When you finish work, say which task IDs moved
and whether their acceptance criteria passed.

---

## Voice rules

These apply to every word that ships: interface copy, empty states,
confirmations, error messages, commit messages, documentation.

**Required:**
- No em-dashes. Use periods, commas, parentheses, or restructure the sentence.
- Plain verbs. "Use" not "utilize." "Show" not "demonstrate."
- Short sentences. Two short beats beat one long one.
- Direct address. Talk to the reader.
- Concrete over abstract. Name the thing.

**Forbidden:**
- Negate-then-assert constructions. "This is not just X, it is Y."
- Decorative tricolons. "Clear, concise, and compelling."
- Filler transitions. "It is worth noting that." "That said." "Ultimately."
- Empty sign-offs. "Hope this helps."

**Interface voice specifically.** This wall talks to partners and owners. The
register is a good concierge: warm, confident, brief, never flip and never
stiff. Working examples: "Welcome to the desert." "The first group is on the
tee." "No photos yet. Be the first." The rock-tour irreverence from the
membership wall does not travel here.

**Client terminology.** CGP properties are called clubs, never properties.

---

## Architecture

**Stack**
- React 18 via CDN, single `index.html`, inline Babel transpilation
- Firebase Realtime Database, LIVE since Sep 17
- GitHub Pages from repo root, live at
  https://centurygolf.github.io/2026-partners-invitational/
- Google Fonts: Josefin Sans, Yellowtail, Inter
- `FIREBASE_CONFIG` in index.html is the switch. Setting apiKey back to
  PASTE_ME drops the app into the in-memory preview store, which is useful
  for testing without writing to the live event data.

**Which database.** The wall uses its own Realtime Database instance,
`cgp-partners-inv-2026`, reached at
https://cgp-partners-inv-2026.firebaseio.com. That instance lives inside the
`cgp-membership-wall-2026` Firebase project, NOT because the two events share
data but because Jim's Google account has hit its Cloud project quota and a
new project could not be created. A separate instance means separate data and
separate rules. Nothing in this wall can read or write the membership wall's
database. If the quota is ever freed, moving to a dedicated project is a one
line change to `databaseURL` plus a rules deploy.

**Home screen identity.** The icon is the golfer from the event wordmark,
recoloured to #0C547C (sampled from the silhouette Jim supplied) on the cream
ground, at assets/brand/icon-golfer-*.png. It is cut from the 2000px wordmark
rather than the 139px file he attached, which was far too small for a 512px
icon. The label under the icon is "The Partners", which lives in TWO places
and both must agree: `apple-mobile-web-app-title` for iOS and `short_name`
in the manifest for Android. The manifest `name` stays the full event title.

iOS caches the home screen icon hard. Anyone who added the wall before Sep 21
keeps the old PGA WEST icon until they remove the shortcut and add it again.
The old apple-touch-icon.png, icon-192/512 and favicon-32 are still in
assets/brand/ and nothing references them.

**Photo inventory.** `assets/photos/` mixes two sources. The three ORIGINALS
Jim sent on Sep 21 are full resolution and final: `teams-band.jpg` (hands in
a circle, heads the Teams tab), `round2-pair.jpg` (Tuesday's round) and
`course-lunch.jpg` (Monday's player lunch). The rest are collage crops, see
below.

A tab can wear a photo under its title with `className="section-band"`. Teams
is the only one using it so far; the CSS is generic on purpose.

**The collage crops are PROVISIONAL.** The masthead band and four agenda
photos were cropped out of the single collage image in the 2026 brochure as a
look test. They are low resolution because of it: the
band is 1268px wide, which is under retina at desktop. Jim is sourcing the
originals. When they arrive, replace the files at the same paths and nothing
else needs touching. `tools/` has no script for this; the crops were made
with sharp, and the collage boundaries were found by scanning for brightness
jumps rather than by eye (the panel divider is at x=1268, the right column
splits at y=374 and y=757, and the middle band splits at x=1634).

The masthead photograph is **John Henebry's** and the credit renders over the
bottom right of the band. Do not remove it, and confirm the licence before
this goes anywhere beyond the event wall.

**Getting the photos out.** Two routes, both full resolution, both numbered
in the order posted so a slideshow runs chronologically.

```
node tools/download-photos.js [folder]     # default ./photo-export
```

That is the steady one: it skips anything already fetched, so it can be run
after each day without redownloading. The admin panel also has a **Photo
export** section that zips everything in the browser, which is handier from a
phone but holds the archive in memory while it builds.

The ZIP is written by hand, stored rather than deflated, since JPEGs are
already compressed. Validated against the real `unzip`, CRCs and all. No
library, same reasoning as the cropper.

That export needs CORS on the bucket, set Sep 22 to GET only from
centurygolf.github.io, the old creightonjames-jpg origin, and localhost:4179.
**If the wall ever moves to another domain, add it there or the zip silently
downloads nothing.**

**Photos live in Cloud Storage, not the database.** They get downloaded and
projected in a slideshow, so quality is the point. Each upload writes two
files under `pinv/photos/` in the bucket
`cgp-membership-wall-2026.firebasestorage.app`:

| Rendition | Long edge | Quality | Used for |
|---|---|---|---|
| `{id}-full.jpg` | 3000px | 0.92 | download, slideshow |
| `{id}-thumb.jpg` | 640px | 0.8 | the grid |

The database holds only the two URLs plus dimensions and bytes. That split is
load-bearing: the Photos tab subscribes to the whole `photos` node, so if the
image data lived there every phone would download every photo ever posted on
every visit. With URLs it downloads thumbnails, roughly 8 to 40KB each, and
fetches a full file only when someone taps one. Uploads carry a one year
`Cache-Control`, so a second look costs nothing.

Constants are `FULL_MAX`, `FULL_QUALITY`, `THUMB_MAX`, `THUMB_QUALITY` at the
top of the gallery section. Raising FULL_MAX raises upload time on course
wifi, which is the real constraint, not storage cost.

Cropping is optional on the Photos tab and "Use the whole photo" is the
primary button, because a square crop throws away exactly what a slideshow
wants. The cropper never upscales: it caps output at the source pixels the
frame actually covers.

Deleting a photo removes both files as well as the database node. Skipping
that leaves orphans in the bucket costing money forever.

**The Top Sponsors tab shows Carol's posters, not headshots.** Since Sep 23
each card IS the poster page from docs/2026-Top-Sponsors.pdf, at
assets/sponsors/poster-<slug>.jpg, 760x1140. The artwork already carries the
name, the club and the sponsorship count, so nothing is repeated under it and
there are no circles left. build-roster.js emits the poster path when the file
exists and warns when it does not; index.html falls back to a monogram card if
an image fails to load.

The eleven headshots Jim uploaded before that are still in Firebase, archived
at `sponsorPhotosSupersededSep23` (11 entries, 1303KB). `sponsorPhotos` itself
was emptied rather than deleted, because an uploaded photo still overrides the
poster: that is how a poster gets replaced from the admin panel. Moving the
archive back would hide all eleven posters again.

Sponsor uploads stay as base64 in the database rather than Cloud Storage.
There are eleven of them, so the load argument that drove the Photos tab to
Storage does not apply here.

**Storage setup, for the record.** Firebase Storage was not enabled on the
project and the console "Get Started" click is the documented way to do it.
It was enabled instead by POSTing to
`firebasestorage.googleapis.com/v1beta/projects/{project}/defaultBucket` with
the CLI's own OAuth token. Rules live in `storage.rules`: public read and
write under `pinv/photos/` only, images only, 25MB ceiling, everything else
denied by default. The bucket cannot be listed publicly. Deploy with

```
firebase deploy --only storage --project cgp-membership-wall-2026
```

The membership wall shares this bucket but does not use Storage at all, which
is why scoping to the `pinv/` prefix matters.

**Deploying rules.** `firebase.json` uses the ARRAY form of the database key.
The object form silently ignores `instance` and deploys to the project's
default database, which is the membership wall's. That happened once on
Sep 17. It did no harm because both use the same open rules, but check the
deploy output names `cgp-partners-inv-2026` before believing it.

```
firebase deploy --only database --project cgp-membership-wall-2026
firebase database:get "/.settings/rules" --instance cgp-partners-inv-2026 --project cgp-membership-wall-2026
```

The second command is not optional. Read the rules back every time.

**File layout**
```
/index.html                       app logic and design system
/data/agenda.json                 session schedule (PLACEHOLDER content)
/data/roster.json                 attendee list (PLACEHOLDER content)
/data/course.json                 course name and pars (PLACEHOLDER content)
/data/concierge.json              venue, travel, contacts (PLACEHOLDER content)
/data/resources.json              resource links (PLACEHOLDER content)
/assets/attendees/{slug}.jpg      headshots, 400x400
/assets/brand/                    logo, favicons, textures
/serve.js                         local static server, node serve.js, port 4179
```

**Publishing.** `git` does not run on this Mac: the Xcode license has not been
accepted, so `/usr/bin/git` and `/usr/bin/python3` both refuse with a license
error, and only Jim can clear it (`sudo xcodebuild -license`, needs his
password). Until then, publish through the GitHub API instead:

```
node tools/publish.js "commit message"
```

It reads every file except `docs/`, writes blobs, builds one tree, commits and
moves `main`. `gh` authenticates as **creightonjames-jpg**, which is a
COLLABORATOR on the repo, not its owner.

**Who owns what, since this confused everyone once already.** The repo lives at
`centurygolf/2026-partners-invitational`, owned by a second personal account
Jim made so the link would stop carrying his name. creightonjames-jpg has push
access and nothing more. Personal-account repos have no collaborator roles, so
that cannot be upgraded: **Claude can publish content but can never change repo
settings.** If Pages ever needs re-enabling mid-event, only the centurygolf
login can do it.

The abandoned repo `creightonjames-jpg/2026-partners-invitational` still
exists and still serves a FROZEN copy from before the move. It does not
update. Retire it rather than letting a stale link circulate. The tree is built WITHOUT `base_tree`, so a file deleted
locally is deleted upstream too. Never put secrets in this repo: it is public,
like every other CGP wall repo.

**The data split.** Anything created during the event goes in Firebase.
Anything fixed before the event lives in the repo as a static file.

| Content | Location |
|---|---|
| Roster, agenda, concierge, resources, rounds config | Repo, static |
| Headshots, logos | Repo, static |
| Teams and per-round net scores | Firebase `teams/`, `scores/{teamId}/{r1,r2}` |
| Live event photos | Cloud Storage `pinv/photos/`, URLs in Firebase `photos/` |
| Photo likes | Firebase `photoLikes/` |
| Marquee, tab visibility, admin PIN | Firebase `settings/` |
| Per device like history, admin session | Local storage, `pinv_` prefix |
| Videos | YouTube or Vimeo unlisted embeds, never repo files |

**Firebase nodes:** `settings/`, `questions/`, `photos/`, `photoLikes/`,
`sponsorPhotos/{slug}`.
`teams/` and `scores/` belong to the parked leaderboard and are no longer
seeded or written.

**Local storage keys:** `pinv_liked`, `pinv_admin`, `pinv_asked`

**Admin login.** The gear at the right end of the tab strip. The PIN lives at
`settings/adminPin` in Firebase, so it is changed there, not in code. In
preview mode the seeded PIN is 0000. **When Firebase goes live, set a real PIN
before the QR code goes out.** If `settings/adminPin` is missing entirely no
PIN will work, which fails closed rather than open. Admin unlocks: sponsor
photo upload, question answering, marquee, tab visibility, photo removal.

**Photo cropping.** `PhotoCropper` is a local component, no library, because a
CDN cropper is one more thing that can be blocked by venue wifi. Drag to pan,
slider to zoom. Sponsor replacements crop to the poster's 2:3 at 1140px and
offer "Use the whole photo", since a replacement will usually already be
poster-shaped; gallery photos crop square at 1000px with the same skip.
Object URLs live for the life of the modal. Revoking one on load blanks the
preview, which is how it broke the first time.

---

## Hard rules

Earned on the membership wall. Do not relearn them here.

**Firebase security rules are permanent.** They must read exactly
`{ "rules": { ".read": true, ".write": true } }` with no expiration clause.
Firebase's default test-mode rule expires after 30 days and once fired
mid-event, blanking the whole wall. Verify published rules by reading them
back, not by assuming a paste worked.

**No base64 images in Firebase except live event photos.** Headshots and
graphics belong in the repo as static files.

**No video files in the repo.** GitHub Pages is not a video CDN.

**Both photo upload paths ship together.** Camera via `capture="environment"`
and library via a second input without the capture attribute.

**No fixed-height inner scroll containers.** Let content flow with the page.
Viewport-locked heights are for a future Display Mode only.

**Every local storage key carries the `pinv_` prefix.** Unprefixed keys collide
with other CGP walls in the same browser. The membership wall owns `mm26_`.

**Score entry is admin only.** The scoring table computes the handicap net;
the wall just posts it, one number per team per round, decimals allowed.
Standings math lives in one function (`computeStandings`). Rank compares
to-par over rounds posted so partial states stay fair. Ties share a rank. A
team with no scores shows as no card yet, not as leader at even par.

**Test on a physical phone before the event.** Desktop responsive mode does not
catch camera behavior, maps handoff, tappable phone numbers, or font loading.

---

## Design tokens

```
--linen    #F7F2E8   page background, warm cream
--paper    #FFFDF6   card surface
--sand     #EFE7D6   form fields, inactive pills, table stripes
--pool     #3E8E90   primary accent, turquoise
--pool-deep #2C6B6D  pressed and hover, deep borders
--mustard  #D9A441   secondary accent, leader gold, awards
--terra    #C2643F   warm accent, terracotta
--dusk     #55496B   mountain purple, quiet headers
--ink      #2E2A24   body text, warm near-black
--dim      #6F6758   secondary text, metadata
--mute     #9C927F   timestamps, fine print
--edge     #E2D8C3   borders and dividers
--danger   #B0442E   destructive admin actions
--glow     rgba(62,142,144,0.10)
```

**Type:** Josefin Sans for display, all caps, generous tracking. Inter for body
and UI. Yellowtail script is rationed the way Alfa Slab One was on the
membership wall: the hero greeting and nowhere else. Everywhere else it reads
as a cocktail menu.

**Motifs:** breeze block screen (SVG pattern band), sunburst divider, roofline
cards (butterfly roof angle on card headers), scorecard grid, mountain horizon.

---

## Privacy, read this before touching the roster

The master roster workbook (OneDrive, "2026 MASTER USE THIS ONE - PI ROSTER
ORIGINAL") holds dates of birth, home addresses, emergency contacts, food
allergies, airline rewards numbers, passport names, handicap indexes and
apparel sizes for 125 people. **The wall is a public URL.**

`tools/build-roster.js` is the gate. It copies only club, names, the
captain mobile and work email, and the sponsored count. Adding a field there
publishes it to the open internet. Ask Jim first, every time.

Player contact details are deliberately NOT published. Captains only, because
they are the hosts attendees need to reach. The page carries a noindex tag so
the contact details do not end up in search results.

## The eight tabs

Donny set this list on Sep 15. His order, his names. Do not add, rename, or
reorder a tab without him. Jim added Live Scoring on Sep 19, in second place
so it is reachable without scrolling the strip on a phone.

| Tab | Function | Data source |
|---|---|---|
| Agenda | Schedule with day pills | data/agenda.json |
| Live Scoring | Golf Genius hand-off per round | data/scoring.json |
| Teams | Club, captain contact, players | data/teams.json (GENERATED) |
| Top Sponsors | Platinum and Gold members, photos | data/sponsors.json (GENERATED) |
| Program Guide | Venues, format, dress, travel, documents | data/guide.json |
| Area Guide | La Quinta and Coachella Valley | data/area-guide.json |
| Photos | Photo uploads with likes | Firebase photos/ |
| Questions | Attendees ask, organizers answer | Firebase questions/ |

**Questions is moderated by default.** A question goes to the organizers and
publishes when it is answered. The asker sees their own marked as sent, via
`pinv_asked`. A room of partners should never see a column of unanswered
questions. `settings/qaPublic` flips this to publish everything immediately,
toggled from the admin panel.

**Format of Play is Eric Gray's, Sep 24.** Eric is the Director of Golf and
the authority on format. He sent corrections written against his own Terms of
Competition documents, not against this wall, so most of them had nothing here
to correct. Jim said to apply them anyway, so the Program Guide now carries
what Eric stated:

- Monday on the Nicklaus Private, men play the **blue tees**, scoring code
  **PRTINV26** (he was replacing PRTINV25 in his own TOC).
- The **Monday Member Shootout** is **25 teams**, blue tees, Group A on Hole 1
  then Hole 9, Group B on Hole 9 then Hole 1, final hole **18**. Ties at an
  elimination are settled by a **chip-off**, not the sudden-death playoff his
  older TOC described.
- "The Shoot-Out" was renamed **"The Tuesday Shoot-Out"**, because two
  shoot-outs run this week and the Monday one is much bigger.
- Tuesday's round and Tuesday's shoot-out were reviewed and left alone.

Two gaps were left open rather than guessed. Eric gave the men's tees and said
nothing about the women's, and he gave a scoring code for Monday and none for
Tuesday. **Do not fill either in without asking him.**

**PRTINV26 is printed, not wired.** It shows as text in Format of Play. It is
NOT in data/scoring.json, because a GGID that turns out to be wrong gives 125
partners a button to a dead page, and Golf Genius serves the same client-side
page for a real code and for nonsense, so it cannot be validated from here.
Confirm with Eric or Amy whether PRTINV26 is the deeplink GGID and whether it
differs per round, then fill in `ggid` and the Coming Soon chips go away.

**The stale site is still up.** `creightonjames-jpg.github.io/2026-partners-invitational/`
still serves and is now a week behind: no posters, no weather, still says
Placeholder. Jim has admin on that repo and gh can publish a redirect to it.
It is a live suspect whenever someone reports errors they cannot find on the
real wall. Retire it.

**Weather lives on the Agenda, not in a tab.** Carol asked for a forecast on
Sep 24. It is a strip of four tiles above the day pills, and tapping a tile
selects that day, so it picks the schedule rather than just decorating it.
Adding a ninth tab would have needed Donny.

The source is **Open-Meteo**, chosen because it needs no API key. This repo is
public, so a keyed service would mean either a leaked key or a server to hide
it behind, and neither is worth a temperature. It sends
`Access-Control-Allow-Origin: *`, so nothing is configured anywhere. Config is
the `WX` constant in index.html: PGA WEST at 33.6634, -116.3100, results
cached in sessionStorage for thirty minutes.

The days come from the new `iso` field on each day in data/agenda.json. A day
without one is skipped. **If the event dates ever move, change `iso` and the
forecast follows.**

If the fetch fails the strip renders nothing at all. On course wifi a missing
garnish beats an error box under the schedule. A tile prints rain chance only
at 15% or higher, and wind only at 15mph or higher, because in the desert a 4%
chance and a 6mph breeze are not news. More than five days out the footer says
the forecast is a trend rather than a promise, which it drops automatically as
the week gets closer.

**The chip says Coming Soon, not Placeholder.** Jim, Sep 24. Same component
(`PhChip`), same `placeholder: true` flag in the data, different word.
Partners read this wall, and a gap they are promised is easier to take than a
gap they are shown. The flag name stayed as it is so nothing in the data files
had to move.

**The Event Book is a Coming Soon document.** It is not final until about
Sep 28, but the link went out before that, so `documents` in data/guide.json
carries an entry with `url: null` and `placeholder: true`. That renders the
title with a chip instead of a dead link. **When the book arrives, drop the PDF
in assets/ and set `url`. The chip disappears on its own.**

**Live Scoring needs GGIDs.** `data/scoring.json` holds one per round. Until
they arrive each round shows a labelled placeholder instead of a dead button.
The ONLY URL that opens the Golf Genius app rather than a browser is
`https://www.golfgenius.com/deeplink_ggid?ggid=<GGID>`, which is the single
path in their apple-app-site-association. Any other Golf Genius URL opens in
Safari. `leaderboardUrl` is separate and optional, for a public view-only
leaderboard if Amy publishes one.

**The Leaderboard is parked, not deleted.** Golf Genius runs scoring for this
event and computes the handicap allowances itself, so a second leaderboard
would mean the scoring table keys every number twice. The component and
`computeStandings` are still in index.html with a comment explaining how to
revive them. Ask Jim before deleting any of it. Golf Genius deep links use
`https://www.golfgenius.com/deeplink_ggid?ggid=<GGID>`, which is the only URL
shape that opens their app instead of a browser. GGIDs have not arrived yet.

**Reading PDFs and Office files on this Mac.** There is no poppler, no
pdftotext, and `brew install` fails for the same Xcode licence reason git
does. `node tools/pdftext.js <file.pdf>` is the workaround: it inflates the
content streams with node's zlib and applies each font's ToUnicode CMap,
including two-byte Type0 fonts. `tools/xlsx.js` does the same job for
spreadsheets.

**The Area Guide has no placeholders left.** Every number and opening time on
it came from Yolanda directly on Sep 22, not from the brochure. Two of them,
the Golf Shop on 760.564.3914 and the Concierge on 760.564.7111, happen to
match what the mangled brochure text implied, which is a nice confirmation
that refusing to publish the reconstruction was the right call rather than a
wasted precaution.

**A warning about the 2026 brochure.** Its PGA WEST amenities page uses a
subset font whose ToUnicode table is incomplete, so extraction silently drops
individual digits. "760.564.3914" comes out as "70.54.3914". Hours are
affected too, and it is not always visible which character went missing. The
Area Guide deliberately omits every phone number and opening time from that
one page rather than reconstructing them. Do not "fix" this by guessing. Get
the numbers from the club.

**Sponsor names follow the posters, which name the spouse first.** Carol's
2026-Top-Sponsors.pdf (kept in docs/) is the authority on how each couple is
credited, and it differs from the workbook on eight of the eleven.
`SPONSOR_RENAMES` in tools/build-roster.js holds them, **keyed on the slug and
applied only to the display name**. The slug still derives from the workbook
name and must never move, because the uploaded photos live at
`sponsorPhotos/<slug>` in Firebase and a changed slug detaches them silently.

All eleven names were read off the artwork. Ten decoded from the PDF text.
Jamie & Todd Spitzer would not, so page 2 was split out with JXA and PDFKit,
rendered with `qlmanage -t -s 2000`, and read by eye. Page order was confirmed
against page 11, Rochelle & Blake Sherman.

**Corrections to the workbook live in the builder, not the JSON.** The master
xlsx still carries the old values, so a hand edit to data/teams.json is undone
by the next rebuild. `CLUB_RENAMES` and `PLAYER_RENAMES` at the top of
tools/build-roster.js are where a correction goes. Currently: Citrus and
Huntington carry their legal names with the leading "The", and Ballantyne's
golfer is Melissa Sage rather than Bob, the Sages having swapped. Club renames
key on the normalised name, so they match whether or not a sheet wrote the
"The", and they apply to the sponsor list as well as Teams.

**A blank sponsored count becomes 1.** Yolanda, Sep 22: everyone in the field
sponsored at least one member, so an empty cell in the workbook is a gap in
the record rather than a zero. `build-roster.js` applies the default and
prints every name it touched on each rebuild, so the assumption stays visible
instead of disappearing into the data.

**Generated data files.** `data/teams.json` and `data/sponsors.json` are built
by `node tools/build-roster.js <roster.xlsx>`. Do not hand edit either one, a
rebuild overwrites it. Rerun it whenever a new roster arrives. It prints
warnings for bad source data, currently one malformed captain mobile.

**Orphaned data files.** `data/concierge.json`, `data/resources.json`, and
`data/roster.json` were folded into `guide.json` and `teams.json` on Sep 15.
Nothing reads them. They are still on disk pending Jim's approval to delete.
Do not edit them expecting a change on the wall.

**The preview store returns null, not undefined,** for a path that does not
exist, because that is what Firebase does. A component that treats undefined
as "still loading" rendered a blank tab forever when its node was unseeded.
Fixed Sep 17 in `makeMemoryStore`. Do not reintroduce it.

---

## Definition of done for any task

1. Acceptance criteria in `ROADMAP.md` pass.
2. No console errors.
3. Verified at 380px width and at desktop width.
4. Verified on a physical phone if the feature touches camera, maps, phone
   links, or fonts.
5. Copy passes the voice rules. No em-dashes.
6. Committed with a clear message. Confirm the commit landed.
7. Task status updated in `ROADMAP.md`.
