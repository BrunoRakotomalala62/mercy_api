import test from "node:test";
import assert from "node:assert/strict";
import { getConfig } from "../src/config.js";
import {
  ConversationStore,
  resetMemoryStoreForTests,
  trimMessages,
} from "../src/store.js";

test.beforeEach(() => resetMemoryStoreForTests());

test("le stockage mémoire conserve une conversation par uid", async () => {
  const config = getConfig({ CONVERSATION_TTL_SECONDS: "3600" });
  const store = new ConversationStore(config);
  await store.set("alice", [
    { role: "user", content: "Bonjour" },
    { role: "assistant", content: "Salut" },
  ]);

  const alice = await store.get("alice");
  const bob = await store.get("bob");
  assert.equal(alice.messages.length, 2);
  assert.equal(alice.persistent, false);
  assert.deepEqual(bob.messages, []);
});

test("les messages trop anciens sont supprimés", () => {
  const messages = [
    { role: "user", content: "a" },
    { role: "assistant", content: "b" },
    { role: "user", content: "c" },
  ];
  assert.deepEqual(trimMessages(messages, 2, 100), messages.slice(1));
});

test("clear efface l'historique", async () => {
  const store = new ConversationStore(getConfig({}));
  await store.set("123", [{ role: "user", content: "test" }]);
  await store.clear("123");
  assert.deepEqual((await store.get("123")).messages, []);
});
