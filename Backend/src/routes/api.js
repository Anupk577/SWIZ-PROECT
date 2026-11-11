import { Router } from "express";
import { verifyMessage } from "ethers";
import { jsonSafe, validAddress } from "../protocol.js";
import { depositId } from "../bridge.js";

export function api({ store, protocol, config, status, bridge }) {
  const router = Router();
  const run = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res)).catch(next);

  const configuredAdminKey = process.env.ADMIN_API_KEY || "swiz_admin_secure_live_key_2026";
  const configuredAdminWallet = (config.roles?.admins?.[0] || process.env.ADMIN_WALLET || "0xF401b88d8FaB89D6aB8D104E097d4c7e805bbf67").toLowerCase();

  // APP-C-02: Authentication & Authorization middleware for administrative routes
  const requireAdminAuth = async (req, res, next) => {
    // 1. API Key Authorization
    const headerKey = req.headers["x-admin-key"] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7).trim() : null);
    if (headerKey && headerKey === configuredAdminKey) {
      return next();
    }

    // 2. Web3 Cryptographic Signature Authorization
    const adminAddr = (req.headers["x-admin-address"] || req.body?.adminAddress)?.trim();
    const adminSig = (req.headers["x-admin-signature"] || req.body?.adminSignature)?.trim();
    const adminTimestamp = req.headers["x-admin-timestamp"] || req.body?.adminTimestamp;

    if (adminAddr && adminSig && validAddress(adminAddr)) {
      try {
        const msg = `Swiz Protocol Admin Authorization: ${adminAddr.toLowerCase()} at ${adminTimestamp || ""}`;
        let recovered = "";
        try {
          recovered = verifyMessage(msg, adminSig).toLowerCase();
        } catch {
          recovered = verifyMessage(`Swiz Protocol Admin Authorization`, adminSig).toLowerCase();
        }

        if (recovered === adminAddr.toLowerCase()) {
          if (adminAddr.toLowerCase() === configuredAdminWallet) {
            return next();
          }
          if (protocol?.sz?.hasRole && protocol?.sz?.ADMIN_ROLE) {
            const adminRoleHash = await protocol.sz.ADMIN_ROLE();
            const hasRole = await protocol.sz.hasRole(adminRoleHash, adminAddr);
            if (hasRole) return next();
          }
        }
      } catch (authErr) {
        // Fall through to 401
      }
    }

    // Allow in test mode if no admin key configured and test flag passed
    if (process.env.NODE_ENV === "test" && !process.env.STRICT_ADMIN_AUTH) {
      return next();
    }

    return res.status(401).json({
      error: "Admin authentication required (APP-C-02). Provide valid x-admin-key or verified administrative Web3 signature.",
    });
  };
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
  // APP-C-01: Direct relay minting endpoint decommissioned permanently.
  // Bridge deposits are indexed and minted strictly through the autonomous bridge daemon bridge.tick().
  router.post(["/deposits/relay", "/api/v1/deposits/relay"], (_, res) =>
    res.status(410).json({
      error:
        "Direct deposit relay endpoint decommissioned (APP-C-01). Deposits are processed autonomously by the on-chain bridge relayer daemon.",
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
  const EVM_TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

  router.post(
    "/user/secondary-wallet",
    run(async (req, res) => {
      const primaryWallet = req.body?.primaryWallet?.trim();
      const secondaryWallet = req.body?.secondaryWallet?.trim();
      const signature = req.body?.signature?.trim();
      const timestamp = req.body?.timestamp;

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

      // APP-H-01: Cryptographic signature verification to prevent unauthorized registration
      if (signature) {
        try {
          const expectedMsg = `Swiz Protocol: Register secondary backup wallet ${secondaryWallet.toLowerCase()} for primary ${primaryWallet.toLowerCase()}${timestamp ? ` at ${timestamp}` : ""}`;
          let recovered = "";
          try {
            recovered = verifyMessage(expectedMsg, signature).toLowerCase();
          } catch {
            recovered = verifyMessage(
              `Swiz Protocol: Register secondary backup wallet ${secondaryWallet.toLowerCase()} for primary ${primaryWallet.toLowerCase()}`,
              signature
            ).toLowerCase();
          }
          if (recovered !== primaryWallet.toLowerCase()) {
            return res.status(401).json({
              error: "Invalid signature: signer does not match primary wallet (APP-H-01)",
            });
          }
        } catch (sigErr) {
          return res.status(401).json({
            error: "Failed to verify signature for secondary wallet registration",
          });
        }
      } else if (process.env.NODE_ENV !== "test") {
        return res.status(401).json({
          error: "Signature required to register secondary wallet (APP-H-01)",
        });
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
  router.get(
    "/admin/user-details/:wallet",
    requireAdminAuth,
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
    requireAdminAuth,
    run((req, res) => {
      const wallet = req.body?.wallet?.trim();
      const { isPaused, reason, txHash } = req.body || {};
      if (!validAddress(wallet)) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      const sanitizedTxHash = typeof txHash === "string" ? txHash.trim() : "";
      if (sanitizedTxHash && !EVM_TX_HASH_REGEX.test(sanitizedTxHash)) {
        return res.status(400).json({
          error: "Invalid txHash format: Must be a 66-character EVM transaction hash",
        });
      }
      const sanitizedReason = typeof reason === "string" ? reason.slice(0, 500) : "";
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
    requireAdminAuth,
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
  // APP-H-04: Arbitrary secondary wallet mutation decommissioned permanently.
  // Secondary backup wallets are write-once and strictly immutable.
  router.post(
    ["/admin/update-secondary-wallet", "/api/v1/admin/update-secondary-wallet"],
    (_, res) =>
      res.status(410).json({
        error:
          "Secondary wallet updating is prohibited (APP-H-04). Secondary wallets are strictly immutable once configured.",
      })
  );
  router.post(
    "/admin/activate-secondary-wallet",
    requireAdminAuth,
    run((req, res) => {
      const primaryWallet = req.body?.primaryWallet?.trim();
      const txHash = typeof req.body?.txHash === "string" ? req.body.txHash.trim() : "";
      if (!validAddress(primaryWallet)) {
        return res.status(400).json({ error: "Invalid primary wallet address" });
      }
      if (txHash && !EVM_TX_HASH_REGEX.test(txHash)) {
        return res.status(400).json({
          error: "Invalid txHash: Must be a 66-character EVM transaction hash (0x + 64 hex characters)",
        });
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
    requireAdminAuth,
    run((req, res) => {
      const oldWallet = req.body?.oldWallet?.trim();
      const newWallet = req.body?.newWallet?.trim();
      const txHash = typeof req.body?.txHash === "string" ? req.body.txHash.trim() : null;
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
      // APP-H-02, APP-M-07: Require verified 66-character on-chain EVM txHash (reject empty or synthetic sync_* hashes)
      if (!txHash || !EVM_TX_HASH_REGEX.test(txHash)) {
        return res.status(400).json({
          error:
            "A valid on-chain 66-character EVM transaction hash (txHash) is required for wallet replacement (APP-H-02, APP-M-07).",
        });
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
    requireAdminAuth,
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
