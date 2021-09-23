// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenGenerator {
    Token[] tokens;

    event printAddress(address value);
    
    function createToken(address _recipient, string memory _tokenDescription, string memory _tokenID, string memory _uri) external {
        Token token = new Token(_tokenDescription, _tokenID);
        tokens.push(token);
        emit printAddress(address(token));
        token.mint(_recipient, _uri);
    }
}

contract Token is ERC721, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;
    Counters.Counter _tokenIds;
    mapping(uint256 => string) _tokenURIs;
    struct Tokens {
        uint256 id;
        string uri;
    }
    
    constructor(string memory _tokenDescription, string memory _tokenID) ERC721(_tokenDescription, _tokenID) {}
    
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    function getTokenURI(uint256 tokenId) public view virtual returns(string memory) {
        require(_exists(tokenId));
        return _tokenURIs[tokenId];
    }
    
    function getAllTokens() public view returns(Tokens[] memory) {
        uint256 latestId = _tokenIds.current();
        uint256 counter = 0;
        Tokens[] memory allTokens = new Tokens[](latestId);
        
        for (uint i = 0; i < latestId; i++) {
            if (_exists(counter)) {
                string memory uri = getTokenURI(counter);
                allTokens[counter] = Tokens(counter, uri);
            }
            counter++;
        }
        return allTokens;
    } 
    
    function mint(address recipient, string memory uri) public onlyOwner() {
        _tokenIds.increment();
        uint256 newId = _tokenIds.current();
        _mint(recipient, newId);
        _setTokenURI(newId, uri);
    }
}