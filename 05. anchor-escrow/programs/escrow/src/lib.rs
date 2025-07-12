#![allow(unexpected_cfgs,deprecated)]

pub mod constants;
pub mod error;
pub mod contexts;  
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use contexts::*; 
pub use state::*;

declare_id!("GJEEyywwkS13vCSNH32YZiGbiDyWdbKsBieM6PYMVViC");

#[program]
pub mod anchor_escrow {
    use super::*;

    pub fn make(ctx: Context<Make>,seed:u64,receive:u64,deposit:u64) -> Result<()> {
        ctx.accounts.init_escrow(seed, receive, &ctx.bumps)?;
        ctx.accounts.deposit(deposit)
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.transfer_to_maker()?;
        ctx.accounts.withdraw_and_close_vault()
    }

    pub fn refund(ctx:Context<Refund>) -> Result<()> {
        ctx.accounts.refund_and_close_vault()
    }
}

