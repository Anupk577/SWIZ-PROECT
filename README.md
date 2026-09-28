# Swiz Smart — SOW implementation

This version replaces the prototype with fixed-supply custody accounting, annual tranche FIFO buybacks, atomic ET payouts, verified source adapters, a persistent bridge/indexer, and signed administrative actions. Existing deployments are immutable and **must be replaced**; the prior addresses and API are incompatible.

Read [IMPLEMENTATION.md](IMPLEMENTATION.md) before configuration or deployment. No production supply, addresses, credentials, source-token approvals, branding or legal copy are assumed.

Use Node 24 or newer. Install each package with `npm ci` in `smartContract`, `Backend`, and `frontEnd`. Run `npm test` in smartContract and Backend; run `npm run build` in frontEnd. Compile contracts then run `npm run export:abis` in smartContract after ABI changes.

The backend is a long-running single worker with SQLite on a persistent volume. Run behind an HTTPS reverse proxy. The frontend may be hosted separately; set its backend URL. Do not deploy the bridge worker as an ephemeral Vercel function.
