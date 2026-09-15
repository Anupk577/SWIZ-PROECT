import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeApiBase, requestJson } from "../src/services/http.ts";

test("normalizes host-only, API-prefix and trailing-slash configuration", () => {
  assert.equal(normalizeApiBase(" http://127.0.0.1:5001/ "), "http://127.0.0.1:5001/api/v1");
  assert.equal(normalizeApiBase("https://example.com/api/"), "https://example.com/api/v1");
  assert.equal(normalizeApiBase("/api/v1/"), "/api/v1");
  assert.equal(normalizeApiBase("/backend/api/v1/"), "/backend/api/v1");
  assert.equal(normalizeApiBase(""), "/api/v1");
});

test("loads JSON source configuration from the normalized endpoint", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "http://127.0.0.1:5001/api/v1/config");
    assert.equal((init?.headers as Record<string, string>).Accept, "application/json");
    return Response.json({ sources: [{ chainId: 97 }] });
  });
  assert.deepEqual(await requestJson("http://127.0.0.1:5001/", "/config"), { sources: [{ chainId: 97 }] });
});

test("an HTML SPA fallback never leaks a JSON parse exception", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("<!doctype html><html>SPA fallback</html>", { headers: { "content-type": "text/html" } }));
  await assert.rejects(requestJson("/api/v1", "/config"), { message: "Service unavailable. Please try again shortly." });
});

test("malformed JSON produces the same recoverable service error", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("<!doctype html>", { headers: { "content-type": "application/json" } }));
  await assert.rejects(requestJson("/api/v1", "/config"), { message: "Service unavailable. Please try again shortly." });
});

test("offline or timed-out backend produces a recoverable service error", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(requestJson("/api/v1", "/config"), { message: "Service unavailable. Please try again shortly." });
});

test("proxy failures are handled before parsing the response body", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("upstream unavailable", { status: 502 }));
  await assert.rejects(requestJson("/api/v1", "/config"), { message: "Service unavailable. Please try again shortly." });
});
