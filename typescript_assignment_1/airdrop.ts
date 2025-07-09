import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import wallet from "./dev-wallet.json";

// Convert the stored private key back to Uint8Array
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Connect to Solana devnet
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
  try {
    // Request 2 SOL
    const txhash = await connection.requestAirdrop(
      keypair.publicKey,
      2 * LAMPORTS_PER_SOL
    );

    console.log(`Success! Check out your TX here:
https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
