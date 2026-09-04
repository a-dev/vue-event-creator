import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

// Chromium is the per-pull-request gate. Firefox and WebKit run in scheduled and
// release CI, where `E2E_ALL_BROWSERS` is set, until they are stable enough to
// promote into the pull-request gate.
const crossBrowser = Boolean(process.env.E2E_ALL_BROWSERS);

const demoBaseURL = 'http://127.0.0.1:4173';
const packedBaseURL = 'http://127.0.0.1:4174';

const extraBrowsers = [
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command:
        'bun run build:demo && bunx vite preview demo --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'node scripts/serve-packed-consumer.mjs',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'demo-chromium',
      testMatch: '**/*.demo.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: demoBaseURL,
      },
    },
    {
      name: 'packed-chromium',
      testMatch: '**/*.packed.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: packedBaseURL,
      },
    },
    ...(crossBrowser
      ? extraBrowsers.flatMap(({ name, device }) => [
          {
            name: `demo-${name}`,
            testMatch: '**/*.demo.spec.ts',
            use: { ...device, baseURL: demoBaseURL },
          },
          {
            name: `packed-${name}`,
            testMatch: '**/*.packed.spec.ts',
            use: { ...device, baseURL: packedBaseURL },
          },
        ])
      : []),
  ],
});
