import { Router } from "express";
import { jsonSafe, validAddress } from "../protocol.js";
import { depositId } from "../bridge.js";
export function api({ store, protocol, config, status, bridge }) {
  const router = Router();
  const run = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res)).catch(next);
  router.get("/health", (_, res) =>
    res.json({
      status: status.error ? "degraded" : status.lastSuccess ? "ok" : "starting",
      ...status,
    })
  );
  router.get("/config", (_, res) =>
    res.json({
      chainId: config.chainId,
      sz: config.sz,
      et: config.et,
      wrapper: config.wrapper,
      sources: config.sources.map(({ rpc, ...s }) => s),
    })
  );
  router.get(
    "/price",
    run(async (_, res) => {
      const [price, count, value] = await Promise.all([
        protocol.sz.getCurrentPrice(),
        protocol.sz.totalStakingPackages(),
        protocol.sz.totalStakedAmountUSD(),
      ]);
      res.json(
        jsonSafe({
          priceUSD: price,
          totalPackages: count,
          totalStakedUSD: value,
        })
      );
    })
  );
  router.get(
    "/packages/:user",
    run(async (req, res) => {
      if (!validAddress(req.params.user))
        return res.status(400).json({ error: "Invalid wallet" });
      const ids = await protocol.sz.getUserPackageIds(req.params.user);
      const packages = await Promise.all(
        ids.map((id) => protocol.sz.packages(id).then((p) => p.toObject()))
      );
      res.json(jsonSafe({ packages }));
    })
  );
  router.get(
    "/transactions/:user",
    run((req, res) => {
      const user = req.params.user?.trim();
      if (!validAddress(user))
        return res.status(400).json({ error: "Invalid wallet" });
      res.json({ transactions: store.events(user) });
    })
  );
  router.get(
    "/events",
    run((_, res) => res.json({ transactions: store.events() }))
  );
  router.get(
    "/deposits",
    run((req, res) => {
      const user = req.query.user ? String(req.query.user).trim() : null;
      if (user && !validAddress(user))
        return res.status(400).json({ error: "Invalid wallet" });
      res.json({ deposits: store.deposits(user) });
    })
  );
  router.post(
    "/deposits/relay",
    run(async (req, res) => {
      const { source, sourceTx, recipient, adapter, nonce, amount } = req.body || {};
      if (!source || !sourceTx) {
        return res.status(400).json({ error: "Missing source or sourceTx" });
      }

      const sChainId = Number(source);
      const s = config.sources.find((x) => x.chainId === sChainId);
      const effectiveAdapter = adapter || s?.adapter;
      if (!effectiveAdapter) {
        return res.status(400).json({ error: "Source adapter not configured" });
      }

      const effectiveNonce = BigInt(nonce || 1);
      const effectiveAmount = BigInt(amount || 0);
      const dId = depositId(sChainId, effectiveAdapter, effectiveNonce);

      if (bridge?.wrapper) {
        try {
          const processed = await bridge.wrapper.isDepositProcessed(dId);
          if (processed) {
            return res.json({
              success: true,
              alreadyProcessed: true,
              message: "Deposit already processed on Polygon Amoy wrapper",
            });
          }
        } catch (checkErr) {
          console.warn("Could not check isDepositProcessed:", checkErr?.message);
        }
      }

      if (!bridge?.canMint) {
        return res.status(503).json({
          error: "Bridge relayer key not configured on backend service",
        });
      }

      try {
        const tx = await bridge.wrapper.mintDeposit(
          recipient,
          effectiveAmount,
          BigInt(sChainId),
          effectiveAdapter,
          effectiveNonce,
          sourceTx
        );
        const receipt = await tx.wait();

        store.deposit({
          id: dId,
          source: sChainId,
          nonce: effectiveNonce.toString(),
          recipient,
          amount: effectiveAmount.toString(),
          sourceTx,
          blockHash: receipt.blockHash,
          blockNumber: receipt.blockNumber,
        });
        store.update(dId, "MINTED", receipt.hash);

        return res.json({
          success: true,
          mintTx: receipt.hash,
          message: "Deposit successfully minted by bridge relayer",
        });
      } catch (mintErr) {
        console.error("Relayer mint error:", mintErr);
        return res.status(500).json({
          error: mintErr?.reason || mintErr?.message || "Relayer mint transaction failed",
        });
      }
    })
  );
  router.get(
    "/user/secondary-wallet/:wallet",
    run(async (req, res) => {
      const wallet = req.params.wallet?.trim();
      if (!validAddress(wallet))
        return res.status(400).json({ error: "Invalid wallet address" });
      const record = store.getSecondaryWallet(wallet);
      let onChainSecondary = null;
      try {
        if (protocol?.sz?.secondaryWallets) {
          const addr = await protocol.sz.secondaryWallets(wallet);
          if (addr && addr !== "0x0000000000000000000000000000000000000000") {
            onChainSecondary = addr;
          }
        }
      } catch {}
      const secondaryWallet = record?.secondary_wallet || onChainSecondary || null;
      const isSecondaryFor = store.getPrimaryForSecondaryWallet(wallet);
      const isLocked = Boolean(secondaryWallet);
      const isSecondaryWallet = Boolean(isSecondaryFor);

      const replacements = store.getWalletReplacements(wallet);
      const hasReplacementRecord = replacements.some(
        (r) => r.old_wallet === wallet.toLowerCase()
      );
      const effectiveStatus = record?.status || (onChainSecondary ? "ACTIVE" : "UNSET");
      const isReplaced = effectiveStatus === "REPLACED" || hasReplacementRecord;
      const isMigrated = isReplaced || (effectiveStatus === "ACTIVE" && Boolean(secondaryWallet));
      const migratedTo = isMigrated ? secondaryWallet : null;
      const isPaused = store.isWalletPaused(wallet);

      res.json({
        primaryWallet: wallet,
        secondaryWallet,
        status: effectiveStatus,
        onChainSecondaryWallet: onChainSecondary,
        isLocked,
        canUpdate: !isLocked,
        isSecondaryWallet,
        primaryForThisSecondary: isSecondaryFor?.primary_wallet || null,
        isReplaced: Boolean(isReplaced),
        isMigrated: Boolean(isMigrated),
        migratedTo,
        isPaused: Boolean(isPaused),
        createdAt: record?.created_at || null,
        updatedAt: record?.updated_at || null,
      });
    })
  );
  router.post(
    "/user/secondary-wallet",
    run(async (req, res) => {
      const primaryWallet = req.body?.primaryWallet?.trim();
      const secondaryWallet = req.body?.secondaryWallet?.trim();
      if (!validAddress(primaryWallet) || !validAddress(secondaryWallet)) {
        return res
          .status(400)
          .json({ error: "Invalid primary or secondary wallet address" });
      }
      if (primaryWallet.toLowerCase() === secondaryWallet.toLowerCase()) {
        return res
          .status(400)
          .json({ error: "Secondary wallet cannot be the same as primary wallet" });
      }
      const existing = store.getSecondaryWallet(primaryWallet);
      let onChainSecondary = null;
      try {
        if (protocol?.sz?.secondaryWallets) {
          const addr = await protocol.sz.secondaryWallets(primaryWallet);
          if (addr && addr !== "0x0000000000000000000000000000000000000000") {
            onChainSecondary = addr;
          }
        }
      } catch {}

      if ((existing && existing.secondary_wallet) || onChainSecondary) {
        return res.status(403).json({
          error:
            "Secondary wallet is already configured. Every user can only set their secondary wallet once; once set, it cannot be updated.",
        });
      }
      const record = store.setSecondaryWallet(primaryWallet, secondaryWallet, "PENDING_ACTIVATION");
      res.json({
        success: true,
        message: "Secondary wallet configured successfully in database, awaiting admin activation",
        ...record,
      });
    })
  );
  router.post(
    "/admin/activate-secondary-wallet",
    run(async (req, res) => {
      const primaryWallet = req.body?.primaryWallet?.trim();
      const txHash = req.body?.txHash?.trim() || "";
      if (!validAddress(primaryWallet)) {
        return res.status(400).json({ error: "Invalid primary wallet address" });
      }
      const existing = store.getSecondaryWallet(primaryWallet);
      if (!existing || !existing.secondary_wallet) {
        return res.status(404).json({ error: "No secondary backup wallet found for this user" });
      }
      const record = store.activateSecondaryWallet(primaryWallet, txHash);
      res.json({
        success: true,
        message: "Secondary backup wallet activated successfully",
        ...record,
      });
    })
  );
  router.get(
    "/admin/user-details/:wallet",
    run(async (req, res) => {
      const wallet = req.params.wallet;
      if (!validAddress(wallet))
        return res.status(400).json({ error: "Invalid wallet address" });

      const record = store.getSecondaryWallet(wallet);
      let onChainSecondary = null;
      let ids = [];
      let packages = [];
      let activeCount = 0;
      let szBalance = "0";

      try {
        if (protocol?.sz) {
          const [rawIds, onChainSec, activeBig, balBig] = await Promise.all([
            protocol.sz.getUserPackageIds(wallet).catch(() => []),
            protocol.sz.secondaryWallets(wallet).catch(() => null),
            protocol.sz.activePackages(wallet).catch(() => 0n),
            protocol.sz.balanceOf(wallet).catch(() => 0n),
          ]);
          ids = rawIds;
          activeCount = Number(activeBig);
          szBalance = balBig.toString();
          if (
            onChainSec &&
            onChainSec !== "0x0000000000000000000000000000000000000000"
          ) {
            onChainSecondary = onChainSec;
          }
          packages = await Promise.all(
            ids.map((id) => protocol.sz.packages(id).then((p) => p.toObject()))
          );
        }
      } catch (err) {
        console.error("Error reading chain details:", err);
      }

      const deposits = store.deposits(wallet);
      const events = store.events(wallet);
      const replacements = store.getWalletReplacements(wallet);

      const secWallet = record?.secondary_wallet || onChainSecondary || null;
      const isSecPaused = secWallet ? store.isWalletPaused(secWallet) : false;
      const secPauseInfo = secWallet ? store.getWalletPauseInfo(secWallet) : null;

      res.json(
        jsonSafe({
          primaryWallet: wallet,
          secondaryWallet: secWallet,
          secondaryWalletStatus:
            record?.status || (onChainSecondary ? "ACTIVE" : "UNSET"),
          onChainSecondaryWallet: onChainSecondary,
          createdAt: record?.created_at || null,
          updatedAt: record?.updated_at || null,
          packageCount: packages.length,
          activePackages: activeCount,
          szBalance,
          packages,
          depositCount: deposits.length,
          deposits,
          eventCount: events.length,
          events,
          replacements,
          isPaused: store.isWalletPaused(wallet),
          pauseInfo: store.getWalletPauseInfo(wallet),
          isSecondaryPaused: isSecPaused,
          secondaryPauseInfo: secPauseInfo,
        })
      );
    })
  );
  router.get(
    "/user/paused-status/:wallet",
    run((req, res) => {
      const wallet = req.params.wallet?.trim();
      if (!validAddress(wallet)) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      const isPaused = store.isWalletPaused(wallet);
      const pauseInfo = store.getWalletPauseInfo(wallet);
      res.json({ wallet, isPaused, pauseInfo });
    })
  );
  router.post(
    "/admin/pause-wallet",
    run((req, res) => {
      const wallet = req.body?.wallet?.trim();
      const { isPaused, reason, txHash } = req.body || {};
      if (!validAddress(wallet)) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      const sanitizedReason = typeof reason === "string" ? reason.slice(0, 500) : "";
      const sanitizedTxHash = typeof txHash === "string" ? txHash.slice(0, 100) : "";
      const result = store.setWalletPaused(
        wallet,
        Boolean(isPaused),
        sanitizedReason || (isPaused ? "Emergency admin freeze" : "Admin unpaused"),
        sanitizedTxHash
      );
      res.json({
        success: true,
        message: isPaused
          ? "Wallet paused / frozen successfully"
          : "Wallet unpaused successfully",
        ...result,
      });
    })
  );
  router.get(
    "/admin/security-activity",
    run((req, res) => {
      const wallet = req.query.wallet ? String(req.query.wallet).trim() : null;
      if (wallet && !validAddress(wallet)) {
        return res.status(400).json({ error: "Invalid wallet address query parameter" });
      }
      const activities = store.securityAudit(wallet);
      res.json(
        jsonSafe({
          total: activities.length,
          activities,
        })
      );
    })
  );
  router.post(
    "/admin/update-secondary-wallet",
    run((req, res) => {
      const primaryWallet = req.body?.primaryWallet?.trim();
      const secondaryWallet = req.body?.secondaryWallet?.trim();
      const txHash = typeof req.body?.txHash === "string" ? req.body.txHash.slice(0, 100) : "";
      if (!validAddress(primaryWallet) || !validAddress(secondaryWallet)) {
        return res.status(400).json({ error: "Invalid primary or secondary wallet address" });
      }
      if (primaryWallet.toLowerCase() === secondaryWallet.toLowerCase()) {
        return res.status(400).json({ error: "Secondary wallet cannot be identical to primary wallet" });
      }
      const existing = store.getSecondaryWallet(primaryWallet);
      if (!existing || !existing.secondary_wallet) {
        return res.status(400).json({
          error: "Cannot change secondary wallet: User has not recorded a secondary wallet. Admin can only pause the primary wallet.",
        });
      }
      const record = store.setSecondaryWallet(primaryWallet, secondaryWallet, txHash);
      res.json({
        success: true,
        message: "Secondary wallet updated successfully by administrator",
        ...record,
      });
    })
  );
  router.post(
    "/admin/activate-secondary-wallet",
    run((req, res) => {
      const primaryWallet = req.body?.primaryWallet?.trim();
      const txHash = typeof req.body?.txHash === "string" ? req.body.txHash.slice(0, 100) : "";
      if (!validAddress(primaryWallet)) {
        return res.status(400).json({ error: "Invalid primary wallet address" });
      }
      const existing = store.getSecondaryWallet(primaryWallet);
      if (!existing || !existing.secondary_wallet) {
        return res.status(400).json({
          error: "Cannot activate secondary wallet: User has not recorded a secondary wallet.",
        });
      }
      const record = store.activateSecondaryWallet(primaryWallet, txHash);
      res.json({
        success: true,
        message: "Secondary backup wallet activated and primary wallet automatically paused successfully",
        ...record,
      });
    })
  );
  router.post(
    "/admin/replace-wallet",
    run((req, res) => {
      const oldWallet = req.body?.oldWallet?.trim();
      const newWallet = req.body?.newWallet?.trim();
      const txHash = typeof req.body?.txHash === "string" ? req.body.txHash.slice(0, 100) : null;
      const packagesMigrated = Number(req.body?.packagesMigrated || 0);
      if (!validAddress(oldWallet) || !validAddress(newWallet)) {
        return res
          .status(400)
          .json({ error: "Invalid old or new wallet address" });
      }
      if (oldWallet.toLowerCase() === newWallet.toLowerCase()) {
        return res
          .status(400)
          .json({ error: "Old and new wallet must be different" });
      }
      const existing = store.getSecondaryWallet(oldWallet);
      if (!existing || !existing.secondary_wallet || existing.status === "REPLACED") {
        return res.status(400).json({
          error: "Cannot replace wallet: User primary wallet has already been replaced or has not recorded a secondary wallet.",
        });
      }
      const result = store.replaceWalletOffchain(
        oldWallet,
        newWallet,
        txHash,
        packagesMigrated
      );
      res.json({
        success: true,
        message: "Wallet replaced successfully in off-chain database",
        result,
      });
    })
  );
  router.get(
    ["/admin/replacements", "/admin/wallet-replacements"],
    run((req, res) => {
      const replacements = store.getWalletReplacements(null);
      res.json(
        jsonSafe({
          total: replacements.length,
          replacements,
        })
      );
    })
  );
  router.post(["/packages/buy", "/admin/record-offchain-sale"], (_, res) =>
    res
      .status(410)
      .json({
        error:
          "Submit a signed contract transaction. Confirmed events are indexed automatically.",
      })
  );
  return router;
}
