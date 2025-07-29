const { Connection, Keypair, clusterApiUrl } = require("@solana/web3.js");
const { createMint } = require("@solana/spl-token");
const fs = require("fs");

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  // Load your keypair (update path as needed)
  const secret = JSON.parse(fs.readFileSync("/home/tushar/Q3_2025_Builder_TusharPamnani/05. Escrow/escrow/Turbin3-wallet.json"));
  const payer = Keypair.fromSecretKey(new Uint8Array(secret));

  // Create Mint X
  const mintX = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    6 // decimals
  );
  // Create Mint Y
  const mintY = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    6 // decimals
  );

  console.log("Mint X:", mintX.toBase58());
  console.log("Mint Y:", mintY.toBase58());
})();