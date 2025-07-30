# Lazy Escrow

This program implements an Escrow contract using Anchor Framework 0.31.0 with custom discriminators for gas optimization. The escrow enables trustless token swaps between two parties.

The Escrow is a Solana program that holds assets until exchange conditions are met. A user (`maker`) defines the agreement conditions by depositing a given amount of token A (`amount_a` of `mint_a`) into a vault owned by the program in exchange for a specified amount of token B (`amount_b` of `mint_b`). Any user (`taker`) can accept this offer by depositing the expected amount of token B and atomically receiving the tokens from the vault.

---

## Let's walk through the architecture:

For this program, we will have the Escrow state account that consists of:

```rust
#[account]
pub struct Escrow {
    pub maker: Pubkey,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
    pub bump: u8,
}
```

### In this state account, we will store:

- `maker`: The user that will initiate the escrow.

- `mint_a`: The mint address of the token that the maker is trading.

- `mint_b`: The mint address of the token that the maker wants to receive.

- `amount_a`: The amount of mint_a tokens that the maker is depositing.

- `amount_b`: The amount of mint_b tokens that the maker wants to receive.

- `bump`: Since our Escrow account will be a PDA (Program Derived Address), we store the bump for signing authority.

The account uses Anchor's standard account structure with proper space calculation for rent exemption.

---

### The maker will be able to define the deal conditions. For that, we create the following context:

```rust
#[derive(Accounts)]
pub struct Maker<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker
    )]
    pub maker_ata_a: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = maker,
        space = Escrow::INIT_SPACE,
        seeds = [b"escrow", maker.key().as_ref(), escrow.amount_a.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        init,
        payer = maker,
        associated_token::mint = mint_a,
        associated_token::authority = escrow
    )]
    pub vault: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

Let's have a closer look at the accounts that we are passing in this context:

- `maker`: The person creating the escrow. Will be a signer of the transaction, marked as mutable since lamports will be deducted for account creation.

- `mint_a`: The Mint Account representing the asset to be sent by the maker (and received by the taker).

- `mint_b`: The Mint Account representing the asset to be received by the maker (and sent by the taker).

- `maker_ata_a`: The Associated Token Account that holds the maker's mint_a tokens. Mutable as assets are transferred from this account.

- `escrow`: The Escrow account holding the state of the exchange agreement. We derive the Escrow PDA from "escrow", the maker's public key, and the amount_a to ensure uniqueness per trade.

- `vault`: An Associated Token Account to hold the mint_a tokens transferred from the maker. The escrow PDA holds authority over these funds until the agreement is completed or refunded.

- `associated_token_program`: The Associated Token Program for creating token accounts.

- `token_program`: The SPL Token Program for token operations.

- `system_program`: The System Program responsible for account initialization.

### We then implement some functionality for our Make context:

```rust
impl<'info> Maker<'info> {
    pub fn init_escrow(&mut self, amount_a: u64, amount_b: u64, bumps: &MakerBumps) -> Result<()> {
        self.escrow.set_inner(Escrow {
            maker: self.maker.key(),
            mint_a: self.mint_a.key(),
            mint_b: self.mint_b.key(),
            amount_a,
            amount_b,
            bump: bumps.escrow,
        });
        Ok(())
    }

