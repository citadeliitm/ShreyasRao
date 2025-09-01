// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
contract EnglishAuction {
    address public seller;
    address public nftAddress;
    uint256 public tokenId;

    uint256 public startTime;
    uint256 public endTime;
    uint256 public startingBid;

    address public highestBidder;
    uint256 public highestBid;

    bool public finalized;

    event BidPlaced(address indexed bidder, uint256 amount);
    event AuctionFinalized(address winner, uint256 finalAmount);

    constructor(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _biddingTime,
        uint256 _startingBid
    ) {
        seller = msg.sender;
        nftAddress = _nftAddress;
        tokenId = _tokenId;
        startingBid = _startingBid;
        startTime = block.timestamp;
        endTime = block.timestamp + _biddingTime;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Not the seller");
        _;
    }

    modifier auctionActive() {
        require(block.timestamp >= startTime && block.timestamp < endTime, "Auction not active");
        _;
    }

    modifier auctionEnded() {
        require(block.timestamp >= endTime, "Auction not yet ended");
        _;
    }

    function bid() external payable auctionActive {
        require(msg.value >= startingBid, "Bid below starting price");
        require(msg.value > highestBid, "There already is a higher or equal bid");

        // Refund the previous highest bidder
        if (highestBidder != address(0)) {
            (bool refunded, ) = payable(highestBidder).call{value: highestBid}("");
            require(refunded, "Refund to previous bidder failed");
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        emit BidPlaced(msg.sender, msg.value);
    }

    function finalizeAuction() external auctionEnded {
        require(!finalized, "Auction already finalized");
        finalized = true;

        IERC721 nftToken = IERC721(nftAddress);

        if (highestBidder != address(0)) {
            // Transfer NFT to winner
            nftToken.transferFrom(seller, highestBidder, tokenId);

            // Transfer HBAR to seller
            (bool sent, ) = payable(seller).call{value: highestBid}("");
            require(sent, "Failed to send funds to seller");
        } else {
            // No valid bids, return NFT to seller
            nftToken.transferFrom(address(this), seller, tokenId);
        }

        emit AuctionFinalized(highestBidder, highestBid);
    }

    // View helper
    function getAuctionStatus() external view returns (string memory) {
        if (finalized) return "Finalized";
        if (block.timestamp < startTime) return "Not started";
        if (block.timestamp < endTime) return "Active";
        return "Ended - Waiting Finalization";
    }
}
