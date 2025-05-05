import { defineConfig } from 'vite'
import { rmSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import renderer from 'vite-plugin-electron-renderer'
import pkg from './package.json'

function getServerOptions() {
  if (!process.env.VSCODE_DEBUG) {
    return undefined
  }

  const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
  return {
    host: url.hostname,
    port: +url.port,
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    plugins: [
      react(),
      electron({
        main: {
          entry: 'electron/main.ts',
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
            } else {
              args.startup()
            }
          },
          vite: {
            build: {
              sourcemap,
              outDir: 'dist-electron',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            }
          },
        },
        preload: {
          input: 'electron/preload.ts',
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: 'dist-electron',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        renderer: {},
      }),
      renderer()
    ],
    server: getServerOptions(),
    clearScreen: false,
  }
});
