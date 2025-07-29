import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Amm } from "../target/types/amm";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

// This test suite covers the full AMM lifecycle: initialize, deposit, swap (both directions), and withdraw.
// It uses Anchor's TypeScript client and derives all PDAs and ATAs as required by the program.

describe("amm", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.amm as Program<Amm>;

  // Keypairs and state shared across tests
  let initializer: anchor.web3.Keypair;
  let user: anchor.web3.Keypair;
  let mintX: PublicKey, mintY: PublicKey;
  let config: PublicKey, mintLp: PublicKey, vaultX: PublicKey, vaultY: PublicKey;
  let seed: anchor.BN;
  let fee: number;

  before(async () => {
    // Generate keypairs for the pool initializer and a user
    initializer = anchor.web3.Keypair.generate();
    user = anchor.web3.Keypair.generate();
    seed = new anchor.BN(123456789); // Arbitrary pool seed
    fee = 500; // Arbitrary fee (basis points)

    // Fund both accounts with SOL for transactions
    for (const kp of [initializer, user]) {
      const sig = await anchor.getProvider().connection.requestAirdrop(
        kp.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await anchor.getProvider().connection.confirmTransaction(sig);
    }

    // Create mints for X and Y tokens (pool assets)
    mintX = await createMint(anchor.getProvider().connection, initializer, initializer.publicKey, null, 6);
    mintY = await createMint(anchor.getProvider().connection, initializer, initializer.publicKey, null, 6);

    // Derive all PDAs as per the program's logic
    // Config PDA: ["config", seed]
    [config] = await PublicKey.findProgramAddress(
      [Buffer.from("config"), seed.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    // LP Mint PDA: ["lp", config]
    [mintLp] = await PublicKey.findProgramAddress(
      [Buffer.from("lp"), config.toBuffer()],
      program.programId
    );
    // Vaults: ATAs owned by config PDA
    vaultX = await getAssociatedTokenAddress(mintX, config, true);
    vaultY = await getAssociatedTokenAddress(mintY, config, true);
  });

  it("Should initialize AMM pool successfully", async () => {
    // The pool initializer sets up the config, LP mint, and vaults in a single transaction
    await program.methods
      .initialize(seed, fee, null)
      .accounts({
        initializer: initializer.publicKey,
        mintX,
        mintY,
        mintLp,
        config,
        vaultX,
        vaultY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([initializer])
      .rpc();
  });

  it("Should deposit initial liquidity successfully", async () => {
    // User creates ATAs for X, Y, and LP tokens
    const userAtaX = (await getOrCreateAssociatedTokenAccount(
      anchor.getProvider().connection,
      user,
      mintX,
      user.publicKey
    )).address;
    const userAtaY = (await getOrCreateAssociatedTokenAccount(
      anchor.getProvider().connection,
      user,
      mintY,
      user.publicKey
    )).address;
    const userAtaLp = (await getOrCreateAssociatedTokenAccount(
      anchor.getProvider().connection,
      user,
      mintLp,
      user.publicKey
    )).address;

    // Mint tokens to user for deposit
    await mintTo(anchor.getProvider().connection, initializer, mintX, userAtaX, initializer, 1_000_000);
    await mintTo(anchor.getProvider().connection, initializer, mintY, userAtaY, initializer, 1_000_000);

    // Deposit: user provides X and Y, receives LP tokens
    await program.methods
      .deposit(new anchor.BN(100_000), new anchor.BN(100_000), new anchor.BN(200_000))
      .accounts({
        user: user.publicKey,
        mintX,
        mintY,
        config,
        vaultX,
        vaultY,
        mintLp,
        userX: userAtaX,
        userY: userAtaY,
        userLp: userAtaLp,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
  });

  it("Should swap X for Y successfully", async () => {
    // User mints more X to swap for Y
    const userAtaX = await getAssociatedTokenAddress(mintX, user.publicKey);
    const userAtaY = await getAssociatedTokenAddress(mintY, user.publicKey);
    await mintTo(anchor.getProvider().connection, initializer, mintX, userAtaX, initializer, 100_000);

    // Record Y balance before swap
    const yBefore = BigInt((await program.provider.connection.getTokenAccountBalance(userAtaY)).value.amount);

    // Swap X for Y (xToY = true)
    // Only use account names required by the Anchor-generated types
    await program.methods
      .swap(new anchor.BN(50_000), new anchor.BN(1), true)
      .accounts({
        user: user.publicKey,
        mintX,
        mintY,
        config,
        vaultX,
        vaultY,
        userX: userAtaX,
        userY: userAtaY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Confirm Y balance increased
    const yAfter = BigInt((await program.provider.connection.getTokenAccountBalance(userAtaY)).value.amount);
    if (yAfter <= yBefore) throw new Error("Swap did not increase Y balance");
  });

  it("Should swap Y for X successfully", async () => {
    // User mints more Y to swap for X
    const userAtaX = await getAssociatedTokenAddress(mintX, user.publicKey);
    const userAtaY = await getAssociatedTokenAddress(mintY, user.publicKey);
    await mintTo(anchor.getProvider().connection, initializer, mintY, userAtaY, initializer, 100_000);

    // Record X balance before swap
    const xBefore = BigInt((await program.provider.connection.getTokenAccountBalance(userAtaX)).value.amount);

    // Swap Y for X (xToY = false)
    await program.methods
      .swap(new anchor.BN(50_000), new anchor.BN(1), false)
      .accounts({
        user: user.publicKey,
        mintX,
        mintY,
        config,
        vaultX,
        vaultY,
        userX: userAtaX,
        userY: userAtaY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Confirm X balance increased
    const xAfter = BigInt((await program.provider.connection.getTokenAccountBalance(userAtaX)).value.amount);
    if (xAfter <= xBefore) throw new Error("Swap did not increase X balance");
  });

  it("Should withdraw liquidity successfully", async () => {
    // User withdraws all LP tokens for their share of X and Y
    const userAtaX = await getAssociatedTokenAddress(mintX, user.publicKey);
    const userAtaY = await getAssociatedTokenAddress(mintY, user.publicKey);
    const userAtaLp = await getAssociatedTokenAddress(mintLp, user.publicKey);

    // Record balances before withdraw
    const xBefore = BigInt((await program.provider.connection.getTokenAccountBalance(userAtaX)).value.amount);
    const yBefore = BigInt((await program.provider.connection.getTokenAccountBalance(userAtaY)).value.amount);
    const lpBefore = BigInt((await program.provider.connection.getTokenAccountBalance(userAtaLp)).value.amount);

    // Withdraw all LP tokens (minX/minY = 0 for test)
    await program.methods
      .withdraw(new anchor.BN(lpBefore), new anchor.BN(0), new anchor.BN(0))
      .accounts({
        user: user.publicKey,
        mintX,
        mintY,
        config,
        vaultX,
        vaultY,
        mintLp,
        userX: userAtaX,
        userY: userAtaY,
        userLp: userAtaLp,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Confirm X and Y balances increased
    const xAfter = BigInt((await program.provider.connection.getTokenAccountBalance(userAtaX)).value.amount);
    const yAfter = BigInt((await program.provider.connection.getTokenAccountBalance(userAtaY)).value.amount);
    if (xAfter <= xBefore) throw new Error("Withdraw did not increase X balance");
    if (yAfter <= yBefore) throw new Error("Withdraw did not increase Y balance");
  });
});