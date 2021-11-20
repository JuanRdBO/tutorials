import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { AnchorCrowdFunding } from '../target/types/anchor_crowd_funding';
import {LAMPORTS_PER_SOL} from '@solana/web3.js'


describe('anchor-crowd-funding', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AnchorCrowdFunding as Program<AnchorCrowdFunding>;

  // Creating campaign account
  const campaignAuthority = anchor.web3.Keypair.generate();

  it('Init campaign', async () => {


    let airdrop_amount = 5;
    console.log("🌭 Airdropping", airdrop_amount, "SOL to user wallet...")
    await airdrop(campaignAuthority.publicKey, airdrop_amount, program.provider);

    // Add your test here.
    let campaignName = "testCampaign";
    let campaignAuthority_pk = campaignAuthority.publicKey;
    let campaignDescription = "This is a test campaign description";
    let campaignImageLink = "https://whitewallapi.wpenginepowered.com/wp-content/uploads/2021/08/jenisu-cityscape-4-nft-1.png";

    const [campaignAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [campaignAuthority.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.rpc.createCampaign(
      campaignName,
      campaignDescription,
      campaignImageLink,
      bump, {
        accounts: {
          authority: campaignAuthority_pk,
          campaignAccount: campaignAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [campaignAuthority]
      }
    );
    console.log("Created", campaignAccount.toString());

    // tests
    const account = await program.account.campaignAccount.fetch(campaignAccount);
    console.log("CampaignAccount is", account.name)
    console.log("Amount donated is", new anchor.BN(account.amountDonated).toNumber())
  });

  it ('donating...', async () => {

    let campaignAuthority_pk = campaignAuthority.publicKey;
    const [campaignAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [campaignAuthority.publicKey.toBuffer()],
      program.programId
    );

    let donation = 3 * LAMPORTS_PER_SOL
    const tx = await program.rpc.donate(
      new anchor.BN(donation), {
        accounts: {
          authority: campaignAuthority_pk,
          campaignAccount: campaignAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [campaignAuthority]
      }
    );

    // tests
    const account = await program.account.campaignAccount.fetch(campaignAccount);
    console.log("Amount donated is", new anchor.BN(account.amountDonated).toNumber())

    let balance = await program.provider.connection.getBalance(campaignAccount)
    console.log("Balance of", campaignAccount.toString(), "is", balance/LAMPORTS_PER_SOL)

  });

  it('withdrawing...', async () => {

    let campaignAuthority_pk = campaignAuthority.publicKey;
    const [campaignAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [campaignAuthority.publicKey.toBuffer()],
      program.programId
    );

    console.log("closing", campaignAccount.toString())
    
    const tx = await program.rpc.withdraw(
      new anchor.BN(50), {
        accounts: {
          authority: campaignAuthority_pk,
          campaignAccount: campaignAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [campaignAuthority]
      }
    );

    // tests
    const account = await program.account.campaignAccount.fetch(campaignAccount);
    console.log("CampaignAccount is", account)
    console.log("Amount donated is", new anchor.BN(account.amountDonated).toNumber())


  })
});



async function airdrop(publicKey, amount, provider) {
  await provider.connection
    .requestAirdrop(publicKey, amount * LAMPORTS_PER_SOL)
    .then((sig) => provider.connection.confirmTransaction(sig, "confirmed"));
}
