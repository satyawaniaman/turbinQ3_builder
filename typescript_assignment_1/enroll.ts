import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { IDL, Turbin3Prereq } from "./programs/Turbin3_prereq";
import wallet from "./Turbin3-wallet.json";

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNheX7d"
);

// Import keypair from wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Create devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment: "confirmed",
});

// Create program
const program: Program<Turbin3Prereq> = new Program(IDL, provider);

// Create PDA for prereq account
const account_seeds = [Buffer.from("prereqs"), keypair.publicKey.toBuffer()];
const [account_key, _account_bump] = PublicKey.findProgramAddressSync(
  account_seeds,
  program.programId
);

// Mint collection address
const mintCollection = new PublicKey(
  "5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2"
);

// Create PDA for authority (this was the missing piece!)
// Authority seeds are "collection" + collection public key
const authority_seeds = [Buffer.from("collection"), mintCollection.toBuffer()];
const [authority_key, _authority_bump] = PublicKey.findProgramAddressSync(
  authority_seeds,
  program.programId
);

// Generate mint account for new asset
const mintTs = Keypair.generate();

// REPLACE "your_github_username_here" with your actual GitHub username!
const GITHUB_USERNAME = "satyawaniaman";

// Execute initialize transaction
async function initialize() {
  try {
    // Check if account already exists
    const accountInfo = await connection.getAccountInfo(account_key);
    if (accountInfo) {
      console.log("Account already initialized, skipping...");
      return;
    }

    const txhash = await program.methods
      .initialize(GITHUB_USERNAME)
      .accountsPartial({
        user: keypair.publicKey,
        account: account_key,
        system_program: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    console.log(`Initialize Success! Check out your TX here:`);
    console.log(`https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Initialize failed: ${e}`);
    // Don't throw, continue to submitTs
  }
}

// Execute submitTs transaction
async function submitTs() {
  try {
    const txhash = await (program.methods as any)
      .submitTs()
      .accountsPartial({
        user: keypair.publicKey,
        account: account_key,
        mint: mintTs.publicKey,
        collection: mintCollection,
        authority: authority_key,
        mpl_core_program: MPL_CORE_PROGRAM_ID,
        system_program: SystemProgram.programId,
      })
      .signers([keypair, mintTs])
      .rpc();

    console.log(`SubmitTs Success! Check out your TX here:`);
    console.log(`https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`SubmitTs failed: ${e}`);
  }
}

// Run both transactions
async function main() {
  console.log("Starting enrollment process...");
  console.log("Public key:", keypair.publicKey.toBase58());

  // Run initialize first
  await initialize();

  // Wait a moment then run submitTs
  console.log("Waiting 5 seconds before submitTs...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  await submitTs();

  console.log("Enrollment complete!");
}

main().catch(console.error);
