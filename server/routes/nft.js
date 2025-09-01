const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Client, PrivateKey, Hbar, TokenCreateTransaction, TokenMintTransaction, TokenType, TokenSupplyType,TransferTransaction,TokenAssociateTransaction, TokenId } = require("@hashgraph/sdk");
const { uploadFileToIPFS, uploadJSONToIPFS } = require("../utils/pinata");
const User = require("../models/User");
const NFT = require("../models/NFT");


const router = express.Router();
const upload = multer({ dest: "uploads/" });



// JWT middleware (reuse from earlier step)
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}



router.post("/create", authenticate, upload.single("file"), async (req, res) => {
  const { name, description } = req.body;
  const filePath = req.file.path;

  try {
    const user = await User.findById(req.user.id);
    const client = Client.forTestnet().setOperator(user.account_id, PrivateKey.fromStringECDSA(user.private_key));

    // Step 1: Upload file to IPFS
    const fileCID = await uploadFileToIPFS(filePath);
    fs.unlinkSync(filePath); // clean up temp file

    const fileType = req.file.mimetype;

    // Step 2: Upload metadata JSON to IPFS
    const metadata = {
      name,
      description,
      image: `ipfs://${fileCID}`,
      type: fileType
    };
    const jsonCID = await uploadJSONToIPFS(metadata);
    const metadataIPFSURI = `ipfs://${jsonCID}`;
    // Step 3: Create NFT Token
    const tokenCreateTx = await new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol("NFT")
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1)
      .setTreasuryAccountId(user.account_id)
      .setAdminKey(PrivateKey.fromStringECDSA(user.private_key))
      .setSupplyKey(PrivateKey.fromStringECDSA(user.private_key))
      .freezeWith(client)
      .sign(PrivateKey.fromStringECDSA(user.private_key));

    const tokenCreateSubmit = await tokenCreateTx.execute(client);
    const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
    const tokenId = tokenCreateRx.tokenId.toString();

    const evmAddress = "0x" + TokenId.fromString(tokenId).toSolidityAddress();

    // Step 4: Mint NFT
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(`ipfs://${jsonCID}`)])
      .freezeWith(client)
      .sign(PrivateKey.fromStringECDSA(user.private_key));

    const mintSubmit = await mintTx.execute(client);
    const mintRx = await mintSubmit.getReceipt(client);
    const serialNo = mintRx.serials[0].toString();

    // Step 5: Save in MongoDB
    const nft = new NFT({
      tokenId,
      serialNo,
      name,
      description,
      imageCID: fileCID,
      type: fileType,
      user_email: user.email,
      evm_address: evmAddress,
    });
    await nft.save();

    res.json({ message: "NFT minted successfully!", tokenId, serialNo });

  } catch (err) {
  console.error("❌ Detailed NFT minting error:", err);  // <-- this shows the real issue
  res.status(500).json({ message: "Error minting NFT", error: err.message });
  }
});

router.get("/mine", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const nfts = await NFT.find({ user_email: user.email });
    res.json(nfts);
  } catch (err) {
    console.error("Error fetching user NFTs:", err);
    res.status(500).json({ message: "Failed to fetch NFTs" });
  }
});

router.post("/list", authenticate, async (req, res) => {
  const { tokenId, serialNo, price } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const nft = await NFT.findOne({ tokenId, serialNo, user_email: user.email });

    if (!nft) {
      return res.status(404).json({ message: "NFT not found or not owned by you" });
    }

    nft.for_sale = true;
    nft.price = price;
    await nft.save();

    res.json({ message: "NFT listed for sale", nft });
  } catch (err) {
    console.error("Error listing NFT:", err);
    res.status(500).json({ message: "Failed to list NFT", error: err.message });
  }
});

router.get("/market", async (req, res) => {
  try {
    const nftsForSale = await NFT.find({ for_sale: true });
    res.json(nftsForSale);
  } catch (err) {
    console.error("Error fetching marketplace NFTs:", err);
    res.status(500).json({ message: "Failed to fetch NFTs for sale" });
  }
});

