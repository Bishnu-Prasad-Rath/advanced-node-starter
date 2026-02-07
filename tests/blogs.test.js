const Page = require("./helpers/page");

const isCI = !!process.env.CI;
const maybeDescribe = isCI ? describe.skip : describe;
const maybeTest = isCI ? test.skip : test;

let page;

maybeDescribe("Blog tests", () => {

  beforeEach(async () => {
    page = await Page.build();
    await page.goto("http://localhost:3000");
  });

  afterEach(async () => {
    if (page && typeof page.close === 'function') {
      await page.close();
    }
  });

  maybeDescribe("When logged in", () => {
    beforeEach(async () => {
      await page.login();
      await page.click("a.btn-floating");
    });

    maybeTest("can see blog creation form", async () => {
      const label = await page.getContentsOf("form label");
      expect(label).toEqual("Blog Title");
    });

    maybeDescribe('And using valid inputs', () => {
      beforeEach(async () => {
        await page.type('.title input', 'My Title');
        await page.type('.content input', 'My Content');
        await page.click('form button');
      });

      maybeTest('submitting takes user to review screen', async () => {
        const text = await page.getContentsOf('h5');
        expect(text).toEqual('Please confirm your entries');
      });

      maybeTest('submitting then saving adds blog to index page', async () => {
        await page.click('button.green');
        await page.waitForSelector('.card');
        const title = await page.getContentsOf('.card-title');
        const content = await page.getContentsOf('p');
        expect(title).toEqual('My Title');
        expect(content).toEqual('My Content');
      });
    });

    maybeDescribe("And using invalid inputs", () => {
      beforeEach(async () => {
        await page.click("form button");
      });

      maybeTest('the form shows an error message', async () => {
        const titleError = await page.getContentsOf('.title .red-text');
        const contentError = await page.getContentsOf('.content .red-text');

        expect(titleError).toEqual('You must provide a value');
        expect(contentError).toEqual('You must provide a value');
      });
    });
  });

  maybeDescribe('User is not logged in', () => {
    const actions = [{ 
      method: 'get',
      path : '/api/blogs'
    },
    {
      method:'post',
      path:'/api/blogs',
      data:{ title: 'My Title', content: 'My Content' }
    }];

    maybeTest('Blog related actions are prohibited', async () => {
      const results = await page.execRequests(actions);
      for (let result of results) {
        expect(result).toEqual({ error: 'You must log in!' });
      }
    });
  });

});
