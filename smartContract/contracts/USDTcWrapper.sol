// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
/// @title USDTcWrapper (Wrapped USDT Bridge Target)
/// @notice Dedicated minting wrapper that attests to finalized allowlisted source deposits.
/// @dev SECURITY & RELAYER ARCHITECTURE (Addressing SWZ-H-03):
/// - Multiple bridge relayers or multisig/MPC signers can be granted `BRIDGE_RELAYER_ROLE` via AccessControlEnumerable.
/// - The optional `maxDepositLimit` acts as a circuit breaker / maximum single-transaction mint bound to mitigate
///   relayer compromise impact.
contract USDTcWrapper is ERC20, AccessControlEnumerable, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BRIDGE_RELAYER_ROLE =
        keccak256("BRIDGE_RELAYER_ROLE");
    uint256 public maxDepositLimit;
    mapping(bytes32 => bool) public isDepositProcessed;
    mapping(uint256 => address) public adapters;
    event SourceConfigured(uint256 indexed chainId, address adapter);
    event MaxDepositLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event DepositMinted(
        bytes32 indexed depositId,
        address indexed recipient,
        uint256 amount,
        uint256 sourceChainId,
        address adapter,
        uint256 nonce,
        bytes32 sourceTxHash
    );
    constructor(
        address admin,
        address relayer
    ) ERC20("Wrapped USDT", "USDT.c") {
        require(admin != address(0) && relayer != address(0) && admin != relayer, "Invalid admin/relayer");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(BRIDGE_RELAYER_ROLE, relayer);
    }
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    function configureSource(
        uint256 chain,
        address adapter
    ) external onlyRole(ADMIN_ROLE) {
        require(
            chain != 0 &&
                adapter != address(0) &&
                adapters[chain] == address(0),
            "Source already set/invalid"
        );
        adapters[chain] = adapter;
        emit SourceConfigured(chain, adapter);
    }
    function depositId(
        uint256 chain,
        address adapter,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(chain, adapter, nonce));
    }
    function setMaxDepositLimit(uint256 limit) external onlyRole(ADMIN_ROLE) {
        emit MaxDepositLimitUpdated(maxDepositLimit, limit);
        maxDepositLimit = limit;
    }
    function mintDeposit(
        address recipient,
        uint256 amount,
        uint256 chain,
        address adapter,
        uint256 nonce,
        bytes32 sourceTx
    ) external onlyRole(BRIDGE_RELAYER_ROLE) whenNotPaused {
        require(
            recipient != address(0) &&
                amount > 0 &&
                (maxDepositLimit == 0 || amount <= maxDepositLimit) &&
                sourceTx != bytes32(0) &&
                nonce > 0 &&
                adapters[chain] == adapter &&
                adapter != address(0),
            "Invalid deposit"
        );
        bytes32 id = depositId(chain, adapter, nonce);
        require(!isDepositProcessed[id], "Duplicate deposit");
        isDepositProcessed[id] = true;
        _mint(recipient, amount);
        emit DepositMinted(
            id,
            recipient,
            amount,
            chain,
            adapter,
            nonce,
            sourceTx
        );
    }
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._update(from, to, amount);
    }
}
