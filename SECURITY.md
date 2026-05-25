# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| Latest release on npm (`@hatchingpoint/point`) | Yes |
| `main` branch | Best-effort |
| Older tagged releases | No |

Install updates from [npm](https://www.npmjs.com/package/@hatchingpoint/point) or tagged [GitHub releases](https://github.com/HatchingPoint/point/releases).

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email **security@hatchingpoint.com** with:

- Description of the issue and potential impact
- Steps to reproduce (proof-of-concept if available)
- Affected versions or commits
- Your preferred contact for follow-up

We aim to acknowledge reports within **72 hours** and provide a remediation timeline when confirmed.

## Safe disclosure

We appreciate responsible disclosure. We will credit reporters in release notes when fixes ship, unless you prefer to remain anonymous.

## Scope

In scope:

- Point compiler, CLI, and LSP (`packages/point`)
- VS Code extension (`packages/point-vscode`) when used with the official Point CLI
- Published npm packages under `@hatchingpoint/*` from this repository

Out of scope:

- Third-party templates' dependency trees (report to the upstream package)
- User-authored `.point` application code
- Infrastructure outside this repository (npm registry, GitHub itself)

## Security expectations for contributors

- Do not commit secrets, tokens, or `.env` files
- Do not run untrusted `.point` from strangers without review — `point run` executes generated code with your user permissions
