import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  // plugins: [react(), vanillaExtractPlugin()],

  // Issue with Amplify specifically. See
  // https://github.com/aws/aws-sdk-js/issues/3673
  // https://stackoverflow.com/questions/70938763/build-problem-with-react-vitejs-and-was-amplify
  resolve: {
    alias: {
      './runtimeConfig': './runtimeConfig.browser',
    },
  }
})
