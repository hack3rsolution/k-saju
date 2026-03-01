import { cleanup, init } from 'detox';
import adapter from 'detox/runners/jest/adapter';

// Extend Jest's default timeout for E2E tests
jest.setTimeout(120000);

beforeAll(async () => {
  await init();
}, 300000);

beforeEach(async () => {
  await adapter.beforeEach();
});

afterEach(async () => {
  await adapter.afterEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await cleanup();
}, 300000);
