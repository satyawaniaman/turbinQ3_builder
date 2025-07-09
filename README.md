# Turbin3 — Prerequisites & Starter

This repository contains my submissions and practice code for the Turbin3 bootcamp.

## 📁 Folder Structure
```
.
├── 01. Turbin3-TS-PreReq
├── 02. Turbin3-RS-PreReq
├── Solana-Starter
├── escrow
├── README.md
```

### 01. Turbin3-TS-PreReq
TypeScript-based prerequisite tasks for the bootcamp:
- ✅ Created and funded dev & Turbin3 wallets
- ✅ Transferred funds between wallets
- ✅ Minted my proof-of-completion NFT
- ✅ Stored my GitHub username on-chain

**Key files:**
- `airdrop.ts` — Airdrop SOL to wallet
- `keygen.ts` — Generate wallets
- `enroll.ts` — Enroll in the program (on-chain)
- `transfer.ts` — Transfer SOL
- `test.ts`, `decodeWallet.ts` — Misc helpers
- `programs/Turbin3_prereq.ts` — Smart contract interaction

### 02. Turbin3-RS-PreReq
Rust-based prerequisite tasks for the bootcamp:
- ✅ Created and funded dev & Turbin3 wallets
- ✅ Transferred funds between wallets
- ✅ Minted my proof-of-completion NFT
- ✅ Stored my GitHub username on-chain

**Key functions:**
| Function           | Purpose                                      |
|--------------------|----------------------------------------------|
| `keygen()`         | Generate a new wallet and save the private key |
| `airdrop()`        | Airdrop 2 SOL on devnet                       |
| `transfer_sol()`   | Transfer 0.1 SOL to the registered Turbin3 wallet |
| `drain_wallet()`   | Transfer all remaining funds to the Turbin3 wallet |
| `submit_rs()`      | Call the on-chain `submit_rs` instruction to mint NFT |
| `print_pda_and_mint()` | Debug helper to print derived PDA and signer pubkey |

### Solana-Starter
This folder contains the starter code provided in the bootcamp for initial classes & exploration.

**Key topics & files:**

**NFT Minting:**
- `nft_image.ts` — Upload & store NFT image
- `nft_metadata.ts` — Create & upload NFT metadata
- `nft_mint.ts` — Mint an NFT on devnet

**SPL Tokens:**
- `spl_init.ts` — Initialize an SPL token mint
- `spl_metadata.ts` — Attach metadata to SPL token
- `spl_mint.ts` — Mint SPL tokens

Additional utilities & vault interactions are also included under `cluster1`, `prereqs`, `programs`, and `tools`.

### Escrow/Vault
This folder contains a Solana smart contract ("vault") built with Anchor, and a suite of tests to demonstrate its usage. The vault program allows users to deposit, withdraw, and close a vault account securely on Solana.

**Features:**
- ✅ Initialize a vault for a user
- ✅ Deposit SOL into the vault
- ✅ Withdraw SOL from the vault
- ✅ Close the vault and reclaim rent
- ✅ Comprehensive TypeScript tests with Anchor log/error reporting

**Instruction summary:**
- `initialize` — Creates a new vault and state PDA for the user
- `deposit` — Transfers SOL from the user to the vault PDA
- `withdraw` — Transfers SOL from the vault PDA back to the user
- `close` — Closes the vault and returns rent to the user

See `escrow/README.md` for full details and instructions.

## 🛠️ Getting Started

**Install dependencies:**
```bash
cd 01.\ Turbin3-TS-PreReq
yarn install
```
Or for Solana-Starter:
```bash
cd Solana-Starter/ts
yarn install
```

**Run a script:**
```bash
yarn <script>
```
Replace `<script>` with the desired file name (e.g., `nft_mint`).

## 📜 Notes
- All tasks were run on Solana Devnet.
- Rust contracts use the Anchor framework.
- NFT & SPL examples are self-explanatory by filename and demonstrate the basic Solana flows.

## 🔗 Useful Links
- [Solana Developer Docs](https://docs.solana.com/)
- [Anchor Framework Docs](https://project-serum.github.io/anchor/)
- [Metaplex NFT Standard](https://docs.metaplex.com/)
- [SPL Token Docs](https://spl.solana.com/token)