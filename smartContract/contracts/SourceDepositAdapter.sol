// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
contract SourceDepositAdapter is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable token;
    address public immutable treasury;
    uint256 public immutable destinationChainId;
    address public immutable destinationWrapper;
    uint256 public immutable scale;
    uint256 public nonce;
    uint256 public minimum;
    uint256 public maximum;
    event Deposited(
        uint256 indexed nonce,
        address indexed sender,
        address indexed recipient,
        uint256 amount6,
        uint256 sourceAmount
    );
    event LimitsUpdated(uint256 minimum, uint256 maximum);
    constructor(
        address usdt,
        address treasury_,
        address admin,
        uint256 destination,
        address wrapper,
        uint256 min6,
        uint256 max6
    ) {
        uint8 d = IERC20Metadata(usdt).decimals();
        require(d >= 6 && d <= 18, "Unsupported decimals");
        require(
            treasury_ != address(0) &&
                admin != address(0) &&
                destination > 0 &&
                wrapper != address(0),
            "Invalid config"
        );
        token = IERC20(usdt);
        treasury = treasury_;
        destinationChainId = destination;
        destinationWrapper = wrapper;
        scale = 10 ** (d - 6);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _limits(min6, max6);
    }
    function _limits(uint256 lo, uint256 hi) private {
        require(lo > 0 && hi >= lo, "Invalid limits");
        minimum = lo;
        maximum = hi;
        emit LimitsUpdated(lo, hi);
    }
    function setLimits(
        uint256 lo,
        uint256 hi
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _limits(lo, hi);
    }
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    function deposit(
        uint256 amount6,
        address recipient
    ) external nonReentrant whenNotPaused {
        require(
            recipient != address(0) && amount6 >= minimum && amount6 <= maximum,
            "Invalid deposit"
        );
        uint256 amount = amount6 * scale;
        uint256 beforeBalance = token.balanceOf(treasury);
        token.safeTransferFrom(msg.sender, treasury, amount);
        require(
            token.balanceOf(treasury) - beforeBalance == amount,
            "Non-exact deposit"
        );
        emit Deposited(++nonce, msg.sender, recipient, amount6, amount);
    }
}
