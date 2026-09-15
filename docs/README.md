# Swiz Smart — Documentation Index

Welcome to the Swiz Smart project documentation. This directory centralizes all architectural specifications, developer guides, implementation details, and operational documentation for the platform.

---

## 📚 Document Catalog

| Document | Description | Format |
|---|---|---|
| [**DEVELOPER_GUIDE.md**](./DEVELOPER_GUIDE.md) | **Comprehensive Developer & Architecture Guide** — Complete specifications covering contract architectures, bridge coordinator, SQLite event indexer, REST API endpoints, local testing, and multi-chain deployment procedures. | Markdown |
| [**IMPLEMENTATION.md**](./IMPLEMENTATION.md) | **Implementation & Handover SOW** — Core contract custody logic, annual tranche FIFO engine, fixed-supply tokenomics, pricing rules, historical migration procedures, and deployment sequence. | Markdown |
| [**SWIZ_SMART_DEVELOPER_GUIDE.docx**](./SWIZ_SMART_DEVELOPER_GUIDE.docx) | Formal Word Document version of the developer guide for distribution and archival. | Microsoft Word (.docx) |
| [**IMPLEMENTATION_SNAPSHOT.json**](./IMPLEMENTATION_SNAPSHOT.json) | SHA-256 integrity checksums and status of reviewed implementation files. | JSON |

---

## 🏗️ Repository Structure

The repository is organized as a monorepo containing three core components:

```text
SWIZ-PROECT/
├── .gitignore              # Repository-wide ignore rules for security, dependencies & builds
├── README.md               # Quick overview & top-level scripts
├── docs/                   # Centralized documentation repository
│   ├── README.md           # This index
│   ├── DEVELOPER_GUIDE.md  # Comprehensive technical manual
│   ├── IMPLEMENTATION.md   # Scope of work & deployment handover
│   ├── SWIZ_SMART_DEVELOPER_GUIDE.docx
│   └── IMPLEMENTATION_SNAPSHOT.json
├── config/                 # Deployment network & multi-source configurations
│   └── deployment.example.json
├── smartContract/          # Solidity smart contracts & Hardhat environment
│   ├── contracts/          # SzCustody, USDTcWrapper, SourceDepositAdapter, etc.
│   ├── scripts/            # Deployment and configuration tasks
│   └── test/               # Unit and integration test suites
├── Backend/                # Node.js bridge coordinator & SQLite indexer
│   ├── src/                # Bridge listener, database layer, REST endpoints
│   └── test/               # Backend persistence and reconciliation tests
└── frontEnd/               # React + TypeScript + Vite dApp
    ├── src/                # UI components, Wagmi/Reown wallet integration, contract hooks
    └── vercel.json         # Vercel deployment configuration
```

---

## 🔐 Security & Secrets Hygiene

To safeguard sensitive credentials, wallets, and API keys:

1. **Never Commit Secrets**: Never commit `.env` files, private keys (`*.pem`, `*.key`), seed phrases, mnemonics, or production database files (`*.sqlite`, `*.db`).
2. **Environment Templates**: Always copy `.env.example` to `.env` locally in each package (`smartContract/`, `Backend/`, `frontEnd/`) and populate with your own credentials.
3. **Dedicated Signers**: Never share private keys between the deployer, admin multisig, and automated bridge relayer. Relayer keys must only reside on the secure backend server.
4. **Hardware Wallets & Multisig**: Production contract ownership (`ADMIN_ROLE`, `DEFAULT_ADMIN_ROLE`) must be transferred to a Gnosis Safe multisig or hardware wallet upon deployment.

---

## 🚀 Getting Started

Refer to [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) and [IMPLEMENTATION.md](./IMPLEMENTATION.md) for detailed deployment sequences and setup instructions.

```bash
# 1. Smart Contracts
cd smartContract
npm ci
npm test

# 2. Backend Indexer & Bridge
cd ../Backend
npm ci
npm test
npm start

# 3. Frontend Application
cd ../frontEnd
npm ci
npm run dev
```
