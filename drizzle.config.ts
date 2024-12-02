import type { Config } from 'drizzle-kit'

export default {
  schema: './services/data/schemas/*',
  out: './services/data/migrate/rest',
  dialect: 'postgresql',
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: "lefnire",
    password: "password",
    database: "gnothilegion4",
    // ssl: true, // can be boolean | "require" | "allow" | "prefer" | "verify-full" | options from node:tls
  }
} satisfies Config
