#!/bin/bash

# Set default values
MODULE_NAME=${1:-"AIagent"}
TOKEN_SYMBOL=${2:-"MYT"}
TOKEN_NAME=${3:-"My Custom Token"}
DECIMALS=${4:-"9"}
DESCRIPTION=${5:-"A utility token for AI services"}
INITIAL_AMOUNT=${6:-"100000000000"}

# Directory structure
PACKAGE_DIR="Token"
SOURCES_DIR="${PACKAGE_DIR}/sources"
OUTPUT_FILE="${SOURCES_DIR}/${MODULE_NAME}.move"

# Create directories if they don't exist
mkdir -p "$SOURCES_DIR"

# Validate parameters
if [[ ! "$DECIMALS" =~ ^[0-9]+$ ]]; then
  echo "Error: DECIMALS must be a number"
  exit 1
fi

# Create the Move file
cat <<EOF > "$OUTPUT_FILE"
module ${MODULE_NAME}::aicoin {
    use sui::coin::{Self, Coin};
    use sui::url;
    use sui::event;
    use std::string::{String};

    /// State variable
    const EInvalidAmount: u64 = 0;

    public struct AICOIN has drop {}

    public struct ${MODULE_NAME}Cap has key, store {
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
            ${DECIMALS},
            b"${TOKEN_SYMBOL}",
            b"${TOKEN_NAME}",
            b"${DESCRIPTION}",
            option::none(),
            ctx
        );
        transfer::public_freeze_object(metadata);
         coin::mint_and_transfer(&mut treasury_cap, ${INITIAL_AMOUNT},  tx_context::sender(ctx), ctx);
        let minter_cap = ${MODULE_NAME}Cap {
            id: object::new(ctx),
            treasury: treasury_cap,
        };
        transfer::public_transfer(minter_cap, tx_context::sender(ctx));

    }

    public entry fun mint(minter_cap: &mut ${MODULE_NAME}Cap, amount: u64, recipient: address ,ctx: &mut TxContext){
        assert!(amount > 0, EInvalidAmount);
        coin::mint_and_transfer(&mut minter_cap.treasury, amount, recipient, ctx);
        event::emit(MintEvent{amount: amount, recipient: recipient});
    }

    public entry fun burn(minter_cap: &mut ${MODULE_NAME}Cap, c: Coin<AICOIN>){
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
EOF

# Create minimal Move.toml if it doesn't exist
if [ ! -f "${PACKAGE_DIR}/Move.toml" ]; then
    cat <<EOF > "${PACKAGE_DIR}/Move.toml"
[package]
name = "${MODULE_NAME}"
edition = "2024.beta" 

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
${MODULE_NAME} = "0x0"

[dev-dependencies]

[dev-addresses]
EOF
fi

echo "Successfully generated:"
echo "- Move file: ${OUTPUT_FILE}"
echo "- Token Symbol: ${TOKEN_SYMBOL}"
echo "- Decimals: ${DECIMALS}"
echo "- Package structure ready in ${PACKAGE_DIR}/"