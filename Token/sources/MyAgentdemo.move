module MyAgentdemo::aicoin {
    use sui::coin::{Self, Coin};
    use sui::url;
    use sui::event;
    use std::string::{String};

    /// State variable
    const EInvalidAmount: u64 = 0;

    public struct AICOIN has drop {}

    public struct MyAgentdemoCap has key, store {
        id: UID,
        treasury: coin::TreasuryCap<AICOIN>,
    }

    public struct CoinMetadata has key, store {
        id: UID,
        name: String, 
        symbol: String,
        description: String,
        decimals: u8,
        icon_url: option::Option<url::Url>
    }

     public struct MintEvent has copy, drop {
        amount: u64,
        recipient: address
    }

    public struct BurnEvent has copy, drop {
        amount: u64
    }

    /// Initializes the token
    fun init(witness: AICOIN, ctx: &mut TxContext) {
        let (mut treasury_cap, metadata) = coin::create_currency(
            witness,
            9,
            b"DEM",
            b"Agent Token DEMO",
            b"AI trading bot sui",
            option::none(),
            ctx
        );
        transfer::public_freeze_object(metadata);
         coin::mint_and_transfer(&mut treasury_cap, 100000000000,  tx_context::sender(ctx), ctx);
        let minter_cap = MyAgentdemoCap {
            id: object::new(ctx),
            treasury: treasury_cap,
        };
        transfer::public_transfer(minter_cap, tx_context::sender(ctx));

    }

    public entry fun mint(minter_cap: &mut MyAgentdemoCap, amount: u64, recipient: address ,ctx: &mut TxContext){
        assert!(amount > 0, EInvalidAmount);
        coin::mint_and_transfer(&mut minter_cap.treasury, amount, recipient, ctx);
        event::emit(MintEvent{amount: amount, recipient: recipient});
    }

    public entry fun burn(minter_cap: &mut MyAgentdemoCap, c: Coin<AICOIN>){
        let amount = coin::value(&c);
        assert!(amount > 0, EInvalidAmount);
        coin::burn(&mut minter_cap.treasury, c);
        event::emit(BurnEvent { amount: amount })
    }

    public entry fun transfer_token(c: Coin<AICOIN>, recipient: address) {
        transfer::public_transfer(c, recipient);
    }

    public fun get_metadata(self: &CoinMetadata ): (String, String, String, u8, option::Option<url::Url>) {
        (self.name, self.symbol, self.description, self.decimals, self.icon_url)
    }

    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(AICOIN {}, ctx)
    }
}
