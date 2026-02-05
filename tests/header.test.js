
const Page = require('./helpers/page');

let page;
let browser;

// FIX 1: Increase timeout for beforeEach
beforeEach(async () => {
  const customPage = await Page.build();
  page = customPage;
  browser = customPage.browser; // Store browser reference
  await page.goto('http://localhost:3000');
}, 15000); // Increase timeout to 15 seconds

// FIX 2: Proper cleanup
afterEach(async () => {
  if (page && typeof page.close === 'function') {
    await page.close();
  }
}, 10000);

// Alternative: If you want to keep using page.close() directly from the proxy
// You can also update your test to use the custom close method

test('the header has the correct test', async () => { 
  const text = await page.getContentsOf('a.brand-logo');
  expect(text).toEqual('Blogster'); 
}, 10000); // 10 second timeout for this test

test('clicking login starts oauth flow', async () => {
  await page.click('.right a');
  const url = await page.url();
  console.log(url);
  expect(url).toMatch(/accounts\.google\.com/);
}, 10000); // 10 second timeout for this test

test('when signed in, shows logout button', async () => {
  await page.login(); // Use the custom login method
 
  const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);
  
  expect(text).toEqual('Logout');
}, 20000); // Increase timeout to 20 seconds for this test 