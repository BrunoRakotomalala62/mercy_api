import test from "node:test";
import assert from "node:assert/strict";
import { createPinnedLookup, validateImageUrl } from "../src/image.js";
import { isPrivateOrReservedIp, validateUid } from "../src/security.js";

test("les réseaux privés et réservés sont bloqués", () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "::1",
    "fd00::1",
  ]) {
    assert.equal(isPrivateOrReservedIp(address), true, address);
  }
  assert.equal(isPrivateOrReservedIp("8.8.8.8"), false);
});

test("seules les URL HTTPS publiques sont acceptées", () => {
  assert.throws(() => validateImageUrl("http://example.com/a.jpg"));
  assert.throws(() => validateImageUrl("https://localhost/a.jpg"));
  assert.throws(() => validateImageUrl("https://127.0.0.1/a.jpg"));
  assert.equal(
    validateImageUrl("https://images.example.com/a.jpg").hostname,
    "images.example.com",
  );
});

test("la liste blanche d'hôtes accepte les sous-domaines", () => {
  assert.equal(
    validateImageUrl("https://cdn.example.com/a.png", ["example.com"]).hostname,
    "cdn.example.com",
  );
  assert.throws(() =>
    validateImageUrl("https://example.net/a.png", ["example.com"]),
  );
});

test("le DNS épinglé respecte les deux signatures Node", () => {
  const lookup = createPinnedLookup({ address: "8.8.8.8", family: 4 });

  lookup("example.com", { all: true }, (error, addresses) => {
    assert.equal(error, null);
    assert.deepEqual(addresses, [{ address: "8.8.8.8", family: 4 }]);
  });

  lookup("example.com", { all: false }, (error, address, family) => {
    assert.equal(error, null);
    assert.equal(address, "8.8.8.8");
    assert.equal(family, 4);
  });
});

test("uid est strictement validé", () => {
  assert.equal(validateUid("user-123"), "user-123");
  assert.throws(() => validateUid(""));
  assert.throws(() => validateUid("../secret"));
});