router.post("/buy", authenticate, async (req, res) => {
  const { tokenId, serialNo } = req.body;

  try {
    const buyer = await User.findById(req.user.id);
    const nft = await NFT.findOne({ tokenId, serialNo });

    if (!nft || !nft.for_sale) {
      return res.status(400).json({ message: "NFT not for sale" });
    }

    const seller = await User.findOne({ email: nft.user_email });

    // Set up Hedera client for buyer
    const client = Client.forTestnet();
    const buyerKey = PrivateKey.fromStringECDSA(buyer.private_key);
    client.setOperator(buyer.account_id, buyerKey);

    // 1. Transfer HBAR from buyer → seller
    const hbarTx = await new TransferTransaction()
      .addHbarTransfer(buyer.account_id, new Hbar(-nft.price))  // debit buyer
      .addHbarTransfer(seller.account_id, new Hbar(nft.price))  // credit seller
      .freezeWith(client)
      .sign(buyerKey);

    const hbarSubmit = await hbarTx.execute(client);
    await hbarSubmit.getReceipt(client);

    // 2. Associate NFT token with buyer (if needed)
    try {
      const associateTx = await new TokenAssociateTransaction()
        .setAccountId(buyer.account_id)
        .setTokenIds([tokenId])
        .freezeWith(client)
        .sign(buyerKey);
      await associateTx.execute(client);
    } catch (error) {
      // Already associated → skip
    }
  const sellerKey = PrivateKey.fromStringECDSA(seller.private_key);

  // 3. Transfer NFT from seller → buyer
  const transferTx = await new TransferTransaction()
  .addNftTransfer(tokenId, serialNo, seller.account_id, buyer.account_id)
  .freezeWith(client);

  const signedTx = await transferTx
  .sign(sellerKey)
  .then(tx => tx.sign(buyerKey)); // both must sign

  const transferSubmit = await signedTx.execute(client);
  const transferReceipt = await transferSubmit.getReceipt(client);

  // 4. Update DB
  nft.for_sale = false;
  nft.price = 0;
  nft.user_email = buyer.email;
  await nft.save();

  res.json({ message: "Purchase successful", tokenId });
  } catch (err) {
    console.error("Buy NFT error:", err);
    res.status(500).json({ message: "Purchase failed", error: err.message });
  }
});

router.post("/start-auction", authenticate, async (req, res) => {
    const { tokenId, serialNo, auctionContract, commitDuration, revealDuration} = req.body;
    try{
        const user = await User.findById(req.user.id);
        const nft =await NFT.findOne({tokenId, serialNo, user_email: user.email});
        if(!nft || nft.for_sale) {
            return res.status(404).json({ message: "NFT not found or for sale" });
        }
        
        // update NFT properties for auction
        nft.for_auction = true;
        nft.for_sale = false;
        nft.auction_failed = false;
        nft.auction_contract = auctionContract;
        nft.commit_duration = commitDuration;
        nft.reveal_duration = revealDuration;
        nft.auction_start_time = new Date();
        
        await nft.save();
        res.json({ message: "Auction started", tokenId, serialNo });


    }catch(err){
        console.error("Error starting auction:", err);
        res.status(500).json({ message: "Failed to start auction", error: err.message });
    }
});

router.get("/auctions", async (req, res) => {
  try {
    const activeAuctions = await NFT.find({ for_auction: true });
    res.json(activeAuctions);
  } catch (err) {
    console.error("Error fetching auctions:", err);
    res.status(500).json({ message: "Failed to fetch auction NFTs" });
  }
});

router.post("/finalize-auction",authenticate, async (req,res) => {
   const {tokenId, serialNo, auctionContract, winnerAccountID} = req.body;

   try{
    const nft = await NFT.findOne({tokenId, serialNo});
    if(!nft || !nft.for_auction) {
        return res.status(404).json({ message: "NFT not found or not in auction" });
    }
    const winner = await User.findOne({evm_address: winnerAccountID.toString().toLowerCase()});

    if (winner){
      nft.user_email = winner.email;
    }

    nft.for_auction = false;
    nft.auction_failed = false;
    nft.auction_start_time = null;
    nft.auction_contract= auctionContract;

    await nft.save();

    res.json({message: "Auction finalized successfully"});
   }catch(err){
    console.error("Finalize cleanup failed:", err);
    res.status(500).json({message: "Finalize cleanup failed", error: err.message});
   }
});


module.exports = router;
// This code defines an Express route for creating NFTs on the Hedera network.
// It handles file uploads, uploads files and metadata to IPFS, creates an NFT token, mints it, and saves the NFT details in MongoDB.
// It also includes JWT authentication to ensure only authenticated users can create NFTs.
// The route uses the Pinata service to upload files and metadata to IPFS, and the Hedera SDK to interact with the Hedera network.
// The code also includes error handling to manage any issues that arise during the process, such as file upload errors or Hedera transaction failures.
