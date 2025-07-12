import wallet from "../turbin3-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";
// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    //1. Load image
    const imagePath = await readFile(
      "/Users/amansatyawani/Desktop/Turbin3_Q3_Builder_Program/solana-starter/ts/cluster1/assets/pepe.jpeg"
    );
    //2. Convert image to generic file.
    const genericFile = createGenericFile(imagePath, "pepe.jpeg", {
      contentType: "image/jpeg",
    });
    //3. Upload image
    const [uri] = await umi.uploader.upload([genericFile]);
    console.log("Image URI:", uri);
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();
