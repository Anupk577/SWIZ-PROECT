import fs from "node:fs";
import { isAddress } from "ethers";
export function loadConfig() {
  if (!process.env.DEPLOYMENT_CONFIG)
    throw Error("Set DEPLOYMENT_CONFIG to a reviewed deployment JSON");
  const c = JSON.parse(fs.readFileSync(process.env.DEPLOYMENT_CONFIG, "utf8"));
  if (
    !isAddress(c.sz) ||
    !isAddress(c.wrapper) ||
    !isAddress(c.et) ||
    !c.rpc ||
    !Number.isSafeInteger(c.chainId) ||
    !Number.isSafeInteger(c.startBlock) ||
    c.startBlock < 0 ||
    !Number.isInteger(c.confirmations) ||
    c.confirmations < 1
  )
    throw Error("Invalid destination configuration");
  if (!Array.isArray(c.sources)) throw Error("Sources required");
  const ids = new Set();
  for (const s of c.sources) {
    if (
      !isAddress(s.adapter) ||
      !isAddress(s.token) ||
      !isAddress(s.treasury) ||
      !s.rpc ||
      !Number.isInteger(s.confirmations) ||
      s.confirmations < 1 ||
      !Number.isSafeInteger(s.startBlock) ||
      s.startBlock < 0 ||
      !Number.isSafeInteger(s.chainId) ||
      ids.has(s.chainId)
    )
      throw Error("Invalid/duplicate source");
    ids.add(s.chainId);
  }
  return c;
}
