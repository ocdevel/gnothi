import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import ViteYaml from '@modyfi/vite-plugin-yaml';

// https://vitejs.dev/config/
export default defineConfig({

  // Issue with Amplify specifically. See
  // https://github.com/aws/aws-sdk-js/issues/3673
  // https://stackoverflow.com/questions/70938763/build-problem-with-react-vitejs-and-was-amplify
  // resolve: {
  //   alias: {
  //     './runtimeConfig': './runtimeConfig.browser',
  //   },
  // },

  // https://stackoverflow.com/a/72962290
  // plugins: [react(), vanillaExtractPlugin()],
  plugins: [
    react({
      include: "**/*.tsx",
    }),
    ViteYaml() // plugin options at https://github.com/Modyfi/vite-plugin-yaml
  ]
})
