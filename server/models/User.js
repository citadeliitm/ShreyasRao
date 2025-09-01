const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  user_name: { type: String, required: true },
  private_key: String,
  public_key: String,
  evm_address: String,
  account_id: String
});

module.exports = mongoose.model("User", userSchema);
