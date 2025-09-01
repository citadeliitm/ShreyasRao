const mongoose = require("mongoose");

const nftSchema = new mongoose.Schema({
  tokenId: { type: String, required: true },
  serialNo: { type: String, required: true },
  name: String,
  description: String,
  imageCID: String,
  type: String,
  for_sale: { type: Boolean, default: false },
  for_auction: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  auction_failed: { type: Boolean, default: false },
  user_email: String,
  evm_address: { type: String, lowercase: true },
  commit_duration: { type: Number },
  reveal_duration: { type: Number },
  auction_start_time: { type: Date },
  auction_contract: { type: String },
});

module.exports = mongoose.model("NFT", nftSchema);
// This code defines a Mongoose schema for an NFT (Non-Fungible Token) model.
// The schema includes fields for token ID, serial number, name, description, image CID (Content Identifier),
// type, sale status, auction status, price, user email, and auction duration.
// It exports the model so it can be used in other parts of the application to interact with the MongoDB database.
