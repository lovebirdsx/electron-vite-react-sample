import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import pkg from './package.json';

function getServerOptions() {
  if (!process.env.VSCODE_DEBUG) {
    return undefined;
  }

  const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
  return {
    host: url.hostname,
    port: +url.port,
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    root: resolve(__dirname, 'src/workbench'),
    build: {
      outDir: resolve(__dirname, 'dist'),
      sourcemap,
      emptyOutDir: true,
    },
    plugins: [
      react(),
      electron([
        {
          entry: resolve(__dirname, 'src/vsplay/electron-main/main.ts'),
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log('[startup] Electron App');
            } else {
              // react-devtools要生效，必须加上下面的参数
              // 参考：https://github.com/electron-vite/electron-vite-react/issues/207#issuecomment-2312073305
              args.startup(['.']);
            }
          },
          vite: {
            build: {
              sourcemap,
              outDir: resolve(__dirname, 'dist/out/vsplay/electron-main'),
              rollupOptions: {
                external: [...Object.keys(pkg.dependencies)],
              },
            },
          },
        },
        {
          entry: resolve(__dirname, 'src/vsplay/electron-main/preload.ts'),
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: resolve(__dirname, 'dist/out/vsplay/electron-main'),
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        {
          entry: resolve(__dirname, 'src/vsplay/node/cli.ts'),
          // 空的onstart函数是为了避免在开发模式下启动electron主进程
          onstart() {
          },
          vite: {
            build: {
              sourcemap,
              outDir: resolve(__dirname, 'dist/out/vsplay/node'),
            },
          },
        }
      ]),
      renderer(),
    ],
    server: getServerOptions(),
    clearScreen: false,
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: resolve(__dirname, './src/setupTests.ts'),
      css: true,
    },
  };
});
