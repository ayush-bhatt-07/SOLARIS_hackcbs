# Sprint 0 baseline

31 October 2026, existing working tree. Commands run from the repository root:

| Command | Result | Meaning |
| --- | --- | --- |
| `npm test` | PASS, 10 checks | Five residential arithmetic checks, two RBAC helper checks, three commercial calculation checks. |
| `npm run lint` | PASS | TypeScript compilation without emit. |
| `npm run build` | PASS | Frontend bundle generated; does not deploy/test Express. |
| `npm run test:api` | PASS, 11 checks | Real HTTP requests to existing Express routes. Required execution outside sandbox because loopback connections returned EACCES inside sandbox. |

Build warnings: Vite config uses `__dirname`; main JS chunk exceeds 500 kB (522.04 kB before gzip). Neither warning fails the build.

Additional baseline: `npm run test:api` exercises Express over an ephemeral loopback HTTP port. It checks anonymous/unknown identities, membership response, own-shop access, other-shop denial, property-list restrictions, 24-shop manager view, cross-organisation denial and engineer project assignment. It uses existing demo headers and does not establish authentication security.

Not verified: browser login, onboarding and bill intake, complete residential navigation, mobile layout, real Gemini, persistence/migration execution, RFQ round trip, private document isolation, tenant turnover, production deployment or regulatory correctness. Existing test titles that mention compliance/reconciliation are not evidence of external approval.
