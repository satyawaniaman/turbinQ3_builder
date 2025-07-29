// This program implements a constant product Automated Market Maker (AMM) on Solana using Anchor.
//
// Features:
// - initialize: Sets up a new AMM pool with two token vaults, an LP mint, and configuration.
// - deposit: Allows users to add liquidity to the pool and mint LP tokens representing their share.
// - swap: Allows users to swap between the two tokens using the constant product formula (x*y=k).
// - withdraw: Allows users to burn their LP tokens and withdraw their proportional share of the pool's tokens.
//
// Each instruction is documented below and in the corresponding instruction module.

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("9DM7Hp2RLtGua9Fi1ZiAd5paK4PDZ3ZxRf8tQua1Q2mW");

#[program]
pub mod amm {
    use super::*;

    /// Initializes a new AMM pool with the given seed, fee, and optional authority.
    /// Creates the config, LP mint, and vaults for both tokens.
    pub fn initialize(ctx: Context<Initialize>, seed: u64, fee: u16, authority: Option<Pubkey>) -> Result<()> {
        ctx.accounts.init(seed, fee, authority, ctx.bumps)
    }

    /// Deposits tokens into the pool and mints LP tokens to the user.
    /// The user receives LP tokens representing their share of the pool.
    pub fn deposit(ctx: Context<Deposit>, amount: u64, max_x: u64, max_y: u64) -> Result<()> {
        ctx.accounts.deposit(amount, max_x, max_y)
    }

    /// Swaps tokens using the constant product formula (x*y=k).
    /// The user provides the input amount, minimum output, and direction (x_to_y).
    pub fn swap(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64, x_to_y: bool) -> Result<()> {
        ctx.accounts.swap(amount_in, min_amount_out, x_to_y)
    }

    /// Withdraws liquidity by burning LP tokens and transferring the user's share of the pool tokens.
    /// The user receives their proportional share of both vault_x and vault_y.
    pub fn withdraw(ctx: Context<Withdraw>, lp_amount: u64, min_x: u64, min_y: u64) -> Result<()> {
        ctx.accounts.withdraw(lp_amount, min_x, min_y)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fee_calculation() {
        // Example test: replace with real logic
        let fee = 30u16;
        assert_eq!(fee, 30);
    }

    // Add more unit tests for your pure Rust logic here
}