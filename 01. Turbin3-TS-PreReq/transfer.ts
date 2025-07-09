// import {
//   Transaction,
//   SystemProgram,
//   Connection,
//   Keypair,
//   LAMPORTS_PER_SOL,
//   sendAndConfirmTransaction,
//   PublicKey,
// } from "@solana/web3.js";
// import wallet from "./dev-wallet.json";

// // Load dev wallet keypair
// const from = Keypair.fromSecretKey(new Uint8Array(wallet));

// // Turbin3 public address (this is the destination address given in the doc)
// const to = new PublicKey("2gAwqZmY7nRi9XCNQs3CjfSzDiVe5npwK3yS7ijo3E8h");

// // Connect to devnet
// const connection = new Connection("https://api.devnet.solana.com");

// (async () => {
//   try {
//     const transaction = new Transaction().add(
//       SystemProgram.transfer({
//         fromPubkey: from.publicKey,
//         toPubkey: to,
//         lamports: LAMPORTS_PER_SOL / 10, // 0.1 SOL
//       })
//     );

//     transaction.recentBlockhash = (
//       await connection.getLatestBlockhash("confirmed")
//     ).blockhash;
//     transaction.feePayer = from.publicKey;

//     const signature = await sendAndConfirmTransaction(connection, transaction, [
//       from,
//     ]);

//     console.log(`✅ Success! Check out your TX here:
// https://explorer.solana.com/tx/${signature}?cluster=devnet`);
//   } catch (e) {
//     console.error("❌ Transfer failed:", e);
//   }
// })();
import {
  Transaction,
  SystemProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import wallet from "./dev-wallet.json";

const from = Keypair.fromSecretKey(new Uint8Array(wallet));
const to = new PublicKey("2gAwqZmY7nRi9XCNQs3CjfSzDiVe5npwK3yS7ijo3E8h");
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
  try {
    // Get full balance
    const balance = await connection.getBalance(from.publicKey);
    console.log(`💰 Wallet Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    // Create dummy transaction to calculate fee
    let transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance,
      })
    );
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash("confirmed")
    ).blockhash;
    transaction.feePayer = from.publicKey;

    const fee =
      (
        await connection.getFeeForMessage(
          transaction.compileMessage(),
          "confirmed"
        )
      ).value || 0;

    // Adjust lamports to exclude fee
    transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance - fee,
      })
    );
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash("confirmed")
    ).blockhash;
    transaction.feePayer = from.publicKey;

    const sig = await sendAndConfirmTransaction(connection, transaction, [
      from,
    ]);

    console.log(
      `✅ Wallet emptied. TX: https://explorer.solana.com/tx/${sig}?cluster=devnet`
    );
  } catch (e) {
    console.error("❌ Something went wrong:", e);
  }
})();
