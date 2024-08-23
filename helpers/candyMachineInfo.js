export const collectionName = "ActionX Collection"; // Case sensitive!
export const MaxMint = 1;
export const COLLECTION_SIZE = 100;

// To remove the background of the dapp to a solid color just delete the "collectionCoverUrl" url below
// Any hosted image can be used - jpeg, gif, png
export const collectionCoverUrl = "/logoactionx.svg";
export const collectionBackgroundUrl =
  "https://cdn.pixabay.com/photo/2018/04/16/12/59/mountains-3324569_1280.jpg";

export const mode = "dev"; // "dev" or "test" or "mainnet"
export let NODE_URL;
export const CONTRACT_ADDRESS =
  "48f02a18ecbfc5e009c407d0b751293f51900dcd3e953f52f9be8df26d842159";
let FAUCET_URL;

if (mode == "dev") {
  NODE_URL = "https://fullnode.devnet.aptoslabs.com/v1";
  FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
} else if (mode === "test") {
  NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
  FAUCET_URL = "https://faucet.testnet.aptoslabs.com";
} else {
  NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
  FAUCET_URL = null;
}
