const Page = require('./helpers/page');

let page;

// Skip whole file in CI (OAuth + DB integration)
if (process.env.CI) {
  describe.skip('Header integration tests (skipped in CI)', () => {});
  return;
}

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
}, 20000);

afterEach(async () => {
  if (page && typeof page.close === 'function') {
    await page.close();
  }
}, 10000);

test('the header has the correct text', async () => { 
  await page.waitForSelector('a.brand-logo', { timeout: 30000 });
  const text = await page.getContentsOf('a.brand-logo');
  expect(text).toEqual('Blogster'); 
}, 10000);

test('clicking login starts oauth flow', async () => {
  await page.waitForSelector('.right a', { timeout: 30000 });
  await page.click('.right a');
  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/);
}, 10000);

test('when signed in, shows logout button', async () => {
  await page.login();
  const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);
  expect(text).toEqual('Logout');
}, 20000);
