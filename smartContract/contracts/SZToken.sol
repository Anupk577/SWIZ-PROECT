// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {EcosystemToken} from "./EcosystemToken.sol";

/// Fixed supply, contract-custodied packages. No withdrawal or early-unlock pathway.
contract SZToken is ERC20, AccessControlEnumerable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 public constant INITIAL_PRICE = 1e6;
    uint256 public constant SECONDS_PER_YEAR = 2 minutes;
    uint256 public constant MAX_MATCHES = 200;
    IERC20 public immutable usdt;
    EcosystemToken public immutable et;
    address public immutable treasury;
    uint256 public totalStakingPackages;
    uint256 public totalStakedAmountUSD;
    uint256 public nextPackageId = 1;
    uint256 public outstandingSZ;
    uint256 public adminFunds;
    uint256 public minPurchase = 1e6;
    uint256 public maxPurchase = 100_000e6;
    uint256 public maxActivePackages; // zero = unlimited
    bool public migrationOpen = true;
    mapping(address => uint256) public activePackages;

    struct Package {
        uint256 id;
        address owner;
        uint256 amount;
        uint256 originalPrice;
        uint256 startTimestamp;
        bool isOffline;
        uint256 etReceived;
        uint256 purchaseValue;
        uint256 purchaseTimestamp;
        uint256 boughtBack;
        uint256 usdtReceived;
        bytes32 paymentReference;
    }
    struct Tranche {
        uint256 unlockTimestamp;
        uint256 quantity;
        uint8 status;
        uint256 boughtBack;
    }
    struct Position {
        uint256 packageId;
        uint256 tranche;
        uint256 unlockAt;
    }
    struct Sale {
        address buyer;
        uint256 amount;
        uint256 value;
        uint256 price;
        uint256 purchasedAt;
        uint256 startedAt;
        bytes32 referenceId;
    }
    mapping(uint256 => Package) public packages;
    mapping(uint256 => uint256[20]) public trancheBoughtBack;
    mapping(address => uint256[]) private ownerPackages;
    mapping(bytes32 => bool) public recordedReferences;
    Position[] private heap;

    event PackageCreated(
        uint256 indexed packageId,
        address indexed owner,
        uint256 amount,
        uint256 price,
        uint256 startTimestamp,
        bool isOffline
    );
    event PurchaseCompleted(
        uint256 indexed packageId,
        address indexed buyer,
        uint256 payment,
        uint256 quantity
    );
    event PriceUpdated(
        uint256 newPrice,
        uint256 totalStakingPackages,
        uint256 totalStakedAmountUSD
    );
    event BuybackExecuted(
        uint256 indexed packageId,
        address indexed buyer,
        address indexed originalStaker,
        uint256 tranche,
        uint256 quantity,
        uint256 usdtAmount,
        uint256 etAmount,
        uint256 buybackPrice
    );
    event TreasuryFunded(address indexed from, uint256 amount);
    event AdminBuyback(uint256 spent, uint256 quantity);
    event FundsWithdrawn(uint256 amount);
    event LimitsUpdated(uint256 minimum, uint256 maximum, uint256 maxActive);
    event MigrationClosed();
    event OfflineRecorded(
        uint256 indexed packageId,
        bytes32 indexed referenceId,
        bool migration
    );
    error InvalidInput();
    error InventoryInsufficient();
    error MatchLimit();
    error Slippage();

    constructor(
        address collateral,
        address ecosystem,
        address treasury_,
        address admin,
        uint256 supply
    ) ERC20("Swiz", "SZ") {
        if (
            admin == address(0) ||
            treasury_ == address(0) ||
            supply == 0 ||
            IERC20Metadata(collateral).decimals() != 6
        ) revert InvalidInput();
        usdt = IERC20(collateral);
        et = EcosystemToken(ecosystem);
        treasury = treasury_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _mint(treasury_, supply);
    }
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    function setLimits(
        uint256 minimum,
        uint256 maximum,
        uint256 maxActive
    ) external onlyRole(ADMIN_ROLE) {
        if (minimum == 0 || maximum < minimum) revert InvalidInput();
        minPurchase = minimum;
        maxPurchase = maximum;
        maxActivePackages = maxActive;
        emit LimitsUpdated(minimum, maximum, maxActive);
    }
    function closeMigration() external onlyRole(ADMIN_ROLE) {
        migrationOpen = false;
        emit MigrationClosed();
    }

    // O(log steps) fixed-point exponentiation. Limit ensures checked arithmetic capacity.
    function _calculatePrice(
        uint256 count,
        uint256 value
    ) internal pure returns (uint256) {
        uint256 n = count / 1000 + value / 100_000e6;
        if (n > 4096) revert InvalidInput();
        uint256 r = 1e18;
        uint256 b = 1_023_300_000_000_000_000;
        while (n > 0) {
            if (n & 1 == 1) r = Math.mulDiv(r, b, 1e18);
            n >>= 1;
            if (n > 0) b = Math.mulDiv(b, b, 1e18);
        }
        return r / 1e12;
    }
    function getCurrentPrice() public view returns (uint256) {
        return _calculatePrice(totalStakingPackages, totalStakedAmountUSD);
    }
    function getUserPackageIds(
        address who
    ) external view returns (uint256[] memory) {
        return ownerPackages[who];
    }
    function getStakingPackages(
        address who
    ) external view returns (Package[] memory result) {
        uint256[] storage ids = ownerPackages[who];
        result = new Package[](ids.length);
        for (uint256 i; i < ids.length; ++i) result[i] = packages[ids[i]];
    }
    function trancheQuantity(
        uint256 id,
        uint256 t
    ) public view returns (uint256) {
        if (t >= 20 || packages[id].owner == address(0)) revert InvalidInput();
        uint256 amount = packages[id].amount;
        return t == 19 ? amount - (amount / 20) * 19 : amount / 20;
    }
    function getUnlockSchedule(
        uint256 id
    ) external view returns (Tranche[20] memory result) {
        for (uint256 t; t < 20; ++t) {
            uint256 qty = trancheQuantity(id, t);
            uint256 filled = trancheBoughtBack[id][t];
            uint256 unlockAt = packages[id].startTimestamp +
                (t + 1) *
                SECONDS_PER_YEAR;
            result[t] = Tranche(
                unlockAt,
                qty,
                filled == qty
                    ? 2
                    : block.timestamp >= unlockAt
                        ? 1
                        : 0,
                filled
            );
        }
    }
    function isFullyBoughtBack(uint256 id) public view returns (bool) {
        return
            packages[id].owner != address(0) &&
            packages[id].boughtBack == packages[id].amount;
    }
    function getBuybackQueueLength() external view returns (uint256) {
        return heap.length;
    }
    function nextBuyback() external view returns (Position memory) {
        return heap.length == 0 ? Position(0, 0, 0) : heap[0];
    }

    function purchase(
        uint256 value,
        uint256 minSZ,
        uint256 deadline
    ) external whenNotPaused nonReentrant returns (uint256 id) {
        if (
            block.timestamp > deadline ||
            value < minPurchase ||
            value > maxPurchase
        ) revert InvalidInput();
        uint256 price = getCurrentPrice();
        uint256 qty = Math.mulDiv(value, 1e6, price);
        if (qty < 20 || qty < minSZ) revert Slippage();
        usdt.safeTransferFrom(msg.sender, address(this), value);
        (uint256 matched, uint256 payout) = _match(qty, value, price, false);
        if (matched < qty) _inventory(qty - matched);
        // Buyer pays reference price. Any cap spread and rounding dust go to AW.
        if (value > payout) usdt.safeTransfer(treasury, value - payout);
        Sale memory sale = Sale(
            msg.sender,
            qty,
            value,
            price,
            block.timestamp,
            block.timestamp,
            bytes32(0)
        );
        id = _create(sale, false, 0, 0, 0);
        emit PurchaseCompleted(id, msg.sender, value, qty);
    }
    function recordOfflineSale(
        Sale calldata sale
    )
        external
        onlyRole(ADMIN_ROLE)
        whenNotPaused
        nonReentrant
        returns (uint256 id)
    {
        _validateSale(sale);
        _inventory(sale.amount);
        id = _create(sale, true, 0, 0, 0);
        emit OfflineRecorded(id, sale.referenceId, false);
    }
    // Import previously completed buybacks without minting historical ET again.
    function importHistoricalSale(
        Sale calldata sale,
        uint256[20] calldata filled,
        uint256 priorET,
        uint256 priorUSDT
    )
        external
        onlyRole(ADMIN_ROLE)
        whenNotPaused
        nonReentrant
        returns (uint256 id)
    {
        if (!migrationOpen) revert InvalidInput();
        _validateSale(sale);
        uint256 total;
        for (uint256 t; t < 20; ++t) {
            uint256 q = t == 19
                ? sale.amount - (sale.amount / 20) * 19
                : sale.amount / 20;
            if (
                filled[t] > q ||
                (filled[t] > 0 &&
                    block.timestamp <
                    sale.startedAt + (t + 1) * SECONDS_PER_YEAR)
            ) revert InvalidInput();
            total += filled[t];
        }
        _inventory(sale.amount - total);
        id = nextPackageId;
        trancheBoughtBack[id] = filled;
        _create(sale, true, total, priorET, priorUSDT);
        emit OfflineRecorded(id, sale.referenceId, true);
    }
    function _validateSale(Sale memory sale) private view {
        if (
            sale.referenceId == bytes32(0) ||
            recordedReferences[sale.referenceId] ||
            sale.purchasedAt == 0 ||
            sale.startedAt < sale.purchasedAt ||
            sale.startedAt > block.timestamp ||
            sale.price == 0 ||
            sale.price > type(uint256).max / 100 ||
            sale.value == 0 ||
            sale.amount < 20
        ) revert InvalidInput();
    }
    function _inventory(uint256 qty) private {
        if (balanceOf(treasury) < qty) revert InventoryInsufficient();
        _transfer(treasury, address(this), qty);
    }
    function _create(
        Sale memory sale,
        bool offline,
        uint256 filled,
        uint256 priorET,
        uint256 priorUSDT
    ) private returns (uint256 id) {
        if (
            sale.buyer == address(0) ||
            sale.buyer == address(this) ||
            (maxActivePackages != 0 &&
                activePackages[sale.buyer] >= maxActivePackages)
        ) revert InvalidInput();
        id = nextPackageId++;
        packages[id] = Package(
            id,
            sale.buyer,
            sale.amount,
            sale.price,
            sale.startedAt,
            offline,
            priorET,
            sale.value,
            sale.purchasedAt,
            filled,
            priorUSDT,
            sale.referenceId
        );
        if (offline) recordedReferences[sale.referenceId] = true;
        ownerPackages[sale.buyer].push(id);
        outstandingSZ += sale.amount - filled;
        if (filled < sale.amount) {
            activePackages[sale.buyer]++;
            _scheduleNext(id, 0);
        }
        totalStakingPackages++;
        totalStakedAmountUSD += sale.value;
        emit PackageCreated(
            id,
            sale.buyer,
            sale.amount,
            sale.price,
            sale.startedAt,
            offline
        );
        emit PriceUpdated(
            getCurrentPrice(),
            totalStakingPackages,
            totalStakedAmountUSD
        );
        assert(balanceOf(address(this)) >= outstandingSZ);
    }
    function addTreasuryFunds(
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) whenNotPaused nonReentrant {
        if (amount == 0) revert InvalidInput();
        usdt.safeTransferFrom(msg.sender, address(this), amount);
        adminFunds += amount;
        emit TreasuryFunded(msg.sender, amount);
    }
    function withdrawTreasuryFunds(
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        if (amount == 0 || amount > adminFunds) revert InvalidInput();
        adminFunds -= amount;
        usdt.safeTransfer(treasury, amount);
        emit FundsWithdrawn(amount);
    }
    function executeAdminBuyback(
        uint256 budget
    ) external onlyRole(ADMIN_ROLE) whenNotPaused nonReentrant {
        if (budget == 0 || budget > adminFunds) revert InvalidInput();
        (uint256 qty, uint256 spent) = _match(
            type(uint256).max,
            budget,
            getCurrentPrice(),
            true
        );
        if (qty == 0) revert InvalidInput();
        adminFunds -= spent;
        _transfer(address(this), treasury, qty);
        emit AdminBuyback(spent, qty);
    }
    function _match(
        uint256 requested,
        uint256 budget,
        uint256 price,
        bool adminBuy
    ) private returns (uint256 matched, uint256 spent) {
        uint256 iterations;
        while (
            matched < requested &&
            heap.length > 0 &&
            heap[0].unlockAt <= block.timestamp
        ) {
            if (++iterations > MAX_MATCHES) revert MatchLimit();
            Position memory head = heap[0];
            Package storage pkg = packages[head.packageId];
            uint256 cap = pkg.originalPrice * 100;
            uint256 rate = price < cap ? price : cap;
            uint256 remaining = trancheQuantity(head.packageId, head.tranche) -
                trancheBoughtBack[head.packageId][head.tranche];
            uint256 qty = Math.min(remaining, requested - matched);
            if (adminBuy)
                qty = Math.min(qty, Math.mulDiv(budget - spent, 1e6, rate));
            if (qty == 0) break;
            uint256 value = Math.mulDiv(qty, rate, 1e6);
            // Sub-micro-USDT settlement dust rounds down; quantity is consumed exactly.
            trancheBoughtBack[head.packageId][head.tranche] += qty;
            pkg.boughtBack += qty;
            outstandingSZ -= qty;
            matched += qty;
            spent += value;
            if (qty == remaining) {
                _pop();
                _scheduleNext(head.packageId, head.tranche + 1);
            }
            if (pkg.boughtBack == pkg.amount) activePackages[pkg.owner]--;
            uint256 etAmount;
            if (head.tranche == 0) {
                pkg.usdtReceived += value;
                usdt.safeTransfer(pkg.owner, value);
            } else {
                etAmount = value;
                pkg.etReceived += value;
                et.mint(pkg.owner, value);
                usdt.safeTransfer(treasury, value);
            }
            emit BuybackExecuted(
                head.packageId,
                msg.sender,
                pkg.owner,
                head.tranche,
                qty,
                head.tranche == 0 ? value : 0,
                etAmount,
                rate
            );
            if (adminBuy && spent == budget) break;
        }
    }
    function _scheduleNext(uint256 id, uint256 from) private {
        for (uint256 t = from; t < 20; ++t)
            if (trancheBoughtBack[id][t] < trancheQuantity(id, t)) {
                _push(
                    Position(
                        id,
                        t,
                        packages[id].startTimestamp + (t + 1) * SECONDS_PER_YEAR
                    )
                );
                return;
            }
    }
    function _less(
        Position memory a,
        Position memory b
    ) private pure returns (bool) {
        return
            a.unlockAt < b.unlockAt ||
            (a.unlockAt == b.unlockAt && a.packageId < b.packageId);
    }
    function _push(Position memory item) private {
        heap.push(item);
        uint256 i = heap.length - 1;
        while (i > 0) {
            uint256 parent = (i - 1) / 2;
            if (!_less(item, heap[parent])) break;
            heap[i] = heap[parent];
            i = parent;
        }
        heap[i] = item;
    }
    function _pop() private {
        Position memory last = heap[heap.length - 1];
        heap.pop();
        if (heap.length == 0) return;
        uint256 i;
        while (2 * i + 1 < heap.length) {
            uint256 child = 2 * i + 1;
            if (child + 1 < heap.length && _less(heap[child + 1], heap[child]))
                child++;
            if (!_less(heap[child], last)) break;
            heap[i] = heap[child];
            i = child;
        }
        heap[i] = last;
    }
}
