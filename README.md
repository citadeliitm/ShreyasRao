# NFTyX - A Decentralized NFT Auction Platform Using Sealed-Bid Mechanism
NFTyX is a full-stack decentralized application (dApp) built on the Hedera network to enable secure and fair NFT auctions through the sealed-bid (Vickrey) mechanism. The platform integrates Hedera Smart Contracts for trustless auction execution, a React-based frontend for intuitive user interaction, and decentralized storage for NFT metadata. By leveraging the commit–reveal phases of the sealed-bid model, NFTyX ensures bidder confidentiality while enabling transparent and verifiable auction resolution. All critical auction events—from NFT listing and bid commitments to final settlement—are recorded on Hedera’s fast, low-cost, and tamper-proof ledger, ensuring transparency, immutability, and resistance to manipulation.

---
## ✨ Features
1. **Decentralized Auctions**  
   - Built on Hedera DLT with EVM-compatible smart contracts.  
   - Implements a Vickrey (sealed-bid second-price) auction mechanism using a **commit–reveal** process.  

2. **Fair and Transparent Bidding**  
   - Bidders commit hashed bids in the commit phase, ensuring privacy.  
   - Bids are revealed later for verification, preventing manipulation or sniping.  
   - Winner pays only the **second-highest bid**, encouraging truthful bidding.  

3. **NFT Management with Hedera Token Service (HTS)**  
   - NFTs are minted using HTS but comply with ERC-721 standards.  
   - Metadata stored on **IPFS** for immutability and decentralization.  

4. **User-Friendly Interface**  
   - **React.js frontend** with Tailwind styling.  
   - Seamless wallet integration via **MetaMask** for Hedera EVM.  
   - Gallery, marketplace, and auction house pages for easy navigation.  

5. **Flexible Trading Options**  
   - Supports **direct NFT sales** (fixed price) and **sealed-bid auctions**.  
   - Sellers can specify auction parameters like commit/reveal durations.  

6. **Secure Transactions**  
   - NFT and payment transfers are handled automatically by smart contracts.  
   - All critical actions (commit, reveal, finalize) are recorded on-chain.  

7. **Scalable and Cost-Efficient**  
   - Leverages Hedera’s **low fees and high throughput** for efficient auctions.  
   - MongoDB used for off-chain metadata and auction state for fast retrieval.  

8. **Trustless Finalization**  
   - Anyone can trigger auction finalization once reveal ends.  
   - Smart contract ensures proper transfer of NFT to the winner and funds to the seller.

---
## 📂 Project structure
```bash
├── client/ # Frontend (React.js + Tailwind)
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── pages/ # Application pages
│ │ ├── services/ 
│ │ │ ├── EnglishAuction.json
│ │ │ ├── VickreyAuction.json
│ │ ├── App.css
│ │ ├── App.js
│ │ ├── index.css
│ │ ├── index.js
│ ├── tailwind.config.js
│ ├── postcss.config.js
│ ├── package.json
│
├── contracts/ # Smart Contracts (Solidity + Hardhat)
│ ├── contracts/
│ │ ├── EnglishAuction.sol
│ │ ├── VickreyAuction.sol
│ │ ├── HederaResponseCodes.sol
│ │ ├── HederaTokenService.sol
│ │ ├── IHederaTokenService.sol
│ ├── scripts/ # Deployment / utility scripts
│ ├── test/ # Contract test cases
│ ├── hardhat.config.js
│ ├── package.json
│
├── server/ # Backend (Node.js + Express + MongoDB)
│ ├── controllers/
│ ├── models/ # Mongoose schemas
│ │ ├── NFT.js
│ │ ├── User.js
│ ├── routes/ # API routes
│ │ ├── auth.js
│ │ ├── hedera.js
│ │ ├── nft.js
│ ├── uploads/
│ ├── utils/ # Utility functions
│ ├── index.js
│ ├── package.json
```
---
## 🚀 Getting Started

### Prerequisites
Before running the project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or above recommended)  
- [npm](https://www.npmjs.com/) (comes with Node.js)  
- [MetaMask](https://metamask.io/) browser extension  
- [Hardhat](https://hardhat.org/) for smart contract development  
- [MongoDB](https://www.mongodb.com/) running locally or cloud instance (e.g., MongoDB Atlas)  
- A [Hedera Testnet Account](https://portal.hedera.com/) with test HBARs  

---
### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/ShreyasRao.git
   cd ShreyasRao
   ```
2. **Installing Dependencies**
   - client dependencies
   ```bash
   cd client
   npm install
   ```

   - contract dependecies
   ```bash
   cd ../contracts
   npm install
   ```

   - server dependencies
   ```bash
   cd ../server
   npm install
   ```
3. **Environment Variables**
   - Create a .env file inside server/ directory.
   - Add required keys such as:
   ```bash
   JWT_SECRET=yoursuperlongkey
   PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_API_KEY=your_pinata_secret_api_key
   ```
---

### Running the Project Locally

1. Compiling the smart contract
   - After creating a smart contract file under contracts/ directory compile it using the following command
   ```bash
   cd contracts
   npx hardhat compile
   ```
   - Copy and paste the VickreyAuction.json file found under artifacts/contracts/VickreyAuction.sol in the src/ directory of client folder.

2. Start the Backend Server
   ```bash
   cd ../server
   node index.js
   ```
3. Start the Frontend (React Client)
   ```bash
   cd ../client
   npm start
   ```
4. Open the application in your browser:
   http://localhost:3000
---

## 📄 Notes
- Ensure your MetaMask is connected to the Hedera Testnet and that MetaMask is connected to the localhost.
- The backend (server) should be running before the frontend to handle API requests.
- 🚨 This project currently runs **only on the Hedera Testnet** and is intended **for development and testing purposes only**.




   
