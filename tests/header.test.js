const Page = require('./helpers/page');

const isCI = !!process.env.CI;
const maybeDescribe = isCI ? describe.skip : describe;
const maybeTest = isCI ? test.skip : test;

let page;

maybeDescribe('Header tests', () => {

  beforeEach(async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000');
  }, 20000);

  afterEach(async () => {
    if (page && typeof page.close === 'function') {
      await page.close();
    }
  }, 10000);

  maybeTest('the header has the correct text', async () => { 
    await page.waitForSelector('a.brand-logo', { timeout: 30000 });
    const text = await page.getContentsOf('a.brand-logo');
    expect(text).toEqual('Blogster'); 
  }, 10000);

  maybeTest('clicking login starts oauth flow', async () => {
    await page.waitForSelector('.right a', { timeout: 30000 });
    await page.click('.right a');
    const url = await page.url();
    expect(url).toMatch(/accounts\.google\.com/);
  }, 10000);

  maybeTest('when signed in, shows logout button', async () => {
    await page.login();
    const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);
    expect(text).toEqual('Logout');
  }, 20000);

});
