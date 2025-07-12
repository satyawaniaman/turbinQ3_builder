import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVault } from "../target/types/anchor_vault";
import { expect } from "chai";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "bn.js";

describe("anchor_vault", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.anchorVault as Program<AnchorVault>;

  const vaultState = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vaultState"), provider.wallet.publicKey.toBuffer()],
    program.programId
  )[0];

  const vault = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), vaultState.toBuffer()],
    program.programId
  )[0];

  it("should initialize vault!", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accountsPartial({
        user: provider.wallet.publicKey,
        vaultState,
        vault,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`Transaction signature:${tx}`);

    const vaultStateAccount = await program.account.vaultState.fetch(
      vaultState
    );

    expect(vaultStateAccount.stateBump).to.be.a("number");
    expect(vaultStateAccount.vaultBump).to.be.a("number");
  });

  it("should deposit Sol", async () => {
    const depositAmount = 0.2 * LAMPORTS_PER_SOL;
    const initialAmt = await provider.connection.getBalance(vault);

    const tx = await program.methods
      .deposit(new BN(depositAmount))
      .accountsPartial({
        user: provider.wallet.publicKey,
        vaultState,
        vault,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`deposit transaction signature:${tx}`);

    const finalAmt = await provider.connection.getBalance(vault);

    expect(finalAmt - initialAmt).to.equal(depositAmount);
  });

  it("should withdraw sol", async () => {
    const withdrawAmt = 0.1 * LAMPORTS_PER_SOL;

    const initialVaultAmt = await provider.connection.getBalance(vault);
    const initialUserAmt = await provider.connection.getBalance(
      provider.wallet.publicKey
    );

    const tx = await program.methods
      .withdraw(new BN(withdrawAmt))
      .accountsPartial({
        user: provider.wallet.publicKey,
        vaultState,
        vault,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`withdraw transaction signature:${tx}`);

    const finalVaultAmt = await provider.connection.getBalance(vault);
    const finalUserAmt = await provider.connection.getBalance(
      provider.wallet.publicKey
    );

    expect(initialVaultAmt - finalVaultAmt).to.equal(withdrawAmt);
    expect(finalUserAmt).to.be.greaterThan(initialUserAmt);
  });

  it("should close the vault", async () => {
    const initialUserAmt = await provider.connection.getBalance(
      provider.wallet.publicKey
    );

    const tx = await program.methods
      .close()
      .accountsPartial({
        user: provider.wallet.publicKey,
        vault,
        vaultState,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`close transaction signature:${tx}`);

    const finalVaultAmt = await provider.connection.getBalance(vault);
    const finalUserAmt = await provider.connection.getBalance(
      provider.wallet.publicKey
    );

    expect(finalVaultAmt).to.equal(0);
    expect(finalUserAmt).to.be.greaterThan(initialUserAmt);

    try {
      await program.account.vaultState.fetch(vaultState);
      throw new Error("Vault state should be closed");
    } catch (error) {
      expect(error.message).to.include("Account does not exist");
    }
  });
});
