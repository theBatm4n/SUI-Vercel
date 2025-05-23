#!/bin/bash

# Set values
MODULE_NAME=$1
TOKEN_SYMBOL=$2
SYMBOL_SMALL=$3
TOKEN_NAME=$4
DECIMALS=$5
DESCRIPTION=$6
INITIAL_AMOUNT=$7
PACKAGE_DIR=$8
TRANSFER_ADDRESS=$9
URL=${10:-}

# Directory structure
SOURCES_DIR="${PACKAGE_DIR}/sources"
OUTPUT_FILE="${SOURCES_DIR}/${MODULE_NAME}.move"

# Create directories if they don't exist
mkdir -p "$SOURCES_DIR"

# Validate parameters
if [[ ! "$DECIMALS" =~ ^[0-9]+$ ]]; then
  echo "Error: DECIMALS must be a number"
  exit 1
fi

# Determine icon URL handling
if [[ -z "$URL" ]]; then
  ICON_URL_HANDLING="option::none()"
else
  ICON_URL_HANDLING="option::some(url::new_unsafe_from_bytes(b\"$URL\"))"
fi

# Create the Move file
cat <<EOF > "$OUTPUT_FILE"
module ${MODULE_NAME}::${SYMBOL_SMALL}{
    use sui::coin::{Self, Coin};
    use sui::url;
    use sui::event;
    use std::string::{String};

    /// State variable
    const EInvalidAmount: u64 = 0;

    public struct ${TOKEN_SYMBOL} has drop {}

    public struct ${MODULE_NAME}Cap has key, store {
        id: UID,
        treasury: coin::TreasuryCap<${TOKEN_SYMBOL}>,
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
    fun init(witness: ${TOKEN_SYMBOL}, ctx: &mut TxContext) {
        let (mut treasury_cap, metadata) = coin::create_currency(
            witness,
            ${DECIMALS},
            b"${TOKEN_SYMBOL}",
            b"${TOKEN_NAME}",
            b"${DESCRIPTION}",
            ${ICON_URL_HANDLING},
            ctx
        );
        transfer::public_freeze_object(metadata);
        coin::mint_and_transfer(&mut treasury_cap, ${INITIAL_AMOUNT}, @${TRANSFER_ADDRESS}, ctx);
        let minter_cap = ${MODULE_NAME}Cap {
            id: object::new(ctx),
            treasury: treasury_cap,
        };
        transfer::public_transfer(minter_cap, @${TRANSFER_ADDRESS});
    }

    public entry fun mint(minter_cap: &mut ${MODULE_NAME}Cap, amount: u64, recipient: address ,ctx: &mut TxContext){
        assert!(amount > 0, EInvalidAmount);
        coin::mint_and_transfer(&mut minter_cap.treasury, amount, recipient, ctx);
        event::emit(MintEvent{amount: amount, recipient: recipient});
    }

    public entry fun burn(minter_cap: &mut ${MODULE_NAME}Cap, c: Coin<${TOKEN_SYMBOL}>){
        let amount = coin::value(&c);
        assert!(amount > 0, EInvalidAmount);
        coin::burn(&mut minter_cap.treasury, c);
        event::emit(BurnEvent { amount: amount })
    }

    public entry fun transfer_token(c: Coin<${TOKEN_SYMBOL}>, recipient: address) {
        transfer::public_transfer(c, recipient);
    }

    public fun get_metadata(self: &CoinMetadata ): (String, String, String, u8, option::Option<url::Url>) {
        (self.name, self.symbol, self.description, self.decimals, self.icon_url)
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
EOF
fi

echo "Successfully generated:"
echo "- Move file: ${OUTPUT_FILE}"
echo "- Token Symbol: ${TOKEN_SYMBOL}"
echo "- Decimals: ${DECIMALS}"
echo "- Description: ${DESCRIPTION}"
echo "- Initial Amount: ${INITIAL_AMOUNT}"
echo "- Package structure ready in ${PACKAGE_DIR}/"