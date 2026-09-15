// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
/// Admin may bind exactly one buyback contract; cannot rebind or mint directly.
contract EcosystemToken is ERC20, Ownable {
    address public minter;
    uint256 public immutable cap; // zero = uncapped
    event MinterBound(address indexed minter);
    constructor(
        address admin,
        uint256 maxSupply
    ) ERC20("Ecosystem Token", "ET") Ownable(admin) {
        cap = maxSupply;
    }
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    function bindMinter(address contract_) external onlyOwner {
        require(
            minter == address(0) && contract_.code.length > 0,
            "Invalid minter"
        );
        minter = contract_;
        emit MinterBound(contract_);
        renounceOwnership();
    }
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Only buyback");
        require(cap == 0 || totalSupply() + amount <= cap, "ET cap");
        _mint(to, amount);
    }
}
