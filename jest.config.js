process.env.TZ = 'UTC';

module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  globals: {},
  moduleFileExtensions: ['js', 'ts', 'json', 'vue'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.vue$': 'vue-jest',
    '.+\\.(css|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub'
  }
};
