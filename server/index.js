const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

// ✅ Apply middleware first
app.use(cors());
app.use(express.json());

// ✅ Then load routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const hederaRoutes = require("./routes/hedera");
app.use("/api/hedera", hederaRoutes);

const nftRoutes = require("./routes/nft");
app.use("/api/nft", nftRoutes);


app.get("/", (req, res) => {
  res.send("HederaHub Backend Running");
});

// DB connect and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error("MongoDB connection error:", err));

