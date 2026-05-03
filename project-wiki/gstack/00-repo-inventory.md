# 00 - 仓库盘点

## Source

- Path: `/Users/bytedance/workspace/deepwiki/project-repos/gstack`
- Remote: `https://github.com/garrytan/gstack.git`
- Branch: `main`
- Commit: `454423aeb3d3dafa88d5b57bfbe0ead05569d21e`

## File Summary

- Files scanned: 687
- Top-level directories: `.github`, `agents`, `autoplan`, `benchmark`, `benchmark-models`, `bin`, `browse`, `browser-skills`, `canary`, `careful`, `claude`, `codex`, `context-restore`, `context-save`, `contrib`, `cso`, `design`, `design-consultation`, `design-html`, `design-review`, `design-shotgun`, `devex-review`, `docs`, `document-release`, `extension`, `freeze`, `gstack-upgrade`, `guard`, `health`, `hosts`, `investigate`, `land-and-deploy`, `landing-report`, `learn`, `lib`, `make-pdf`, `model-overlays`, `office-hours`, `open-gstack-browser`, `openclaw`, `pair-agent`, `plan-ceo-review`, `plan-design-review`, `plan-devex-review`, `plan-eng-review`, `plan-tune`, `qa`, `qa-only`, `retro`, `review`, `scrape`, `scripts`, `setup-browser-cookies`, `setup-deploy`, `setup-gbrain`, `ship`, `skillify`, `supabase`, `test`, `unfreeze`

| Extension | Count |
|-----------|------:|
| `.ts` | 367 |
| `.md` | 122 |
| `[no extension]` | 59 |
| `.tmpl` | 47 |
| `.html` | 26 |
| `.sh` | 13 |
| `.json` | 11 |
| `.yml` | 9 |
| `.js` | 6 |
| `.png` | 5 |
| `.sql` | 5 |
| `.css` | 4 |
| `.rb` | 4 |
| `.yaml` | 3 |
| `.example` | 1 |
| `.ci` | 1 |
| `.cjs` | 1 |
| `.lock` | 1 |
| `.txt` | 1 |
| `.icns` | 1 |

## Manifests and Build Files

- `package.json`

## Documentation

- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `README.md`
- `docs/ADDING_A_HOST.md`
- `docs/ON_THE_LOC_CONTROVERSY.md`
- `docs/OPENCLAW.md`
- `docs/REMOTE_BROWSER_ACCESS.md`
- `docs/designs/BROWSER_SKILLS_V1.md`
- `docs/designs/BUN_NATIVE_INFERENCE.md`
- `docs/designs/CHROME_VS_CHROMIUM_EXPLORATION.md`
- `docs/designs/CONDUCTOR_CHROME_SIDEBAR_INTEGRATION.md`
- `docs/designs/CONDUCTOR_SESSION_API.md`
- `docs/designs/DESIGN_SHOTGUN.md`
- `docs/designs/DESIGN_TOOLS_V1.md`
- `docs/designs/GCOMPACTION.md`
- `docs/designs/GSTACK_BROWSER_V0.md`
- `docs/designs/ML_PROMPT_INJECTION_KILLER.md`
- `docs/designs/PACING_UPDATES_V0.md`
- `docs/designs/PLAN_TUNING_V0.md`
- `docs/designs/PLAN_TUNING_V1.md`
- `docs/designs/SELF_LEARNING_V0.md`
- `docs/designs/SESSION_INTELLIGENCE.md`
- `docs/designs/SIDEBAR_MESSAGE_FLOW.md`
- `docs/designs/SLATE_HOST.md`
- `docs/designs/SLOP_SCAN_FOR_REVIEW_SHIP.md`
- `docs/domain-skills.md`
- `docs/gbrain-sync-errors.md`
- `docs/gbrain-sync.md`
- `docs/skills.md`
- `review/specialists/security.md`

## CI and Automation

- `.github/workflows/actionlint.yml`
- `.github/workflows/ci-image.yml`
- `.github/workflows/evals-periodic.yml`
- `.github/workflows/evals.yml`
- `.github/workflows/make-pdf-gate.yml`
- `.github/workflows/pr-title-sync.yml`
- `.github/workflows/skill-docs.yml`
- `.github/workflows/version-gate.yml`
- `.gitlab-ci.yml`

## Tests

