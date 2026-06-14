import assert from "node:assert/strict";
import test from "node:test";

import { isAdminEmail } from "./admin.ts";

test("recognizes the configured GetItCertified administrator", () => {
  assert.equal(isAdminEmail("nightmareasian@gmail.com"), true);
  assert.equal(isAdminEmail(" NIGHTMAREASIAN@GMAIL.COM "), true);
});

test("does not grant administrator access to another account", () => {
  assert.equal(isAdminEmail("student@example.com"), false);
  assert.equal(isAdminEmail(null), false);
});
