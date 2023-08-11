process.env.TZ = 'UTC';

module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  globals: {},
  moduleFileExtensions: ['js', 'ts', 'json', 'vue'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.ts$': 'ts-jest',
    '.+\\.(css|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub'
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};
