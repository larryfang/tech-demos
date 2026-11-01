export const SLUGIFY_TS = `export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
`;

export const SLUGIFY_TEST = `import { expect, test } from "bun:test";
import { slugify } from "./slugify";

test("slugify turns titles into url stems", () => {
  expect(slugify("Hello, World!")).toBe("hello-world");
  expect(slugify("  Café au lait  ")).toBe("cafe-au-lait");
});
`;

export const PACKAGE_JSON_BEFORE = `{
  "name": "demo-app",
  "scripts": {
    "dev": "bun --hot src/index.ts"
  }
}
`;

export const PACKAGE_JSON_AFTER = `{
  "name": "demo-app",
  "scripts": {
    "dev": "bun --hot src/index.ts",
    "test": "bun test"
  }
}
`;

export const SCHEMA_BEFORE = `create table users (
  id integer primary key,
  email text not null unique,
  created_at text not null default current_timestamp
);
`;

export const SCHEMA_AFTER = `create table users (
  id integer primary key,
  email text not null unique,
  created_at text not null default current_timestamp,
  deleted_at text
);
`;

export const REPO_BEFORE = `export function listUsers(db: { query: (sql: string) => unknown[] }) {
  return db.query("select * from users");
}
`;

export const REPO_AFTER = `export function listUsers(db: { query: (sql: string) => unknown[] }) {
  return db.query("select * from users where deleted_at is null");
}

export function softDeleteUser(
  db: { run: (sql: string, id: number) => void },
  id: number,
) {
  db.run("update users set deleted_at = current_timestamp where id = ?", id);
}
`;

export const TYPES_AFTER = `export type User = {
  id: number;
  email: string;
  created_at: string;
  deleted_at: string | null;
};
`;
