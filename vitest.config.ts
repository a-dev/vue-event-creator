import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const nodeTests = [
  'tests/unit/CalendarBuildActions.spec.ts',
  'tests/unit/useCalendarActions.spec.ts',
  'tests/unit/useEventActions.spec.ts',
];

const browserTests = [
  'tests/unit/Calendar.spec.ts',
  'tests/unit/Day.spec.ts',
  'tests/unit/Event.spec.ts',
  'tests/unit/Events.spec.ts',
  'tests/unit/Localization.spec.ts',
  'tests/unit/Month.spec.ts',
  'tests/unit/Styles.spec.ts',
  'tests/unit/useDocumentClick.spec.ts',
  'tests/unit/VueEventCreator.spec.ts',
];

export default defineConfig({
  plugins: [vue()],
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: nodeTests,
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: browserTests,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
