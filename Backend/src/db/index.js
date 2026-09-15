import { DatabaseSync } from "node:sqlite";
import path from "node:path";
export class Store {
  constructor(filename = process.env.DB_PATH || path.resolve("swiz.sqlite")) {
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS cursors (key TEXT PRIMARY KEY, block INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS deposits (id TEXT PRIMARY KEY, source INTEGER NOT NULL, nonce TEXT NOT NULL, recipient TEXT NOT NULL, amount TEXT NOT NULL, sourceTx TEXT NOT NULL, blockHash TEXT NOT NULL, blockNumber INTEGER NOT NULL, state TEXT NOT NULL, mintTx TEXT, error TEXT, updated INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, user TEXT NOT NULL, txHash TEXT NOT NULL, type TEXT NOT NULL, block INTEGER NOT NULL, data TEXT NOT NULL);`);
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
        e.txHash,
        e.type,
        e.block,
        JSON.stringify(e.data)
      );
  }
  events(user) {
    const rows = user
      ? this.db
          .prepare(
            "SELECT * FROM events WHERE user=? ORDER BY block DESC LIMIT 500"
          )
          .all(user.toLowerCase())
      : this.db
          .prepare("SELECT * FROM events ORDER BY block DESC LIMIT 500")
          .all();
    return rows.map((e) => ({
      ...e,
      ...JSON.parse(e.data),
      status: "CONFIRMED",
      data: undefined,
    }));
  }
  close() {
    this.db.close();
  }
}
