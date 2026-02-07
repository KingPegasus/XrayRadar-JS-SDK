#!/usr/bin/env node
/* eslint-env node */
/**
 * Syncs the root package.json version to all workspace packages.
 * Run after `npm version patch|minor|major` so all packages share the same version.
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = rootPkg.version;

const workspaces = ["core", "node", "browser", "react", "nextjs"];
for (const name of workspaces) {
  const path = join(root, "packages", name, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  pkg.version = version;
  writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`packages/${name}/package.json → ${version}`);
}
