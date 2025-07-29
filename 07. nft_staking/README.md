# Solana NFT Staking Program

This directory contains a full-featured NFT staking protocol built for the Solana blockchain using the [Anchor framework](https://project-serum.github.io/anchor/).

**What is NFT Staking?**  
NFT staking allows users to lock up (stake) their NFTs in a smart contract to earn rewards, such as tokens or points, over time. This protocol lets users stake their NFTs, accrue reward points, and claim SPL tokens as rewards, all on Solana.

**Who is this for?**  
- NFT projects wanting to incentivize holders
- Developers learning Solana/Anchor
- Anyone interested in on-chain reward systems

**How does it work?**  
- An admin deploys the program and configures staking parameters (how many points per NFT, how long NFTs must be staked, etc.).
- Users create a staking account and deposit (stake) their NFTs.
- Staked NFTs are held in a secure vault account controlled by the program.
- After a minimum “freeze period,” users can unstake their NFTs and earn points.
- Users can claim their accumulated points as SPL reward tokens.

**Key Concepts:**
- **Staking**: Locking up an NFT in the program’s vault.
- **Freeze Period**: Minimum time an NFT must remain staked before it can be unstaked.
- **Points**: Earned for each NFT staked and can be claimed for reward tokens.
- **Reward Mint**: The SPL token mint used to distribute rewards.

## Features

- **Configurable staking parameters** (points per stake, freeze period, max unstake)
- **NFT staking and unstaking** with freeze period enforcement
- **Reward points accrual** and **claiming SPL reward tokens**
- **Full test coverage** with real Devnet transactions

---

## On-Chain Accounts

The protocol uses several on-chain accounts to track state:

- **StakeConfig**: Stores global settings (points per stake, freeze period, etc.).
- **UserAccount**: Tracks each user’s staked NFT count and reward points.
- **StakeAccount**: Created for each staked NFT, records owner, NFT mint, and stake timestamp.

**Error Handling:**  
The program uses custom errors to ensure safety, such as:
- Trying to unstake before the freeze period ends
- Unstaking when nothing is staked
- Claiming rewards when no points are available
- Arithmetic overflows/underflows

---

## Program Structure

- **Rust/Anchor Program**: Implements staking logic and account management.
- **TypeScript Tests**: End-to-end tests using Anchor and Solana web3.js.
- **Devnet Deployment**: All tests run on Solana Devnet.

---

## Getting Started

### Prerequisites

- Node.js, Yarn
- Rust, Solana CLI, Anchor CLI

### Install dependencies

```bash
cd nft_staking
yarn install
```

### Build and Test

```bash
anchor build
anchor test
```

---

## Staking Flow

1. **Initialize Config**: Admin sets up staking parameters and reward mint.
2. **Initialize User**: Each user creates a staking account.
3. **Stake NFT**: User stakes an NFT, which is transferred to a vault.
4. **Unstake NFT**: After the freeze period, user can unstake and earn points.
5. **Claim Rewards**: User claims SPL tokens based on accrued points.

---

## Test Case Results

All tests are run on Solana Devnet. Each test logs a transaction URL for verification.

| Test Description                        | Devnet Transaction URL                                                                                  |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------|
| Initializes config                      | [3MqMuWzv26bWVcE4vXwmMGLoyx8P7HUxWL8A6xhw5sj3E5rTaTQL1KE4y4yZd2vmyRf37vVWrP8kqmhcpBX6Yvjo](https://explorer.solana.com/tx/3MqMuWzv26bWVcE4vXwmMGLoyx8P7HUxWL8A6xhw5sj3E5rTaTQL1KE4y4yZd2vmyRf37vVWrP8kqmhcpBX6Yvjo?cluster=devnet) |
| Initializes user account                | [4eF2n6xQnqL7UjVZ2kbWjavBguZzepmpMow57qYmUioJirQVui1QierAWUVYxBSh7stU3GTDmEBTz8PxncoZr4m4](https://explorer.solana.com/tx/4eF2n6xQnqL7UjVZ2kbWjavBguZzepmpMow57qYmUioJirQVui1QierAWUVYxBSh7stU3GTDmEBTz8PxncoZr4m4?cluster=devnet) |
| Stakes NFT A                            | [4zNyK9wi1mEe6LsBNmP2Rh3JZncdopt7RBWwRigsVTWKniXuFgCqgazrQUBJJ1paLHw2hkrm3eZdSnXQJ6uQZ6jR](https://explorer.solana.com/tx/4zNyK9wi1mEe6LsBNmP2Rh3JZncdopt7RBWwRigsVTWKniXuFgCqgazrQUBJJ1paLHw2hkrm3eZdSnXQJ6uQZ6jR?cluster=devnet) |
| Unstakes NFT A after freeze period      | [2mjz3ydNnkyuMtvKsbjK1JFfqDboDWHbCqFDJbz84z9awdbdMXA2qx7KkRc1P4dc8SMKxqcGkV82VfiwaWh6vSPu](https://explorer.solana.com/tx/2mjz3ydNnkyuMtvKsbjK1JFfqDboDWHbCqFDJbz84z9awdbdMXA2qx7KkRc1P4dc8SMKxqcGkV82VfiwaWh6vSPu?cluster=devnet) |
| Stakes NFT B                            | [rnhK243ebk6TiytgmFMJbDHVyALtccYocWpQY97AQauYxc9fk7cPBvSTfw3amsVF4KuHjnQU4Mfw73Au1M6UWNp](https://explorer.solana.com/tx/rnhK243ebk6TiytgmFMJbDHVyALtccYocWpQY97AQauYxc9fk7cPBvSTfw3amsVF4KuHjnQU4Mfw73Au1M6UWNp?cluster=devnet) |
| Claims rewards for NFT B stake          | [4ebpLCM8UbFhjCg5cf8cPTU1nEtWrVDorSEu7wPDyXDM8QZeR7NZrkrG4gkySoZBi3PKXCaUZQKGvBDK6M5svhm2](https://explorer.solana.com/tx/4ebpLCM8UbFhjCg5cf8cPTU1nEtWrVDorSEu7wPDyXDM8QZeR7NZrkrG4gkySoZBi3PKXCaUZQKGvBDK6M5svhm2?cluster=devnet) |

---

## Instruction Signatures

| Instruction         | Signature                                                                                                 | Description                                 |
|---------------------|----------------------------------------------------------------------------------------------------------|---------------------------------------------|
| initialize_config   | `initialize_config(ctx: Context<InitializeConfig>, points_per_stake: u8, max_unstake: u8, freeze_period: u32) -> Result<()>` | Initialize staking config and reward mint   |
| initialize_user     | `initialize_user(ctx: Context<InitializeUser>) -> Result<()>`                                            | Create user staking account                 |
| stake               | `stake(ctx: Context<Stake>) -> Result<()>`                                                               | Stake an NFT                               |
| unstake             | `unstake(ctx: Context<Unstake>) -> Result<()>`                                                           | Unstake NFT after freeze period             |
| claim_rewards       | `claim_rewards(ctx: Context<Claim>) -> Result<()>`                                                       | Claim SPL reward tokens                     |

---

## File Structure

- `programs/nft_staking/`: Anchor program (Rust)
- `tests/nft_staking.ts`: End-to-end tests (TypeScript)
- `README.md`: This documentation

---

## References

- [Anchor Docs](https://project-serum.github.io/anchor/)
- [Solana Devnet Explorer](https://explorer.solana.com/?cluster=devnet)

---

**All test cases passed successfully. See the table above for transaction URLs.**