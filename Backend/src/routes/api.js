import { Router } from "express";
import { jsonSafe, validAddress } from "../protocol.js";
export function api({ store, protocol, config, status }) {
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
  router.get("/transactions/:user", (req, res) => {
    if (!validAddress(req.params.user))
      return res.status(400).json({ error: "Invalid wallet" });
    res.json({ transactions: store.events(req.params.user) });
  });
  router.get("/events", (_, res) => res.json({ transactions: store.events() }));
  router.get("/deposits", (req, res) => {
    if (req.query.user && !validAddress(req.query.user))
      return res.status(400).json({ error: "Invalid wallet" });
    res.json({ deposits: store.deposits(req.query.user) });
  });
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
