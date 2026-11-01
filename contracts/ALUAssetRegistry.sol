// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title ALUAssetRegistry
/// @notice Registers digital assets (e.g. the official ALU logo) as ERC-721 NFTs.
///         Each NFT permanently stores the SHA-256 fingerprint of the file, who
///         registered it and when, so anyone can verify a copy of the file.
contract ALUAssetRegistry is ERC721 {
    /// @notice Registration details stored for every asset.
    struct AssetMetadata {
        string name;          // Human-readable asset name, e.g. "ALU Official Logo"
        string fileType;      // File type, e.g. "image/png"
        bytes32 contentHash;  // SHA-256 hash of the file contents
        address registeredBy; // Wallet that registered the asset
        uint256 timestamp;    // Unix time of registration (block timestamp)
    }

    /// @dev Last token ID issued. Token IDs start at 1.
    uint256 private _tokenIdCounter;

    /// @notice Token ID => registration details (publicly readable via getAsset).
    mapping(uint256 => AssetMetadata) private _assets;

    /// @notice SHA-256 hash => true once that exact file has been registered.
    mapping(bytes32 => bool) public hashRegistered;

    /// @notice Emitted whenever a new asset is registered.
    event AssetRegistered(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 indexed contentHash,
        string name,
        string fileType,
        uint256 timestamp
    );

    constructor() ERC721("ALU Asset Registry", "ALUA") {}

    /// @notice Register a new asset and mint its NFT to the caller.
    /// @param name        Asset name.
    /// @param fileType    File type / MIME type.
    /// @param contentHash SHA-256 hash of the file, as bytes32.
    /// @return tokenId    The ID of the newly minted NFT.
    function registerAsset(
        string calldata name,
        string calldata fileType,
        bytes32 contentHash
    ) external returns (uint256 tokenId) {
        require(contentHash != bytes32(0), "ALUAssetRegistry: empty hash");
        require(bytes(name).length > 0, "ALUAssetRegistry: empty name");
        require(!hashRegistered[contentHash], "ALUAssetRegistry: asset already registered");

        // Effects first (checks-effects-interactions): _safeMint may call
        // onERC721Received on a contract caller, so state is updated before it.
        tokenId = ++_tokenIdCounter;
        hashRegistered[contentHash] = true;
        _assets[tokenId] = AssetMetadata({
            name: name,
            fileType: fileType,
            contentHash: contentHash,
            registeredBy: msg.sender,
            timestamp: block.timestamp
        });

        _safeMint(msg.sender, tokenId);

        emit AssetRegistered(tokenId, msg.sender, contentHash, name, fileType, block.timestamp);
    }

    /// @notice Check whether a file's hash matches the hash stored for a token.
    /// @dev View function: free to call off-chain (no gas).
    function verifyLogoIntegrity(uint256 tokenId, bytes32 contentHash)
        external
        view
        returns (bool isAuthentic, string memory message)
    {
        _requireOwned(tokenId); // reverts for unknown token IDs
        if (_assets[tokenId].contentHash == contentHash) {
            return (true, "Logo is authentic.");
        }
        return (false, "Warning: logo does not match.");
    }

    /// @notice Return the full registration record for a token.
    function getAsset(uint256 tokenId) external view returns (AssetMetadata memory) {
        _requireOwned(tokenId);
        return _assets[tokenId];
    }

    /// @notice Total number of assets registered so far.
    function totalAssets() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