- `browse/test/activity.test.ts`
- `browse/test/adversarial-security.test.ts`
- `browse/test/batch.test.ts`
- `browse/test/browse-client.test.ts`
- `browse/test/browser-manager-unit.test.ts`
- `browse/test/browser-skill-commands.test.ts`
- `browse/test/browser-skill-write.test.ts`
- `browse/test/browser-skills-e2e.test.ts`
- `browse/test/browser-skills-storage.test.ts`
- `browse/test/build.test.ts`
- `browse/test/bun-polyfill.test.ts`
- `browse/test/cdp-allowlist.test.ts`
- `browse/test/cdp-e2e.test.ts`
- `browse/test/cdp-mutex.test.ts`
- `browse/test/commands.test.ts`
- `browse/test/compare-board.test.ts`
- `browse/test/config.test.ts`
- `browse/test/content-security.test.ts`
- `browse/test/cookie-import-browser.test.ts`
- `browse/test/cookie-picker-routes.test.ts`
- `browse/test/data-platform.test.ts`
- `browse/test/domain-skills-e2e.test.ts`
- `browse/test/domain-skills-storage.test.ts`
- `browse/test/dual-listener.test.ts`
- `browse/test/dx-polish.test.ts`
- `browse/test/error-handling.test.ts`
- `browse/test/file-drop.test.ts`
- `browse/test/find-browse.test.ts`
- `browse/test/findport.test.ts`
- `browse/test/fixtures/basic.html`
- `browse/test/fixtures/cursor-interactive.html`
- `browse/test/fixtures/dialog.html`
- `browse/test/fixtures/dropdown.html`
- `browse/test/fixtures/empty.html`
- `browse/test/fixtures/forms.html`
- `browse/test/fixtures/iframe.html`
- `browse/test/fixtures/injection-combined.html`
- `browse/test/fixtures/injection-hidden.html`
- `browse/test/fixtures/injection-social.html`
- `browse/test/fixtures/injection-visible.html`
- `browse/test/fixtures/media-page.html`
- `browse/test/fixtures/mock-claude/claude`
- `browse/test/fixtures/network-idle.html`
- `browse/test/fixtures/qa-eval-checkout.html`
- `browse/test/fixtures/qa-eval-spa.html`
- `browse/test/fixtures/qa-eval.html`
- `browse/test/fixtures/responsive.html`
- `browse/test/fixtures/security-bench-haiku-responses.json`
- `browse/test/fixtures/snapshot.html`
- `browse/test/fixtures/spa.html`
- `browse/test/fixtures/states.html`
- `browse/test/fixtures/upload.html`
- `browse/test/from-file-path-validation.test.ts`
- `browse/test/gstack-config.test.ts`
- `browse/test/gstack-update-check.test.ts`
- `browse/test/handoff.test.ts`
- `browse/test/learnings-injection.test.ts`
- `browse/test/pair-agent-e2e.test.ts`
- `browse/test/pair-agent-tunnel-eval.test.ts`
- `browse/test/path-validation.test.ts`
- `browse/test/pdf-flags.test.ts`
- `browse/test/platform.test.ts`
- `browse/test/security-adversarial-fixes.test.ts`
- `browse/test/security-adversarial.test.ts`
- `browse/test/security-audit-r2.test.ts`
- `browse/test/security-bench-ensemble-live.test.ts`
- `browse/test/security-bench-ensemble.test.ts`
- `browse/test/security-bench.test.ts`
- `browse/test/security-bunnative.test.ts`
- `browse/test/security-classifier.test.ts`
- `browse/test/security-integration.test.ts`
- `browse/test/security-live-playwright.test.ts`
- `browse/test/security-review-flow.test.ts`
- `browse/test/security-sidepanel-dom.test.ts`
- `browse/test/security-source-contracts.test.ts`
- `browse/test/security.test.ts`
- `browse/test/server-auth.test.ts`
- `browse/test/sidebar-integration.test.ts`
- `browse/test/sidebar-security.test.ts`
- `browse/test/sidebar-tabs.test.ts`
- `... (174 more)`

## Skills

- `openclaw/skills/gstack-openclaw-ceo-review/SKILL.md`
- `openclaw/skills/gstack-openclaw-investigate/SKILL.md`
- `openclaw/skills/gstack-openclaw-office-hours/SKILL.md`
- `openclaw/skills/gstack-openclaw-retro/SKILL.md`
