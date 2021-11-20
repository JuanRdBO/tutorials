import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { AnchorCrowdFunding } from '../target/types/anchor_crowd_funding';
import {LAMPORTS_PER_SOL} from '@solana/web3.js'


describe('anchor-crowd-funding', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AnchorCrowdFunding as Program<AnchorCrowdFunding>;

  // Creating campaign account
  const lotteryAuthority1 = anchor.web3.Keypair.generate();
  const lotteryAuthority2 = anchor.web3.Keypair.generate();

  it('Init campaign 1', async () => {


    let airdrop_amount = 5;
    console.log("🌭 Airdropping", airdrop_amount, "SOL to lotteryAuthority1 wallet...")
    await airdrop(lotteryAuthority1.publicKey, airdrop_amount, program.provider);

    // Add your test here.
    let campaignName = "testCampaign";
    let lotteryAuthority1_pk = lotteryAuthority1.publicKey;
    let campaignDescription = "This is a test campaign description";
    let campaignImageLink = "https://whitewallapi.wpenginepowered.com/wp-content/uploads/2021/08/jenisu-cityscape-4-nft-1.png";

    const [lotteryAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [lotteryAuthority1.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.rpc.createCampaign(
      campaignName,
      campaignDescription,
      campaignImageLink,
      bump, {
        accounts: {
          authority: lotteryAuthority1_pk,
          lotteryAccount: lotteryAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [lotteryAuthority1]
      }
    );
    console.log("Created", lotteryAccount.toString());

    // tests
    const account = await program.account.lotteryAccount.fetch(lotteryAccount);
    console.log("CampaignAccount is", account.name)
    console.log("Amount donated is", new anchor.BN(account.amountDonated).toNumber())
  });

  it('Init campaign 2', async () => {


    let airdrop_amount = 10;
    console.log("🌭 Airdropping", airdrop_amount, "SOL to lotteryAuthority2 wallet...")
    await airdrop(lotteryAuthority2.publicKey, airdrop_amount, program.provider);

    // Add your test here.
    let campaignName = "Epic campaign";
    let lotteryAuthority2_pk = lotteryAuthority2.publicKey;
    let campaignDescription = "Motherfucking epic campaign bitch";
    let campaignImageLink = "https://cdn.dribbble.com/users/6228692/screenshots/14692482/media/65a7784e995b32a7cd49fa9d4ed8e298.png";

    const [lotteryAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [lotteryAuthority2.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.rpc.createCampaign(
      campaignName,
      campaignDescription,
      campaignImageLink,
      bump, {
        accounts: {
          authority: lotteryAuthority2_pk,
          lotteryAccount: lotteryAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [lotteryAuthority2]
      }
    );
    console.log("Created", lotteryAccount.toString());

    // tests
    const account = await program.account.lotteryAccount.fetch(lotteryAccount);
    console.log("CampaignAccount is", account.name)
    console.log("Amount donated is", new anchor.BN(account.amountDonated).toNumber())
  });


  it ('donating from lotteryAuthority1 to both campaigns...', async () => {

    let accounts = await program.provider.connection.getProgramAccounts(program.programId)
    let lotteryAuthority1_pk = lotteryAuthority1.publicKey;

    for (let i=0; i< accounts.length; i++) {

      let lotteryAccount = accounts[i].pubkey
      let donation = 1 * LAMPORTS_PER_SOL

      const tx = await program.rpc.donate(
        new anchor.BN(donation), {
          accounts: {
            authority: lotteryAuthority1_pk,
            lotteryAccount: lotteryAccount,
            systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [lotteryAuthority1]
        }
      );

      // tests
      const account = await program.account.lotteryAccount.fetch(lotteryAccount);
      console.log("Amount donated to",lotteryAccount.toString() ,"is", new anchor.BN(account.amountDonated).toNumber()/LAMPORTS_PER_SOL)

      let balance = await program.provider.connection.getBalance(lotteryAccount)
      console.log("Balance of", lotteryAccount.toString(), "is", balance/LAMPORTS_PER_SOL)
    
      console.log("Total gamblers to", lotteryAccount.toString(), "are", account.gamblers.map(c=> c.toString()))

    }

  });

  it ('donating from lotteryAuthority2 to owned campaign...', async () => {

    let accounts = await program.provider.connection.getProgramAccounts(program.programId)
    let lotteryAuthority2_pk = lotteryAuthority2.publicKey;

    const [lotteryAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [lotteryAuthority2.publicKey.toBuffer()],
      program.programId
    );

    let donation = 1 * LAMPORTS_PER_SOL

    const tx = await program.rpc.donate(
      new anchor.BN(donation), {
        accounts: {
          authority: lotteryAuthority2_pk,
          lotteryAccount: lotteryAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [lotteryAuthority2]
      }
    );

    // tests
    const account = await program.account.lotteryAccount.fetch(lotteryAccount);
    console.log("Amount donated to",lotteryAccount.toString() ,"is", new anchor.BN(account.amountDonated).toNumber()/LAMPORTS_PER_SOL)

    let balance = await program.provider.connection.getBalance(lotteryAccount)
    console.log("Balance of", lotteryAccount.toString(), "is", balance/LAMPORTS_PER_SOL)
      
    console.log("Total gamblers to", lotteryAccount.toString(), "are", account.gamblers.map(c=> c.toString()))

  });

  it('withdrawing from owned campaign ...', async () => {

    let lotteryAuthority1_pk = lotteryAuthority1.publicKey;
    const [lotteryAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [lotteryAuthority1.publicKey.toBuffer()],
      program.programId
    );

    console.log("closing", lotteryAccount.toString())
    
    const tx = await program.rpc.withdraw(
      new anchor.BN(0.3*LAMPORTS_PER_SOL), {
        accounts: {
          authority: lotteryAuthority1_pk,
          lotteryAccount: lotteryAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [lotteryAuthority1]
      }
    );

    // tests
    const account = await program.account.lotteryAccount.fetch(lotteryAccount);
    //console.log("CampaignAccount is", account)
    console.log("Amount donated decreased to", new anchor.BN(account.amountDonated).toNumber()/LAMPORTS_PER_SOL)
    
    let balance = await program.provider.connection.getBalance(lotteryAccount)
    console.log("New balance of", lotteryAccount.toString(), "is", balance/LAMPORTS_PER_SOL)

  })

  it('withdrawing from not owned campaign (should fail) ...', async () => {

    let lotteryAuthority1_pk = lotteryAuthority1.publicKey;
    const [lotteryAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [lotteryAuthority2.publicKey.toBuffer()],
      program.programId
    );

    console.log("closing", lotteryAccount.toString())
    
    const tx = await program.rpc.withdraw(
      new anchor.BN(0.3*LAMPORTS_PER_SOL), {
        accounts: {
          authority: lotteryAuthority1_pk,
          lotteryAccount: lotteryAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [lotteryAuthority1]
      }
    );

    // tests
    const account = await program.account.lotteryAccount.fetch(lotteryAccount);
    //console.log("CampaignAccount is", account)
    console.log("Amount donated decreased to", new anchor.BN(account.amountDonated).toNumber()/LAMPORTS_PER_SOL)
    
    let balance = await program.provider.connection.getBalance(lotteryAccount)
    console.log("New balance of", lotteryAccount.toString(), "is", balance/LAMPORTS_PER_SOL)

  })

});



async function airdrop(publicKey, amount, provider) {
  await provider.connection
    .requestAirdrop(publicKey, amount * LAMPORTS_PER_SOL)
    .then((sig) => provider.connection.confirmTransaction(sig, "confirmed"));
}
