const express = require("express");
const User = require("../models/User");
const { Client, PrivateKey, AccountInfoQuery, Hbar } = require("@hashgraph/sdk");
const jwt = require("jsonwebtoken");
const NFT = require("../models/NFT");
const router = express.Router();


const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate JWT and attach user to request
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

// POST /api/hedera/link
router.post("/link", authenticate, async (req, res) => {
  const { private_key, public_key, account_id, evm_address } = req.body;

  try {
    const user = await User.findById(req.user.id);

    // If already linked, disallow changes
    if (user.account_id) {
      return res.status(400).json({ message: "Hedera account already linked" });
    }

    user.private_key = private_key;
    user.public_key = public_key;
    user.evm_address = evm_address;
    user.account_id = account_id;
    await user.save();
    
    res.json({ message: "Hedera account linked successfully" });

  } catch (err) {
    res.status(500).json({ message: "Failed to link account", error: err.message });
  }
});

router.get("/profile", authenticate, async (req, res) => {
  try {
    console.log("Decoded user ID:", req.user.id);
    const user = await User.findById(req.user.id);
    console.log("User found:", user);

    if (!user || !user.private_key || !user.account_id) {
      return res.status(400).json({ message: "Hedera account not linked" });
    }

    const client = Client.forTestnet();
    const privateKey = PrivateKey.fromStringECDSA(user.private_key);
    client.setOperator(user.account_id, privateKey);
    client.setDefaultMaxTransactionFee(new Hbar(10));
    client.setDefaultMaxQueryPayment(new Hbar(5));

    const info = await new AccountInfoQuery().setAccountId(user.account_id).execute(client);
    const ownedNfts=await NFT.find({user_email:user.email});
    const nftCount= ownedNfts.length;

    const profile = {
      user_name: user.user_name,
      email: user.email,
      account_id: user.account_id,
      balance: info.balance.toString(),
      ownedNfts: nftCount
    };

    res.json(profile);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Error retrieving profile" });
  }
});

module.exports = router;
