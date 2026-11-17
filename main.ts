// makefun-frontend-01 entry program (Node 22, standard library only).
//
// What it hands in: the static frontend in app/ beside this file, the three
// screenshots in screenshots/, and a dossier.json the judge reads — the
// screenshots, the first load's files and bytes, and the app's source — built
// by the vendored make.fun library. The library file itself stays exactly as
// the kit shipped it: the scorer rebuilds the dossier with its own copy and
// the two must match byte for byte.
//
// Run it outside the grader with an output directory of your own:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's caps (reference/gate.json): text_max_bytes is the only one that
// changes the dossier's bytes. The rest refuse an entry the scorer would
// refuse anyway — more than 3 screenshots, one over 256 KiB, or app/ past
// 993 files and directories or 16 MiB — and app/ shares /output's own
// 1000-entry cap with screenshots/ and dossier.json, so keep room.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 3, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
