import { DatabaseSync } from "node:sqlite";
import path from "node:path";

function safeJson(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export class Store {
  constructor(filename = process.env.DB_PATH || path.resolve("swiz.sqlite")) {
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS cursors (key TEXT PRIMARY KEY, block INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS deposits (id TEXT PRIMARY KEY, source INTEGER NOT NULL, nonce TEXT NOT NULL, recipient TEXT NOT NULL, amount TEXT NOT NULL, sourceTx TEXT NOT NULL, blockHash TEXT NOT NULL, blockNumber INTEGER NOT NULL, state TEXT NOT NULL, mintTx TEXT, error TEXT, updated INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, user TEXT NOT NULL, txHash TEXT NOT NULL, type TEXT NOT NULL, block INTEGER NOT NULL, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS secondary_wallets (primary_wallet TEXT PRIMARY KEY, secondary_wallet TEXT NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS wallet_replacements (id TEXT PRIMARY KEY, old_wallet TEXT NOT NULL, new_wallet TEXT NOT NULL, packages_migrated INTEGER DEFAULT 0, tx_hash TEXT, timestamp INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS paused_wallets (wallet TEXT PRIMARY KEY, is_paused INTEGER NOT NULL, reason TEXT, updated_at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_events_user ON events(user);
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
  CREATE INDEX IF NOT EXISTS idx_deposits_recipient ON deposits(recipient);
  CREATE INDEX IF NOT EXISTS idx_deposits_state ON deposits(state);
  CREATE INDEX IF NOT EXISTS idx_secondary_wallets_secondary ON secondary_wallets(secondary_wallet);
  CREATE INDEX IF NOT EXISTS idx_wallet_replacements_old ON wallet_replacements(old_wallet);
  CREATE INDEX IF NOT EXISTS idx_wallet_replacements_new ON wallet_replacements(new_wallet);
  CREATE INDEX IF NOT EXISTS idx_paused_wallets_paused ON paused_wallets(is_paused);`);
    this.syncHistoricalEvents();
  }
  transaction(fn) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }
  cursor(key, start) {
    return (
      this.db.prepare("SELECT block FROM cursors WHERE key=?").get(key)
        ?.block ?? start
    );
  }
  setCursor(key, block) {
    this.db
      .prepare(
        "INSERT INTO cursors VALUES (?,?) ON CONFLICT(key) DO UPDATE SET block=excluded.block"
      )
      .run(key, block);
  }
  deposit(d) {
    this.db
      .prepare(
        "INSERT INTO deposits (id,source,nonce,recipient,amount,sourceTx,blockHash,blockNumber,state,updated) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING"
      )
      .run(
        d.id,
        d.source,
        d.nonce,
        d.recipient.toLowerCase(),
        d.amount,
        d.sourceTx,
        d.blockHash,
        d.blockNumber,
        "VERIFIED",
        Date.now()
      );
  }
  update(id, state, mintTx = null, error = null) {
    this.db
      .prepare(
        "UPDATE deposits SET state=?,mintTx=COALESCE(?,mintTx),error=?,updated=? WHERE id=?"
      )
      .run(state, mintTx, error, Date.now(), id);
  }
  deposits(user) {
    return user
      ? this.db
          .prepare(
            "SELECT * FROM deposits WHERE recipient=? ORDER BY updated DESC LIMIT 500"
          )
          .all(user.toLowerCase())
      : this.db
          .prepare("SELECT * FROM deposits ORDER BY updated DESC LIMIT 500")
          .all();
  }
  pending() {
    return this.db
      .prepare(
        "SELECT * FROM deposits WHERE state IN ('VERIFIED','RETRY','SUBMITTED') ORDER BY blockNumber LIMIT 100"
      )
      .all();
  }
  event(e) {
    this.db
      .prepare("INSERT OR IGNORE INTO events VALUES (?,?,?,?,?,?)")
      .run(
        e.id,
        e.user.toLowerCase(),
        e.txHash || "",
        e.type,
        e.block || 0,
        JSON.stringify(e.data)
      );
  }
  events(user) {
    let rows;
    if (user) {
      const u = user.toLowerCase();
      const sec = this.getSecondaryWallet(u);
      const secWallet = sec?.secondary_wallet?.toLowerCase();
      const prim = this.db
        .prepare("SELECT primary_wallet FROM secondary_wallets WHERE secondary_wallet=?")
        .get(u);
      const primWallet = prim?.primary_wallet?.toLowerCase();

      const wallets = [u];
      if (secWallet && !wallets.includes(secWallet)) wallets.push(secWallet);
      if (primWallet && !wallets.includes(primWallet)) wallets.push(primWallet);

      const placeholders = wallets.map(() => "?").join(",");
      rows = this.db
        .prepare(
          `SELECT rowid, * FROM events 
           WHERE user IN (${placeholders}) 
              OR data LIKE '%"primaryWallet":"' || ? || '"%'
              OR data LIKE '%"secondaryWallet":"' || ? || '"%'
              OR data LIKE '%"oldWallet":"' || ? || '"%'
              OR data LIKE '%"newWallet":"' || ? || '"%'
           ORDER BY rowid DESC LIMIT 500`
        )
        .all(...wallets, u, u, u, u);
    } else {
      rows = this.db
        .prepare("SELECT rowid, * FROM events ORDER BY rowid DESC LIMIT 500")
        .all();
    }
    const seen = new Set();
    const result = [];
    for (const e of rows) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        result.push({
          ...e,
          ...safeJson(e.data),
          status: "CONFIRMED",
          data: undefined,
        });
      }
    }
    return result;
  }
  securityAudit(wallet = null) {
    const types = [
      "WalletPaused",
      "WalletUnpaused",
      "WalletReplaced",
      "SecondaryWalletConfigured",
      "SecondaryWalletUpdated",
      "SecondaryWalletReplaced",
      "SecondaryWalletPaused",
      "SecondaryWalletUnpaused",
      "PrimaryWalletPaused",
      "PrimaryWalletUnpaused",
    ];
    const typePlaceholders = types.map(() => "?").join(",");
    let rows;
    if (wallet) {
      const w = wallet.toLowerCase();
      rows = this.db
        .prepare(
          `SELECT rowid, * FROM events 
           WHERE (user=? OR data LIKE '%"primaryWallet":"' || ? || '"%' OR data LIKE '%"secondaryWallet":"' || ? || '"%' OR data LIKE '%"oldWallet":"' || ? || '"%' OR data LIKE '%"newWallet":"' || ? || '"%')
             AND type IN (${typePlaceholders})
           ORDER BY rowid DESC LIMIT 200`
        )
        .all(w, w, w, w, w, ...types);
    } else {
      rows = this.db
        .prepare(
          `SELECT rowid, * FROM events 
           WHERE type IN (${typePlaceholders})
           ORDER BY rowid DESC LIMIT 300`
        )
        .all(...types);
    }
    const seen = new Set();
    const result = [];
    for (const e of rows) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        result.push({
          ...e,
          ...safeJson(e.data),
          status: "CONFIRMED",
          data: undefined,
        });
      }
    }
    return result;
  }
  getSecondaryWallet(primaryWallet) {
    if (!primaryWallet) return null;
    return (
      this.db
        .prepare("SELECT * FROM secondary_wallets WHERE primary_wallet=?")
        .get(primaryWallet.toLowerCase()) ?? null
    );
  }
  getPrimaryForSecondaryWallet(secondaryWallet) {
    if (!secondaryWallet) return null;
    return (
      this.db
        .prepare(
          "SELECT primary_wallet, status, created_at, updated_at FROM secondary_wallets WHERE secondary_wallet=?"
        )
        .get(secondaryWallet.toLowerCase()) ?? null
    );
  }
  setSecondaryWallet(primaryWallet, secondaryWallet, status = "PENDING_ACTIVATION", txHash = "") {
    return this.transaction(() => {
      const p = primaryWallet.toLowerCase();
      const s = secondaryWallet.toLowerCase();
      const now = Date.now();
      const existing = this.getSecondaryWallet(p);
      const isUpdate =
        existing &&
        existing.secondary_wallet &&
        existing.secondary_wallet.toLowerCase() !== s;
      const oldSecondary = existing?.secondary_wallet
        ? existing.secondary_wallet.toLowerCase()
        : null;

      this.db
        .prepare(
          `INSERT INTO secondary_wallets (primary_wallet, secondary_wallet, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(primary_wallet) DO UPDATE SET secondary_wallet=excluded.secondary_wallet, status=excluded.status, updated_at=excluded.updated_at`
        )
        .run(p, s, status, now, now);

      const eventType = isUpdate ? "SecondaryWalletUpdated" : "SecondaryWalletConfigured";

      // 1. Record for primary wallet
      this.event({
        id: `sec:${p}:${now}:prim`,
        user: p,
        txHash: txHash || "",
        type: eventType,
        block: 0,
        data: {
          primaryWallet: p,
          secondaryWallet: s,
          oldSecondaryWallet: oldSecondary,
          newSecondaryWallet: s,
          role: "PRIMARY_WALLET",
          status,
          txHash: txHash || "",
          timestamp: now,
        },
      });

      // 2. Record for new secondary backup wallet
      this.event({
        id: `sec:${s}:${now}:sec`,
        user: s,
        txHash: txHash || "",
        type: eventType,
        block: 0,
        data: {
          primaryWallet: p,
          secondaryWallet: s,
          oldSecondaryWallet: oldSecondary,
          newSecondaryWallet: s,
          role: "SECONDARY_WALLET",
          status,
          txHash: txHash || "",
          timestamp: now,
        },
      });

      // 3. If previous secondary was replaced, record for previous secondary wallet
      if (isUpdate && oldSecondary) {
        this.event({
          id: `sec:${oldSecondary}:${now}:replaced`,
          user: oldSecondary,
          txHash: txHash || "",
          type: "SecondaryWalletReplaced",
          block: 0,
          data: {
            primaryWallet: p,
            oldSecondaryWallet: oldSecondary,
            newSecondaryWallet: s,
            role: "REPLACED_SECONDARY_WALLET",
            status: "REPLACED",
            txHash: txHash || "",
            timestamp: now,
          },
        });
      }

      return {
        primary_wallet: p,
        secondary_wallet: s,
        status,
        created_at: now,
        updated_at: now,
        txHash,
      };
    });
  }
  activateSecondaryWallet(primaryWallet, txHash = "") {
    return this.transaction(() => {
      const p = primaryWallet.toLowerCase();
      const now = Date.now();
      const existing = this.getSecondaryWallet(p);
      if (!existing || !existing.secondary_wallet) {
        throw new Error("No secondary backup wallet found for this user");
      }
      const s = existing.secondary_wallet.toLowerCase();

      this.db
        .prepare(
          "UPDATE secondary_wallets SET status='ACTIVE', updated_at=? WHERE primary_wallet=?"
        )
        .run(now, p);

      this.event({
        id: `sec_act:${p}:${now}:prim`,
        user: p,
        txHash: txHash || "",
        type: "SecondaryWalletActivated",
        block: 0,
        data: {
          primaryWallet: p,
          secondaryWallet: s,
          role: "PRIMARY_WALLET",
          status: "ACTIVE",
          txHash: txHash || "",
          timestamp: now,
        },
      });

      this.event({
        id: `sec_act:${s}:${now}:sec`,
        user: s,
        txHash: txHash || "",
        type: "SecondaryWalletActivated",
        block: 0,
        data: {
          primaryWallet: p,
          secondaryWallet: s,
          role: "SECONDARY_WALLET",
          status: "ACTIVE",
          txHash: txHash || "",
          timestamp: now,
        },
      });

      // Automatically pause primary wallet upon secondary wallet activation
      const pauseReason = "Automatically paused upon secondary wallet activation";
      this.db
        .prepare(
          `INSERT INTO paused_wallets (wallet, is_paused, reason, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(wallet) DO UPDATE SET is_paused=excluded.is_paused, reason=excluded.reason, updated_at=excluded.updated_at`
        )
        .run(p, 1, pauseReason, now);

      this.db
        .prepare("UPDATE deposits SET recipient=?, updated=? WHERE recipient=?")
        .run(s, now, p);

      this.db
        .prepare("UPDATE events SET user=? WHERE user=?")
        .run(s, p);

      const repId = `${p}:${s}:${now}`;
      this.db
        .prepare(
          "INSERT OR IGNORE INTO wallet_replacements (id, old_wallet, new_wallet, packages_migrated, tx_hash, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .run(repId, p, s, 0, txHash, now);

      this.event({
        id: `pause:${p}:${now}`,
        user: p,
        txHash: txHash || "",
        type: "WalletPaused",
        block: 0,
        data: {
          wallet: p,
          primaryWallet: p,
          isPaused: true,
          reason: pauseReason,
          txHash: txHash || "",
          timestamp: now,
        },
      });

      return {
        primary_wallet: p,
        secondary_wallet: s,
        status: "ACTIVE",
        is_paused: true,
        updated_at: now,
        txHash,
      };
    });
  }
  replaceWalletOffchain(oldWallet, newWallet, txHash = null, packagesMigrated = 0) {
    return this.transaction(() => {
      const oldW = oldWallet.toLowerCase();
      const newW = newWallet.toLowerCase();
      const now = Date.now();
      const id = `${oldW}:${newW}:${now}`;

      this.db
        .prepare(
          "UPDATE secondary_wallets SET status='REPLACED', updated_at=? WHERE primary_wallet=?"
        )
        .run(now, oldW);

      // Permanently pause replaced old wallet
      this.db
        .prepare(
          `INSERT INTO paused_wallets (wallet, is_paused, reason, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(wallet) DO UPDATE SET is_paused=excluded.is_paused, reason=excluded.reason, updated_at=excluded.updated_at`
        )
        .run(oldW, 1, "Permanently frozen following wallet replacement", now);

      this.db
        .prepare("UPDATE deposits SET recipient=?, updated=? WHERE recipient=?")
        .run(newW, now, oldW);

      this.db
        .prepare("UPDATE events SET user=? WHERE user=?")
        .run(newW, oldW);

      this.db
        .prepare(
          "INSERT INTO wallet_replacements (id, old_wallet, new_wallet, packages_migrated, tx_hash, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .run(id, oldW, newW, packagesMigrated, txHash, now);

      // Record replacement activity for both old and new wallet
      this.event({
        id: `rep:${id}:old`,
        user: oldW,
        txHash: txHash || "",
        type: "WalletReplaced",
        block: 0,
        data: {
          oldWallet: oldW,
          newWallet: newW,
          primaryWallet: oldW,
          secondaryWallet: newW,
          packagesMigrated: packagesMigrated,
          txHash: txHash || "",
          role: "ORIGINAL_WALLET",
          timestamp: now,
        },
      });
      this.event({
        id: `rep:${id}:new`,
        user: newW,
        txHash: txHash || "",
        type: "WalletReplaced",
        block: 0,
        data: {
          oldWallet: oldW,
          newWallet: newW,
          primaryWallet: oldW,
          secondaryWallet: newW,
          packagesMigrated: packagesMigrated,
          txHash: txHash || "",
          role: "REPLACEMENT_WALLET",
          timestamp: now,
        },
      });

      // Also record SecondaryWalletReplaced event
      this.event({
        id: `rep:sec:${id}:old`,
        user: oldW,
        txHash: txHash || "",
        type: "SecondaryWalletReplaced",
        block: 0,
        data: {
          oldWallet: oldW,
          newWallet: newW,
          primaryWallet: oldW,
          secondaryWallet: newW,
          packagesMigrated: packagesMigrated,
          txHash: txHash || "",
          status: "REPLACED",
          timestamp: now,
        },
      });
      this.event({
        id: `rep:sec:${id}:new`,
        user: newW,
        txHash: txHash || "",
        type: "SecondaryWalletReplaced",
        block: 0,
        data: {
          oldWallet: oldW,
          newWallet: newW,
          primaryWallet: oldW,
          secondaryWallet: newW,
          packagesMigrated: packagesMigrated,
          txHash: txHash || "",
          status: "REPLACED",
          timestamp: now,
        },
      });

      return {
        id,
        old_wallet: oldW,
        new_wallet: newW,
        packages_migrated: packagesMigrated,
        tx_hash: txHash,
        timestamp: now,
      };
    });
  }
  getWalletReplacements(wallet = null) {
    if (wallet) {
      const w = wallet.toLowerCase();
      return this.db
        .prepare(
          "SELECT * FROM wallet_replacements WHERE old_wallet=? OR new_wallet=? ORDER BY timestamp DESC"
        )
        .all(w, w);
    }
    return this.db
      .prepare(
        "SELECT * FROM wallet_replacements ORDER BY timestamp DESC LIMIT 100"
      )
      .all();
  }
  isWalletPaused(wallet) {
    if (!wallet) return false;
    const row = this.db
      .prepare("SELECT is_paused FROM paused_wallets WHERE wallet=?")
      .get(wallet.toLowerCase());
    return Boolean(row?.is_paused);
  }
  getWalletPauseInfo(wallet) {
    if (!wallet) return null;
    const row = this.db
      .prepare("SELECT * FROM paused_wallets WHERE wallet=?")
      .get(wallet.toLowerCase());
    if (!row) return { wallet: wallet.toLowerCase(), is_paused: false, reason: "", updated_at: null };
    return {
      wallet: row.wallet,
      is_paused: Boolean(row.is_paused),
      reason: row.reason || "",
      updated_at: row.updated_at,
    };
  }
  setWalletPaused(wallet, isPaused, reason = "", txHash = "") {
    if (!wallet) return null;
    return this.transaction(() => {
      const w = wallet.toLowerCase();
      const pausedInt = isPaused ? 1 : 0;
      const now = Date.now();
      this.db
        .prepare(
          `INSERT INTO paused_wallets (wallet, is_paused, reason, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(wallet) DO UPDATE SET is_paused=excluded.is_paused, reason=excluded.reason, updated_at=excluded.updated_at`
        )
        .run(w, pausedInt, reason, now);

      // Check if this wallet is registered as a secondary wallet
      const primRow = this.db
        .prepare("SELECT primary_wallet FROM secondary_wallets WHERE secondary_wallet=?")
        .get(w);

      // Check if this wallet is a primary wallet with a registered secondary
      const secRow = this.getSecondaryWallet(w);

      if (primRow) {
        // The wallet being paused/unpaused is a SECONDARY wallet
        const prim = primRow.primary_wallet.toLowerCase();
        const secEventType = isPaused ? "SecondaryWalletPaused" : "SecondaryWalletUnpaused";

        // Record for the secondary wallet itself
        this.event({
          id: `pause:sec:${w}:${now}`,
          user: w,
          txHash: txHash || "",
          type: secEventType,
          block: 0,
          data: {
            wallet: w,
            primaryWallet: prim,
            secondaryWallet: w,
            isSecondaryWallet: true,
            isPaused: Boolean(isPaused),
            reason: reason || (isPaused ? "Secondary backup wallet emergency freeze" : "Secondary backup wallet unpaused"),
            txHash: txHash || "",
            timestamp: now,
          },
        });

        // Also record in the primary wallet's timeline
        this.event({
          id: `pause:prim_for_sec:${prim}:${w}:${now}`,
          user: prim,
          txHash: txHash || "",
          type: secEventType,
          block: 0,
          data: {
            wallet: w,
            primaryWallet: prim,
            secondaryWallet: w,
            isSecondaryWallet: true,
            isPaused: Boolean(isPaused),
            reason: reason || (isPaused ? "Secondary backup wallet emergency freeze" : "Secondary backup wallet unpaused"),
            txHash: txHash || "",
            timestamp: now,
          },
        });
      } else {
        // Primary or general wallet paused/unpaused
        const eventType = isPaused ? "WalletPaused" : "WalletUnpaused";
        this.event({
          id: `pause:${w}:${now}`,
          user: w,
          txHash: txHash || "",
          type: eventType,
          block: 0,
          data: {
            wallet: w,
            primaryWallet: w,
            secondaryWallet: secRow?.secondary_wallet?.toLowerCase() || null,
            isPaused: Boolean(isPaused),
            reason: reason || (isPaused ? "Primary wallet emergency freeze" : "Admin unpaused"),
            txHash: txHash || "",
            timestamp: now,
          },
        });

        // If this primary wallet has a secondary wallet, also notify the secondary wallet timeline
        if (secRow && secRow.secondary_wallet) {
          const secW = secRow.secondary_wallet.toLowerCase();
          this.event({
            id: `pause:sec_for_prim:${secW}:${w}:${now}`,
            user: secW,
            txHash: txHash || "",
            type: eventType,
            block: 0,
            data: {
              wallet: w,
              primaryWallet: w,
              secondaryWallet: secW,
              isPaused: Boolean(isPaused),
              reason: reason || (isPaused ? "Primary wallet emergency freeze" : "Primary wallet unpaused"),
              txHash: txHash || "",
              timestamp: now,
            },
          });
        }
      }

      return { wallet: w, is_paused: Boolean(isPaused), reason, updated_at: now, txHash };
    });
  }
  syncHistoricalEvents() {
    try {
      const reps = this.db.prepare("SELECT * FROM wallet_replacements").all();
      for (const r of reps) {
        const now = r.timestamp || Date.now();
        this.event({
          id: `rep:${r.id}:old`,
          user: r.old_wallet.toLowerCase(),
          txHash: r.tx_hash || "",
          type: "WalletReplaced",
          block: 0,
          data: {
            oldWallet: r.old_wallet.toLowerCase(),
            newWallet: r.new_wallet.toLowerCase(),
            packagesMigrated: r.packages_migrated,
            txHash: r.tx_hash,
            role: "ORIGINAL_WALLET",
            timestamp: now,
          },
        });
        this.event({
          id: `rep:${r.id}:new`,
          user: r.new_wallet.toLowerCase(),
          txHash: r.tx_hash || "",
          type: "WalletReplaced",
          block: 0,
          data: {
            oldWallet: r.old_wallet.toLowerCase(),
            newWallet: r.new_wallet.toLowerCase(),
            packagesMigrated: r.packages_migrated,
            txHash: r.tx_hash,
            role: "REPLACEMENT_WALLET",
            timestamp: now,
          },
        });
      }
      const secs = this.db.prepare("SELECT * FROM secondary_wallets").all();
      for (const s of secs) {
        this.event({
          id: `sec:${s.primary_wallet}:${s.created_at}`,
          user: s.primary_wallet.toLowerCase(),
          txHash: "",
          type: "SecondaryWalletConfigured",
          block: 0,
          data: {
            primaryWallet: s.primary_wallet.toLowerCase(),
            secondaryWallet: s.secondary_wallet.toLowerCase(),
            status: s.status,
            timestamp: s.created_at,
          },
        });
      }
      const paused = this.db.prepare("SELECT * FROM paused_wallets").all();
      for (const p of paused) {
        if (p.is_paused) {
          this.event({
            id: `pause:${p.wallet}:${p.updated_at}`,
            user: p.wallet.toLowerCase(),
            txHash: "",
            type: "WalletPaused",
            block: 0,
            data: {
              wallet: p.wallet.toLowerCase(),
              isPaused: true,
              reason: p.reason || "Emergency Freeze",
              timestamp: p.updated_at,
            },
          });
        }
      }
    } catch (e) {
      console.warn("Event sync notice:", e?.message);
    }
  }
  getPausedWallets() {
    return this.db
      .prepare("SELECT * FROM paused_wallets WHERE is_paused=1 ORDER BY updated_at DESC")
      .all()
      .map((row) => ({
        wallet: row.wallet,
        is_paused: true,
        reason: row.reason,
        updated_at: row.updated_at,
      }));
  }
  close() {
    this.db.close();
  }
}
