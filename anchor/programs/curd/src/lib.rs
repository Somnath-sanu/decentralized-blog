#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("7VnZZbZcQiaKeAYf3KGFDMTpbG5dyHHVhhXCSj9GNGGH");

#[program]
pub mod counter {
    use super::*;

    pub fn create_blog_entry(
        ctx: Context<CreateEntry>,
        title: String,
        message: String,
    ) -> Result<()> {
        let blog_entry = &mut ctx.accounts.blog_entry;
        blog_entry.owner = *ctx.accounts.owner.key;
        blog_entry.title = title;
        blog_entry.message = message;

        /*
            We will pass the title from instruction to the struct CreateEntry
            in order to do so we have to specify instruction macro
            #[instruction(title: String)]
        */
        Ok(())
    }

    pub fn update_blog_entry(
        ctx: Context<UpdateEntry>,
        _title: String,
        message: String,
    ) -> Result<()> {
        let blog_entry = &mut ctx.accounts.blog_entry;
        blog_entry.message = message;

        Ok(())
    }

    pub fn delete_blog_entry(_ctx: Context<DeleteEntry>, _title: String) -> Result<()> {
        Ok(())
    }
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

#[account]
#[derive(InitSpace)]
pub struct BlogEntryState {
    pub owner: Pubkey, // 32 bytes (fixed)
    #[max_len(50)] // 4 bytes (borsh) + 50 (string , vec[] -> varibles)
    pub title: String,
    #[max_len(5000)] // TODO: use IPFS for blog message (off-chain)
    pub message: String,
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
