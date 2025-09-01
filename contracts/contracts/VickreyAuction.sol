// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "./HederaTokenService.sol";
import "./HederaResponseCodes.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract VickreyAuction{
    address public seller;
    address public nftToken; // address of the HTS NFT (converted to EVM address)
    uint256 public serialNumber;

    uint public commitEndTime;
    uint public revealEndTime;

    struct Bid {
        bytes32 commitment;
        uint revealedAmount;
        bool revealed;
    }

    mapping(address => Bid) public bids;
    address[] public bidders;

    address public highestBidder;
    uint public highestBid=0;
    uint public secondHighestBid=0;

    bool public auctionFinalized;

    event BidCommitted(address indexed bidder);
    event BidRevealed(address indexed bidder, uint amount);
    event AuctionFinalized(address indexed winner, uint finalPrice);
    event DebugResponse(uint indexed id);

    constructor(
        address _nftToken,
        uint256 _serialNumber,
        uint _commitDuration,
        uint _revealDuration
    ) {
        seller = msg.sender;
        nftToken = _nftToken;
        serialNumber = _serialNumber;

        commitEndTime = block.timestamp + _commitDuration;
        revealEndTime = commitEndTime + _revealDuration;
    }

function commitBid(bytes32 bidHash) external {
    require(block.timestamp < commitEndTime, "Commit phase has ended");
    require(bids[msg.sender].commitment == 0x0, "Bid already committed");
    require(msg.sender != seller, "Seller cannot bid");

    bids[msg.sender].commitment = bidHash;
    bidders.push(msg.sender);

    emit BidCommitted(msg.sender);
}

function revealBid(uint256 amount, string memory secret) external payable {
    require(block.timestamp >= commitEndTime, "Reveal phase has not started");
    require(block.timestamp < revealEndTime, "Reveal phase has ended");

    Bid storage bid = bids[msg.sender];
    require(!bid.revealed, "Bid already revealed");
    require(bid.commitment != 0x0, "No bid committed");

    bytes32 computed = keccak256(abi.encodePacked(amount, secret));
    require(computed == bid.commitment, "Invalid reveal data");

    bid.revealed = true;
    bid.revealedAmount = amount;

    if (amount > highestBid) {
        secondHighestBid = highestBid;
        highestBid = amount;
        highestBidder = msg.sender;
    } else if (amount > secondHighestBid) {
        secondHighestBid = amount;
    }

    emit BidRevealed(msg.sender, amount);
}

function finalizeAuction() external {
    emit DebugResponse(1); // Start

    require(block.timestamp >= revealEndTime, "Reveal phase not over");
    require(!auctionFinalized, "Auction already finalized");

    emit DebugResponse(2); // Passed time/flag checks
    auctionFinalized = true;

    if (highestBidder != address(0)) {
        emit DebugResponse(3); // Before NFT transfer

        try IERC721(nftToken).transferFrom(seller, highestBidder, serialNumber) {
            emit DebugResponse(4); // NFT transfer successful
        } catch {
            emit DebugResponse(99); // NFT transfer failed
            revert("NFT transfer failed");
        }

        emit DebugResponse(5); // Before paying seller
        //payable(seller).transfer(secondHighestBid);
        emit DebugResponse(6); // After paying seller

        /*uint refund = highestBid - secondHighestBid;
        if (refund > 0) {
            emit DebugResponse(7); // Before refund to winner
            payable(highestBidder).transfer(refund);
            emit DebugResponse(8); // After refund to winner
        }*/
    }

    emit DebugResponse(9); // Before refunding losing bidders
    /*for (uint i = 0; i < bidders.length; i++) {
        address bidder = bidders[i];
        if (bidder != highestBidder && bids[bidder].revealed) {
            uint amt = bids[bidder].revealedAmount;
            if (amt > 0) {
                payable(bidder).transfer(amt);
            }
        }
    }*/

    emit DebugResponse(10); // After all refunds
    emit AuctionFinalized(highestBidder, secondHighestBid);
}


}


