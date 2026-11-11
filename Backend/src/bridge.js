import { Contract, JsonRpcProvider, FallbackProvider, Wallet, AbiCoder, keccak256, parseUnits } from "ethers";

function createResilientProvider(rpcInput, chainId) {
  if (Array.isArray(rpcInput) && rpcInput.length > 1) {
    const providers = rpcInput.map((url, idx) => ({
      provider: new JsonRpcProvider(url, chainId, { staticNetwork: true }),
      priority: idx + 1,
      weight: 1,
      stallTimeout: 2500,
    }));
    return new FallbackProvider(providers, 1);
  }
  const url = Array.isArray(rpcInput) ? rpcInput[0] : rpcInput;
  return new JsonRpcProvider(url, chainId, { staticNetwork: true });
}

export const ADAPTER_ABI = [
  "function token() view returns(address)",
  "function treasury() view returns(address)",
  "function scale() view returns(uint256)",
  "function destinationChainId() view returns(uint256)",
  "function destinationWrapper() view returns(address)",
  "event Deposited(uint256 indexed nonce,address indexed sender,address indexed recipient,uint256 amount6,uint256 sourceAmount,uint256 destinationChainId,address destinationWrapper)",
];
export const WRAPPER_ABI = [
  "function adapters(uint256) view returns(address)",
  "function isDepositProcessed(bytes32) view returns(bool)",
  "function mintDeposit(address,uint256,uint256,address,uint256,bytes32)",
  "event DepositMinted(bytes32 indexed depositId,address indexed recipient,uint256 amount,uint256 sourceChainId,address adapter,uint256 nonce,bytes32 sourceTxHash)",
];
export const depositId = (chain, adapter, nonce) =>
  keccak256(
    AbiCoder.defaultAbiCoder().encode(
      ["uint256", "address", "uint256"],
      [chain, adapter, nonce]
    )
  );
