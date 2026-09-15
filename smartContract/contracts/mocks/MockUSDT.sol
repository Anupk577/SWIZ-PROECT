// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Mock USDT
/// @notice Test-only stand-in for the real USDT contract on the target L2. 6 decimals
///         to match real USDT, with an open `mint` so tests can fund buyer wallets.
///         Never deploy this outside a test/dev environment.
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
