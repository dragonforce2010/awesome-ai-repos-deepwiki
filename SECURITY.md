# Security Policy

## Supported versions

Static content only: security-sensitive issues are primarily about **accidental disclosure** in wiki content or **dependency vulnerabilities** in the build toolchain (`package.json` / `pnpm-lock.yaml`).

## Reporting a vulnerability

If you discover a **valid secret, credential, or PII** published in this repository (for example a leaked token inside a generated markdown file), please:

1. **Do not** open a public issue with the secret material.  
2. Contact the maintainers via a **private channel** (e.g. GitHub Security Advisories for this repo, if enabled) or the contact method listed on the maintainer profile.  
3. Include the **file path** and **commit** (or approximate date) so we can rotate or redact quickly.

## Maintainer hygiene

- Never commit `.env`, API keys, or session tokens.  
- Prefer **placeholders** in example config snippets (e.g. `YOUR_TOKEN_HERE`).  
- Generated artifacts (`00-repo-inventory.md`, `source-manifest.json`) may contain **local absolute paths** from the generator machine; treat that as **operational metadata**, not secrets, but it can still be **privacy-sensitive** — consider redacting or using relative paths before publishing.  
- Run `pnpm audit` periodically and bump devDependencies when appropriate.

## Out of scope

- Content that merely **documents** how upstream projects handle secrets (e.g. environment variable names) is not a vulnerability in this repo unless real credentials are present.  
- **Upstream repositories** analyzed here have their own security policies; report issues in those projects to their maintainers.