    pub fn transfer_token_a(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.maker_ata_a.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.maker.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, self.escrow.amount_a)
    }
}
```

In the `init_escrow` function, we initialize the escrow account. In this case, as we are using the `LazyAccount`, we need to use the `load_mut` method to deserialize the account and set the data content.

In the `transfer_token_a` function, we transfer tokens from the maker's associated token account to the vault account. In this case, for reading a individual data field in the escrow account, we use the `load_<field>` method of the `LazyAccount`. The lazy account allow us to not load the entire account, saving us some memory and compute units.

---

### The taker can then take the open offer and deposit the amount expected by the maker and receive the tokens from the vault to their account. For that, we create the following context:

```rust
#[derive(Accounts)]
pub struct Taker<'info>{
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(mut)]
    pub maker: SystemAccount<'info>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_b,
        associated_token::authority = maker,
    )]
    pub maker_ata_b: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_a,
        associated_token::authority = taker,
    )]
    pub taker_ata_a: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = taker,
    )]
    pub taker_ata_b: Account<'info, TokenAccount>,
    #[account(
        mut,
        close = maker,
        seeds = [b"escrow", maker.key().as_ref(), escrow.amount_a.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
```

In this context, we are passing all the accounts needed to transfer mint_b from the taker to the maker, transfer mint_a from the vault to the taker, and close accounts:

- `taker`: The account accepting the exchange proposed by the maker in the escrow.

- `maker`: The account that initialized the escrow.

- `mint_a`: The mint of the token the maker is depositing and the taker is receiving.

- `mint_b`: The mint of the token the maker is receiving and the taker is sending.

- `vault`: The vault account currently holding the mint_a tokens until the condition is met. Mutable because its funds are transferred to the taker.

- `maker_ata_b`: The maker's ATA for mint_b. May not exist yet, so initialized with 'init_if_needed'.

- `taker_ata_a`: The taker's ATA for mint_a. May not exist yet, so initialized with 'init_if_needed'.

- `taker_ata_b`: The taker's ATA from which mint_b tokens are transferred. Must be mutable.

- `escrow`: The Escrow account holding the exchange agreement state. Upon closure, rent is transferred back to the maker.

- `token_program`: The SPL Token Program.

- `associated_token_program`: The Associated Token Program.

- `system_program`: The System Program.

### We then implement some functionality for our Take context:

```rust
impl<'info> Taker<'info> {
    pub fn transfer_token_b(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.taker_ata_b.to_account_info(),
            to: self.maker_ata_b.to_account_info(),
            authority: self.taker.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, self.escrow.amount_b)
    }

    pub fn transfer_token_a(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.taker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };
        let seeds = &[
            b"escrow",
            self.maker.key().as_ref(),
            self.escrow.amount_a.to_le_bytes().as_ref(),
            &[self.escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(cpi_ctx, self.escrow.amount_a)
    }

    pub fn close_vault(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };
        let seeds = &[
            b"escrow",
            self.maker.key().as_ref(),
            self.escrow.amount_a.to_le_bytes().as_ref(),
            &[self.escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        close_account(cpi_ctx)
    }
}
```

In the `transfer_token_b` function, we transfer mint_b tokens from the taker's associated token account to the maker's associated token account.

In the `transfer_token_a` function, we transfer mint_a tokens from the vault account to the taker's associated token account. Since the vault authority is the escrow PDA, we need to provide the seeds for signing.

In the `close_vault` function, we close the vault account and rent is claimed by the maker. Since this involves a PDA authority, we provide the seeds for signing.

These functions directly access the escrow account fields without using LazyAccount methods.

---

### The maker of an escrow can be refunded of the tokens that are in the vault and close the escrow account, if the exchange did not occur yet. For that, we create the following context:

```rust
#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    pub mint_a: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
    )]
    pub maker_ata_a: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        close = maker,
        seeds = [b"escrow", maker.key().as_ref(), escrow.amount_a.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
```

In this context, we are passing all the accounts needed to refund the funds and close the escrow account:

- `maker`: The account refunding the funds and closing the escrow account.

- `mint_a`: The mint of the token the maker deposited in the vault.

- `maker_ata_a`: The maker's Associated Token Account for mint_a. Mutable because it will receive the refunded tokens.

- `vault`: The vault account currently holding the mint_a tokens. Mutable because its funds are being transferred back to the maker.

- `escrow`: The Escrow account holding the exchange agreement state. Upon closure, rent is transferred back to the maker.

- `token_program`: The SPL Token Program.

- `associated_token_program`: The Associated Token Program.

- `system_program`: The system program.

### We then implement some functionality for our Refund context:

```rust
impl<'info> Refund<'info> {
    pub fn refund_to_maker(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.maker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };
        let seeds = &[
            b"escrow",
            self.maker.key().as_ref(),
            self.escrow.amount_a.to_le_bytes().as_ref(),
            &[self.escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(cpi_ctx, self.escrow.amount_a)
    }

    pub fn close_vault(&mut self) -> Result<()> {
        let close_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };
        let seeds = &[
            b"escrow",
            self.maker.key().as_ref(),
            self.escrow.amount_a.to_le_bytes().as_ref(),
            &[self.escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        let ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            close_accounts,
            signer_seeds,
        );
        close_account(ctx)
    }
}
```

In the `refund_to_maker` function, we transfer the tokens from the vault account back to the maker's associated token account.

In the `close_vault` function, we close the vault account and rent is claimed by the maker. Since the vault authority is the escrow PDA, we provide the seeds for signing.

Both functions directly access the escrow account fields without using LazyAccount methods.

---

### The program instructions are implemented as follows:

```rust
#[program]
pub mod lazy_escrow {
    use super::*;

    pub fn make(ctx: Context<Maker>, amount_a: u64, amount_b: u64) -> Result<()> {
        ctx.accounts.init_escrow(amount_a, amount_b, &ctx.bumps)?;
        ctx.accounts.transfer_token_a()
    }

    pub fn take(ctx: Context<Taker>) -> Result<()> {
        ctx.accounts.transfer_token_b()?;
        ctx.accounts.transfer_token_a()?;
        ctx.accounts.close_vault()
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund_to_maker()?;
        ctx.accounts.close_vault()
    }
}
```

The program provides three main instructions:
- `make`: Creates an escrow and deposits tokens
- `take`: Completes the exchange by transferring tokens between parties
- `refund`: Returns deposited tokens to the maker and closes the escrow

