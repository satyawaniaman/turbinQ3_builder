use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, 
    token::{Mint, TokenAccount, Token, TransferChecked, transfer_checked}
};

use crate::Escrow;

#[derive(Accounts)]
#[instruction(seed:u64)]
pub struct Make<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        mint::token_program = token_program
    )]
    pub mint_a: Account<'info, Mint>,
    #[account(
        mint::token_program = token_program
    )]
    pub mint_b: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_a: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = maker,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", maker.key().as_ref(),seed.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        init,
        payer = maker,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub vault: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Make<'info> {
    pub fn init_escrow(&mut self,seed:u64,receive:u64,bumps:&MakeBumps) -> Result<()> {
        self.escrow.set_inner(Escrow {
            seed:seed,
            receive:receive,
            mint_a: self.mint_a.key(),
            mint_b: self.mint_b.key(),
            bump:bumps.escrow,
            maker: self.maker.key(),
        });
        Ok(())
    }

    pub fn deposit(&self,deposit:u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = TransferChecked{
            from:self.maker_ata_a.to_account_info(),
            to:self.vault.to_account_info(),
            mint:self.mint_a.to_account_info(),
            authority:self.maker.to_account_info()
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx,deposit,self.mint_a.decimals)
    }
}