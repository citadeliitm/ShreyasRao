const hre = require("hardhat");

async function main() {
  const nftTokenAddress = "0xYourNFTTokenAddressHere"; // Replace with your NFT token contract address
  const serialNumber = 1; 
  const commitDuration = 180; 
  const revealDuration = 180;

  const VickreyAuction = await hre.ethers.getContractFactory("VickreyAuction");
  const auction = await VickreyAuction.deploy(
    nftTokenAddress,
    serialNumber,
    commitDuration,
    revealDuration
  );

  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();
  
  console.log("VickreyAuction deployed to:", auctionAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

