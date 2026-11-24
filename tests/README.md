# Tests

| Suite | What it covers | Command |
| --- | --- | --- |
| Unit (`tests/unit`) | Pure logic: availability slots, location rounding & area names, Japanese translation, form validation, generation/age groups, profile-completion gate, formatting, FAQ matcher & AI routing, reactions, notification links | `npm test` |
| Integration (`tests/integration`) | Services against an in-memory fake Supabase: pay-before-complete, demo payments, connection requests/accept/decline/block, post creation gate & map pins, profile saving | `npm test` |
| Regression / E2E (`tests/e2e`) | Real browser flows with two fresh members: sign-up, profile + location + custom availability, paid post, search, respond/accept, live chat, payment popup, review, connections & private messages (edit/react/delete), Japanese switch, phone-width layout, no JS errors | `npm run test:e2e` |

The E2E suite needs the app running (`npm run dev`) and creates real test data
(accounts named `qa.hana.*` / `qa.ken.*@example.com`) in the configured Supabase
project. If Playwright's own browser isn't installed, either run
`npx playwright install chromium` or point `PW_CHROMIUM_PATH` at a Chrome binary.
Use `E2E_BASE_URL` to test another deployment.
