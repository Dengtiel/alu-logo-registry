// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ALULogoToken (ALUT)
/// @notice ERC-20 token representing fractional ownership shares of the ALU logo.
///         A fixed supply of 1,000,000 ALUT is minted once, to the logo owner.
contract ALULogoToken is ERC20, Ownable {
    /// @notice Fixed total supply: 1,000,000 tokens (18 decimals).
    uint256 public constant TOTAL_SUPPLY = 1_000_000 * 10 ** 18;

    /// @notice Emitted when the owner distributes shares to a stakeholder.
    event SharesDistributed(address indexed recipient, uint256 amount);

    /// @param logoOwner Wallet that receives the full supply and becomes contract owner.
    constructor(address logoOwner) ERC20("ALU Logo Token", "ALUT") Ownable(logoOwner) {
        _mint(logoOwner, TOTAL_SUPPLY);
    }

    /// @notice Transfer ownership shares from the owner to a stakeholder.
    /// @param recipient Stakeholder wallet (faculty, student, administration...).
    /// @param amount    Number of tokens in base units (18 decimals).
    function distributeShares(address recipient, uint256 amount) external onlyOwner {
        require(amount > 0, "ALULogoToken: amount must be greater than zero");
        // _transfer reverts on zero address or insufficient owner balance.
        _transfer(owner(), recipient, amount);
        emit SharesDistributed(recipient, amount);
    }

    /// @notice Whole-number ownership percentage of `account` (e.g. 500,000 ALUT => 50).
    /// @dev Integer division rounds down, so holdings below 1% return 0.
    function ownershipPercentage(address account) external view returns (uint256) {
        return (balanceOf(account) * 100) / TOTAL_SUPPLY;
    }
}
