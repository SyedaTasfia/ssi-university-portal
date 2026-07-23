# SSI University Portal — Passwordless Login with Verifiable Credentials

A University Portal where students log in by presenting a **"Student ID" Verifiable
Credential** from their mobile wallet instead of a password.

**Demo video:**

 [![SSI University Portal Demo](https://img.youtube.com/vi/oAaiBec4D_E/0.jpg)](https://www.youtube.com/watch?v=oAaiBec4D_E)

## What it demonstrates

- Issuing a Student ID credential (`student_name`, `student_id`, `department`,
  `email`) to a student's mobile wallet
- Passwordless login: the portal shows a QR **proof request**; the student scans
  it and presents the credential; the backend verifies the proof and creates a
  session
- Two protected pages (Dashboard, Profile) accessible without re-authentication,
  plus working Logout
- 1-to-1 secure messaging between a student and a faculty member over
  a direct DIDComm connection (basic message protocol)

## Architecture

- **SSI agent:** ACA-Py 0.12.3 (same version pinned by the reference tutorial),
  run via Docker Compose. Handles DIDs, schema/cred-def publishing, credential
  issuance and proof verification. The single agent acts as both issuer and
  verifier, which the reference tutorial explicitly allows.
- **Backend:** Node.js + Express. Talks to ACA-Py's admin API over HTTP and
  reacts to ACA-Py webhooks. No SSI library needed in app code.
- **Wallet (holder):** Bifold build provided by the reference tutorial
  (Android). BC Wallet (also Bifold-based) works on iOS.
- **Login flow:** connectionless proof request wrapped in an out-of-band
  invitation, so a student can log in from the QR without a pre-existing
  connection for that browser session.

## Prerequisites

- Docker Desktop, Node.js ≥ 20, ngrok account (free static domain), Git
- Android/iOS phone with a Bifold-based wallet installed

## Setup

1. Clone this repo and `cd` into it.
2. `npm install`
3. Copy `.env.example` to `.env` and fill in:
   - `AGENT_SEED`: any 32-character string. Register it at
     https://test.bcovrin.vonx.io ("Register from seed") first.
   - `PUBLIC_ENDPOINT`: your ngrok static domain (https).
4. Start the tunnel: `ngrok http --url=<your-domain> 8030`
5. Start the agent: `docker compose up`
6. Publish schema + credential definition: `npm run register-schema`
   then paste the printed `SCHEMA_ID` and `CRED_DEF_ID` into `.env`.
7. Start the portal: `npm run dev` → http://localhost:3000

## Demo walkthrough (matches the video)

1. **Issue:** open `/admin`, enter student details → scan the QR with the wallet
   → accept the connection → click *Issue Student ID credential* → accept the
   offer in the wallet.
2. **Login:** open `/` (login page) → scan the login QR → *Share* the credential
   → the browser is redirected to the Dashboard automatically.
3. **Protected pages:** navigate Dashboard ⇄ Profile freely (no re-auth).
4. **Logout:** click *Log out*; direct URLs to `/dashboard` and `/profile` now
   redirect back to the login page.
5. **Bonus chat:** open `/faculty`, create the chat QR, scan → send messages
   both ways over DIDComm basic messages.

## Key endpoints used (ACA-Py admin API)

| Purpose | Endpoint |
|---|---|
| Publish schema / cred-def | `POST /schemas`, `POST /credential-definitions` |
| Connection invitation | `POST /out-of-band/create-invitation` (handshake) |
| Issue credential | `POST /issue-credential-2.0/send` |
| Login proof request | `POST /present-proof-2.0/create-request` + OOB invitation with a `present-proof` attachment (connectionless) |
| Faculty chat | `POST /connections/{id}/send-message` |
| Event handling | ACA-Py webhooks → `/webhooks/topic/{topic}` |

## Known limitations (deliberate, for demo scope)

- ACA-Py admin API runs with `--admin-insecure-mode`; the admin page has no
  auth. Fine on localhost, never for production.
- Application state (onboardings, logins, chat) is in-memory; restart clears it.
- No credential revocation (`support_revocation: false`).
- BCovrin is a public **test** ledger and is occasionally reset; if that
  happens, re-register the seed and re-run `npm run register-schema`.



## Credits

- Reference tutorial: https://github.com/CrypticConsultancyLimited/ssi-tutorial
- ACA-Py: https://github.com/openwallet-foundation/acapy
- BC wallet: https://github.com/bcgov/bc-wallet-mobile