export function validateEvent(event, scale) {
  if (event.amount6 <= 0n || event.sourceAmount !== event.amount6 * scale)
    throw Error("Invalid normalized amount");
}
export class Bridge {
  constructor(config, store, { signer } = {}) {
    this.config = config;
    this.store = store;
    this.destination = createResilientProvider(config.rpc, config.chainId);
    const rawKey = process.env.RELAYER_PRIVATE_KEY?.trim();
    const relayerKey = rawKey ? (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) : null;
    this.canMint = Boolean(signer || relayerKey);
    this.wrapper = new Contract(
      config.wrapper,
      WRAPPER_ABI,
      signer ||
        (relayerKey
          ? new Wallet(relayerKey, this.destination)
          : this.destination)
    );
    this.sources = config.sources.map((s) => ({
      ...s,
      provider: createResilientProvider(s.rpc, s.chainId),
    }));
    this.ready = false;
  }
  async initialize() {
    if (
      Number((await this.destination.getNetwork()).chainId) !==
      this.config.chainId
    )
      throw Error("Destination chain mismatch");
    for (const s of this.sources) {
      try {
        if (Number((await s.provider.getNetwork()).chainId) !== s.chainId) {
          console.warn(`Source chain mismatch for ${s.name || s.chainId} (${s.chainId})`);
          s.disabled = true;
          continue;
        }
        s.contract = new Contract(s.adapter, ADAPTER_ABI, s.provider);
        const [token, treasury, chain, wrapper, scale, approved] =
          await Promise.all([
            s.contract.token(),
            s.contract.treasury(),
            s.contract.destinationChainId(),
            s.contract.destinationWrapper(),
            s.contract.scale(),
            this.wrapper.adapters(s.chainId),
          ]);
        if (
          token.toLowerCase() !== s.token.toLowerCase() ||
          treasury.toLowerCase() !== s.treasury.toLowerCase() ||
          Number(chain) !== this.config.chainId ||
          wrapper.toLowerCase() !== this.config.wrapper.toLowerCase() ||
          approved.toLowerCase() !== s.adapter.toLowerCase()
        ) {
          console.warn(`Source adapter configuration mismatch for ${s.name || s.chainId} (${s.chainId})`);
          s.disabled = true;
          continue;
        }
        s.scale = scale;
      } catch (err) {
        console.warn(`Warning: Could not initialize source ${s.name || s.chainId}:`, err?.message || err);
        s.disabled = true;
      }
    }
    this.ready = true;
  }
  async tick() {
    if (!this.ready) await this.initialize();
    for (const s of this.sources) {
      if (!s.disabled) await this.scan(s);
    }
    for (const d of this.store.pending()) await this.process(d);
  }
  async scan(s) {
    if (s.disabled) return;
    const finalized = (await s.provider.getBlockNumber()) - s.confirmations;
    const from = this.store.cursor(`source:${s.chainId}`, s.startBlock - 1) + 1;
    if (from > finalized) return;
    const to = Math.min(finalized, from + 9);
    const logs = await s.contract.queryFilter(
      s.contract.filters.Deposited(),
      from,
      to
    );
    for (const log of logs) {
      const receipt = await s.provider.getTransactionReceipt(
        log.transactionHash
      );
      const block = await s.provider.getBlock(log.blockNumber);
      if (
        !receipt ||
        receipt.status !== 1 ||
        !block ||
        block.hash !== log.blockHash ||
        receipt.blockHash !== log.blockHash
      )
        throw Error("Source finality changed");
      const a = log.args;
      validateEvent(a, s.scale);
      this.store.deposit({
        id: depositId(s.chainId, s.adapter, a.nonce),
        source: s.chainId,
        nonce: a.nonce.toString(),
        recipient: a.recipient,
        amount: a.amount6.toString(),
        sourceTx: log.transactionHash,
        blockHash: log.blockHash,
        blockNumber: log.blockNumber,
      });
    }
    this.store.setCursor(`source:${s.chainId}`, to);
  }
  async process(d) {
    const s = this.sources.find((x) => x.chainId === d.source);
    if (!s) return;
    try {
      const block = await s.provider.getBlock(d.blockNumber);
      if (!block || block.hash !== d.blockHash) {
        this.store.update(d.id, "REJECTED", null, "Source reorganization");
        return;
      }
      if (await this.wrapper.isDepositProcessed(d.id)) {
        const head =
          (await this.destination.getBlockNumber()) - this.config.confirmations;
        const cursorKey = `mint:${d.id}`;
        const from =
          this.store.cursor(cursorKey, this.config.startBlock - 1) + 1;
        if (from <= head) {
          const to = Math.min(head, from + 999);
          const logs = await this.wrapper.queryFilter(
            this.wrapper.filters.DepositMinted(d.id),
            from,
            to
          );
          if (logs.length) {
            this.store.update(d.id, "MINTED", logs[0].transactionHash);
            return;
          }
          this.store.setCursor(cursorKey, to);
        }
        return;
      }
      const txOverrides = {};
      if (d.mintTx) {
        const receipt = await this.destination.getTransactionReceipt(d.mintTx).catch(() => null);
        if (receipt) {
          if (receipt.status === 1) {
            this.store.update(d.id, "MINTED", d.mintTx);
            return;
          }
          // Previous tx reverted on-chain; clear mintTx for fresh submission
          d.mintTx = null;
        } else {
          // Transaction pending: fetch previous tx to bump gas for speedup (APP-H-03)
          const prevTx = await this.destination.getTransaction(d.mintTx).catch(() => null);
          if (prevTx && prevTx.nonce !== undefined) {
            txOverrides.nonce = prevTx.nonce;
            if (prevTx.maxPriorityFeePerGas) {
              txOverrides.maxPriorityFeePerGas = (prevTx.maxPriorityFeePerGas * 125n) / 100n;
            }
          }
        }
      }

      if (!this.canMint) return;

      // Dynamic EIP-1559 gas fee calculation
      try {
        const feeData = await this.destination.getFeeData();
        const block = await this.destination.getBlock("latest").catch(() => null);
        const baseFee = block?.baseFeePerGas || parseUnits("120", "gwei");
        const priority = txOverrides.maxPriorityFeePerGas || (feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 120n) / 100n : parseUnits("35", "gwei"));
        txOverrides.maxPriorityFeePerGas = priority;
        txOverrides.maxFeePerGas = feeData.maxFeePerGas ? (feeData.maxFeePerGas * 135n) / 100n : (baseFee * 135n) / 100n + priority;
      } catch {}

      const tx = await this.wrapper.mintDeposit(
        d.recipient,
        BigInt(d.amount),
        s.chainId,
        s.adapter,
        BigInt(d.nonce),
        d.sourceTx,
        txOverrides
      );
      this.store.update(d.id, "SUBMITTED", tx.hash);
      await tx.wait(1, 60000);
    } catch (error) {
      this.store.update(
        d.id,
        "RETRY",
        null,
        String(error.shortMessage || error.message).slice(0, 300)
      );
    }
  }
}
