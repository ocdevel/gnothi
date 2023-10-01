import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import ViteYaml from '@modyfi/vite-plugin-yaml';
import { sentryVitePlugin } from "@sentry/vite-plugin";
import mdx from "@mdx-js/rollup"

// https://vitejs.dev/config/
export default defineConfig({
  // Issue with Amplify specifically. See https://github.com/aws/aws-sdk-js/issues/3673 https://stackoverflow.com/questions/70938763/build-problem-with-react-vitejs-and-was-amplify
  // resolve: { alias: { './runtimeConfig': './runtimeConfig.browser' } },

  // Source map generation must be turned on for Sentry
  build: {
    sourcemap: true,
  },

  // server: { host: "0.0.0.0", port: 5173 },
  plugins: [
    mdx(),
    react({
      include: "**/*.tsx",
    }),
    // vanillaExtractPlugin(), // https://stackoverflow.com/a/72962290
    ViteYaml(), // plugin options at https://github.com/Modyfi/vite-plugin-yaml,

    // Put the Sentry vite plugin after all other plugins
    sentryVitePlugin({
      org: "ocdevel-llc",
      project: "gnothi",

      // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
      // and need `project:releases` and `org:read` scopes
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ]
})
