#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("7VnZZbZcQiaKeAYf3KGFDMTpbG5dyHHVhhXCSj9GNGGH");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.weekly_pool;
        pool.total_pool = 0;
        pool.total_entries = 0;
        pool.last_winner_number = 0;
        pool.creator = *ctx.accounts.creator.key;
        Ok(())
    }
    pub fn create_blog_entry(
        ctx: Context<CreateEntry>,
        title: String,
        ipfs_hash: String,
        pool_contribution: u64, // lamports user contributes to weekly pot
    ) -> Result<()> {
        let blog_entry = &mut ctx.accounts.blog_entry;
        let owner = &mut ctx.accounts.owner;
        blog_entry.owner = *owner.key;
        blog_entry.title = title.clone();
        blog_entry.ipfs_hash = ipfs_hash;
        blog_entry.random_number = (Clock::get()?.unix_timestamp % 90000 + 10000) as u32; // 5-digit randomish number
        blog_entry.created_at = Clock::get()?.unix_timestamp;

        // transfer SOL to weekly pool
        let lamports = pool_contribution;

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: owner.to_account_info(),
                    to: ctx.accounts.weekly_pool.to_account_info(),
                },
            ),
            lamports,
        )?;

        // increment total pool
        let pool = &mut ctx.accounts.weekly_pool;
        pool.total_pool += lamports;
        pool.total_entries += 1;

        /*
            We will pass the title from instruction to the struct CreateEntry
            in order to do so we have to specify instruction macro
            #[instruction(title: String)]
        */
        Ok(())
    }

    pub fn declare_winner(ctx: Context<DeclareWinner>) -> Result<()> {
        let pool = &mut ctx.accounts.weekly_pool;
        require!(pool.total_entries > 0, CustomError::NoEntries);

        // TODO: We will send the lucky number from frontend
        let lucky_number = (Clock::get()?.unix_timestamp % 90000 + 10000) as u32;
        pool.last_winner_number = lucky_number;

        let winner_share = pool.total_pool * 90 / 100;
        let owner_share = pool.total_pool - winner_share;

        // Send 90% to winner
        **ctx
            .accounts
            .winner
            .to_account_info()
            .try_borrow_mut_lamports()? += winner_share;
        **pool.to_account_info().try_borrow_mut_lamports()? -= winner_share;

        // Send 10% to admin
        **ctx
            .accounts
            .creator_wallet
            .to_account_info()
            .try_borrow_mut_lamports()? += owner_share;
        **pool.to_account_info().try_borrow_mut_lamports()? -= owner_share;

        pool.total_pool = 0;
        pool.total_entries = 0;

        Ok(())
    }

    // pub fn update_blog_entry(
    //     ctx: Context<UpdateEntry>,
    //     _title: String,
    //     message: String,
    // ) -> Result<()> {
    //     let blog_entry = &mut ctx.accounts.blog_entry;
    //     blog_entry.message = message;

    //     Ok(())
    // }

    // pub fn delete_blog_entry(_ctx: Context<DeleteEntry>, _title: String) -> Result<()> {
    //     Ok(())
    // }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateEntry<'info> {
    #[account(
        init, // this will create account on chain
        seeds = [title.as_bytes() , owner.key().as_ref()],
        bump,
        space = 8 + BlogEntryState::INIT_SPACE,
        payer = owner
    )]
    pub blog_entry: Account<'info, BlogEntryState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"weekly_pool"],
        bump
    )]
    pub weekly_pool: Account<'info, WeeklyPool>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct UpdateEntry<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes() , owner.key().as_ref()],
        bump,
        realloc = 8 + BlogEntryState::INIT_SPACE,
        realloc::payer = owner,
        realloc::zero = true
    )]
    pub blog_entry: Account<'info, BlogEntryState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeleteEntry<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes() , owner.key().as_ref()],
        bump,
        close = owner
    )]
    pub blog_entry: Account<'info, BlogEntryState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeclareWinner<'info> {
    #[account(mut, seeds = [b"weekly_pool"], bump)]
    pub weekly_pool: Account<'info, WeeklyPool>,

    /// CHECK: winner wallet address found off-chain based on lucky number
    #[account(mut)]
    pub winner: UncheckedAccount<'info>,

    /// CHECK: admin/creator wallet
    #[account(mut)]
    pub creator_wallet: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + WeeklyPool::INIT_SPACE,
        seeds = [b"weekly_pool"],
        bump
    )]
    pub weekly_pool: Account<'info, WeeklyPool>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct BlogEntryState {
    pub owner: Pubkey, // 32 bytes (fixed)
    #[max_len(50)] // 4 bytes (borsh) + 50 (string , vec[] -> varibles)
    pub title: String,
    #[max_len(100)] //* use IPFS for blog message (off-chain)
    pub ipfs_hash: String,
    pub random_number: u32, // 4 bytes (borsh)
    pub created_at: i64,    // 8 bytes (borsh)
}

#[account]
#[derive(InitSpace)]
pub struct WeeklyPool {
    pub creator: Pubkey,
    pub total_pool: u64,
    pub total_entries: u64,
    pub last_winner_number: u32,
}

#[error_code]
pub enum CustomError {
    #[msg("No entries found in the pool")]
    NoEntries,
}

//* #[account] -> It only tells Anchor: This struct is meant to be stored inside a Solana account, and Anchor should serialize/deserialize it. It makes your struct: Use Anchor's Borsh serialization \n Get an automatic 8-byte discriminator\n Become eligible to be used in account constraints like: pub blog: Account<'info, BlogEntryState>  But it does not create the account./

/*
 #[account(
        *init,
        payer = signer,
        space = 8 + BlogEntryState::INIT_SPACE,
        seeds = [b"blog", signer.key().as_ref()],
        bump
    )]
    pub blog: Account<'info, BlogEntryState>,

    *init triggers:

    ✔ SystemProgram::create_account
    ✔ Allocating the storage space
    ✔ Assigning ownership to your program
    ✔ Writing rent lamports
    This is what actually creates the PDA account on-chain.


*/

/*
#[derive(Accounts)]
    It tells Anchor:

   * “This struct describes which accounts must be passed into the instruction and what constraints / checks to apply to them.”
   *
   * #[derive(Accounts)]

    pub struct CreateBlogEntry<'info> {
        pub user: Signer<'info>,
        pub system_program: Program<'info, System>,
    }
    When the instruction runs, Anchor:

    Automatically loads the accounts from the transaction

    Validates them (owner, mutability, signer requirements, PDA seeds, etc.)

    Makes them available inside your Rust code as ctx.accounts.user, etc.

    So:

    #[derive(Accounts)] = This struct is the “account validation rules” for an instruction

    * #[account(mut)]

    This is used inside a #[derive(Accounts)] struct.
    It tells Anchor:

    This account will be modified, so mark it mutable.”
 */
