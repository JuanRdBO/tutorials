use anchor_lang::prelude::*;
declare_id!("AQQb3XmyR7pSkwnzQtYtrG8YvTRZ3CG7SixDAnDMcrAo");


#[program]
pub mod anchor_crowd_funding {
    use anchor_lang::solana_program::{program::{invoke, invoke_signed}, system_instruction};

    use super::*;

    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        name: String,
        description: String,
        image_link: String,
        bump: u8
    ) -> ProgramResult {
        let creator_account = &mut ctx.accounts.authority;
        
        ctx.accounts.campaign_account.authority = creator_account.key();
        ctx.accounts.campaign_account.name = name;
        ctx.accounts.campaign_account.description = description;
        ctx.accounts.campaign_account.image_link = image_link;
        ctx.accounts.campaign_account.amount_donated = 0;
        ctx.accounts.campaign_account.bump = bump;
        ctx.accounts.campaign_account.contributors = [].to_vec();

        Ok(())
    }
    
    pub fn donate(
        ctx: Context<Donate>,
        donation: u64

    ) -> ProgramResult {

        println!("Donating!");

        let from = &mut ctx.accounts.authority;
        let to = &mut ctx.accounts.campaign_account;
        let system_program = &ctx.accounts.system_program;

        invoke(
            &system_instruction::transfer(
                &from.key(),
                &to.key(), 
                donation
            ),
            &[
                from.to_account_info().clone(),
                to.to_account_info().clone(),
                system_program.to_account_info().clone(),
            ]
        )?;

        let campaign_account = &mut ctx.accounts.campaign_account;

        campaign_account.amount_donated += donation;
        campaign_account.contributors.push(from.key());

        Ok(())
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
        withdraw_amount: u64
    ) -> ProgramResult {
        
        let available_lamports = ctx.accounts.campaign_account.to_account_info().lamports();

        if available_lamports < withdraw_amount {
            return Err(ErrorCode::ExceededWithdrawAmount.into());
        }

        **ctx
            .accounts
            .campaign_account
            .to_account_info()
            .try_borrow_mut_lamports()? -= withdraw_amount;

        **ctx.accounts.authority.try_borrow_mut_lamports()? += withdraw_amount;

        ctx.accounts.campaign_account.amount_donated -= withdraw_amount;

        Ok(())
    }

}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, signer)]
    authority: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [authority.key().as_ref()],
        bump = campaign_account.bump,
        has_one = authority,
    )]
    campaign_account: Account<'info, CampaignAccount>,
    system_program: AccountInfo<'info>
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut, signer)]
    authority: AccountInfo<'info>,
    #[account(mut)]
    campaign_account: Account<'info, CampaignAccount>,
    system_program: AccountInfo<'info>
}

#[derive(Accounts)]
#[instruction(
    campaignName: String,
    campaignDescription: String,
    campaignImageLink: String,
    bump: u8
)]
pub struct CreateCampaign<'info> {
    #[account(mut, signer)]
    authority: AccountInfo<'info>,
    #[account(
        init,
        payer=authority,
        seeds=[authority.key().as_ref()],
        bump=bump,
        space=500
    )]
    campaign_account: Account<'info, CampaignAccount>,
    system_program: AccountInfo<'info>
}

#[account]
pub struct CampaignAccount {
    pub authority: Pubkey,
    pub name: String,
    pub description: String,
    pub image_link: String,
    pub amount_donated: u64,
    pub contributors: Vec<Pubkey>,
    pub bump: u8,
}

#[error]
pub enum ErrorCode {
    #[msg("Withdraw amount is higher than current balance!")]
    ExceededWithdrawAmount
}