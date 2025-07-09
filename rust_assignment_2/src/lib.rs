#[cfg(test)]
mod tests {
    use solana_sdk::{signature::{Keypair,Signer} };

    #[test]
    fn keygen(){
        let kp=Keypair::new();
        println!("You've generated a new Solana wallet: {}", kp.pubkey().to_string());
        println!("To save your wallet, copy and paste the following into a JSON file:");
        println!("{:?}", kp.to_bytes());
    }
    #[test]
    fn test_airdrop() {
    use solana_client::rpc_client::RpcClient;
    use solana_sdk::signature::{read_keypair_file, Signer};

    const RPC_URL: &str = "https://api.devnet.solana.com"; // or use turbine-specific endpoint if required

    // Load keypair from saved wallet file
    let keypair = read_keypair_file("dev-wallet.json")
        .expect("Couldn't find or parse dev-wallet.json");

    let client = RpcClient::new(RPC_URL);

    // Request 2 SOL (2_000_000_000 lamports)
    match client.request_airdrop(&keypair.pubkey(), 2_000_000_000) {
        Ok(signature) => {
            println!("Airdrop success! Check on explorer:");
            println!(
                "https://explorer.solana.com/tx/{}?cluster=devnet",
                signature
            );
        }
        Err(err) => {
            println!("Airdrop failed: {}", err);
        }
        }
    }
    #[test]
fn transfer_sol() {
    use solana_client::rpc_client::RpcClient;
    use solana_program::{pubkey::Pubkey, system_instruction::transfer};
    use solana_sdk::{
        signature::{ Signer, read_keypair_file},
        transaction::Transaction,
    };
    use std::str::FromStr;

    const RPC_URL: &str = "https://api.devnet.solana.com"; // or turbine RPC if instructed

    // Load your devnet wallet
    let keypair = read_keypair_file("dev-wallet.json")
        .expect("Couldn't find dev-wallet.json");

    // Replace this with your real Turbin3 public key
    let to_pubkey = Pubkey::from_str("2gAwqZmY7nRi9XCNQs3CjfSzDiVe5npwK3yS7ijo3E8h")
        .expect("Invalid destination public key");

    let rpc_client = RpcClient::new(RPC_URL);

    let recent_blockhash = rpc_client
        .get_latest_blockhash()
        .expect("Failed to get recent blockhash");

    // Send 0.1 SOL = 1_000_000 lamports
    let transaction = Transaction::new_signed_with_payer(
        &[transfer(&keypair.pubkey(), &to_pubkey, 1_000_000)],
        Some(&keypair.pubkey()),
        &[&keypair],
        recent_blockhash,
    );

    let signature = rpc_client
        .send_and_confirm_transaction(&transaction)
        .expect("Failed to send transaction");

    println!(
        "✅ Success! Explorer link:\nhttps://explorer.solana.com/tx/{}?cluster=devnet",
        signature
    );
}
#[test]
fn empty_wallet() {
    use solana_client::rpc_client::RpcClient;
    use solana_program::{pubkey::Pubkey, system_instruction::transfer};
    use solana_sdk::{
        message::Message,
        signature::{Signer, read_keypair_file},
        transaction::Transaction,
    };
    use std::str::FromStr;

    const RPC_URL: &str = "https://api.devnet.solana.com"; // or turbine-specific RPC

    // Load keypair from file
    let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");

    // Your Turbin3 wallet public key
    let to_pubkey = Pubkey::from_str("2gAwqZmY7nRi9XCNQs3CjfSzDiVe5npwK3yS7ijo3E8h")
        .expect("Invalid destination public key");

    let rpc_client = RpcClient::new(RPC_URL);

    // Step 1: Get balance
    let balance = rpc_client
        .get_balance(&keypair.pubkey())
        .expect("Failed to get balance");

    println!("Wallet balance: {} lamports", balance);

    // Step 2: Get recent blockhash
    let blockhash = rpc_client
        .get_latest_blockhash()
        .expect("Failed to get blockhash");

    // Step 3: Build unsigned message
    let message = Message::new_with_blockhash(
        &[transfer(&keypair.pubkey(), &to_pubkey, balance)],
        Some(&keypair.pubkey()),
        &blockhash,
    );

    // Step 4: Estimate fee
    let fee = rpc_client
        .get_fee_for_message(&message)
        .expect("Failed to get fee");

    println!("Estimated fee: {} lamports", fee);

    // Step 5: Create final transaction with balance - fee
    let transaction = Transaction::new_signed_with_payer(
        &[transfer(&keypair.pubkey(), &to_pubkey, balance - fee)],
        Some(&keypair.pubkey()),
        &[&keypair],
        blockhash,
    );

    // Step 6: Send transaction
    let signature = rpc_client
        .send_and_confirm_transaction(&transaction)
        .expect("Failed to send final transaction");

    println!(
        "✅ All funds transferred! Check TX:\nhttps://explorer.solana.com/tx/{}?cluster=devnet",
        signature
    );
}


#[test]
fn submit_rs() {
    use solana_client::rpc_client::RpcClient;
    use solana_program::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        system_program,
    };
    use solana_sdk::{
        signature::{read_keypair_file, Keypair, Signer},
        transaction::Transaction,
    };
    use std::str::FromStr;

    const RPC_URL: &str = "https://api.devnet.solana.com";

    let rpc_client = RpcClient::new(RPC_URL);
    let signer = read_keypair_file("dev-wallet.json").expect("Couldn't read dev-wallet");

    // Program + accounts
    let turbin3_program = Pubkey::from_str("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM").unwrap();
    let collection = Pubkey::from_str("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2").unwrap();
    let mpl_core_program = Pubkey::from_str("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d").unwrap();
    let system_program = system_program::id();

    // Mint keypair (new NFT)
    let mint = Keypair::new();

    // Get PDA (same logic as TS)
    let signer_pubkey = signer.pubkey();
    let seeds = &[b"prereqs", signer_pubkey.as_ref()];
    let (prereq_pda, _) = Pubkey::find_program_address(seeds, &turbin3_program);

    // Authority = PDA again (for simplicity)
    let authority_seeds = &[b"collection", collection.as_ref()];
    let (authority, _) = Pubkey::find_program_address(authority_seeds, &turbin3_program);

    // Instruction discriminator
    let data = vec![77, 124, 82, 163, 21, 133, 181, 206];

    // Account metas
    let accounts = vec![
        AccountMeta::new(signer.pubkey(), true),         // user
        AccountMeta::new(prereq_pda, false),             // prereq account
        AccountMeta::new(mint.pubkey(), true),           // mint
        AccountMeta::new(collection, false),             // collection
        AccountMeta::new_readonly(authority, false),     // authority (PDA)
        AccountMeta::new_readonly(mpl_core_program, false), // mpl
        AccountMeta::new_readonly(system_program, false),   // system
    ];

    let instruction = Instruction {
        program_id: turbin3_program,
        accounts,
        data,
    };

    let blockhash = rpc_client.get_latest_blockhash().expect("Blockhash fail");

    let tx = Transaction::new_signed_with_payer(
        &[instruction],
        Some(&signer.pubkey()),
        &[&signer, &mint],
        blockhash,
    );

    let sig = rpc_client
        .send_and_confirm_transaction(&tx)
        .expect("Transaction failed");

    println!(
        "🎉 Success! Your proof is on-chain:\nhttps://explorer.solana.com/tx/{}?cluster=devnet",
        sig
    );
}



}