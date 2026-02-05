const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    const customPage = new CustomPage(page, browser);

    return new Proxy(customPage, {
      get: function (target, property) { 
        // Return customPage methods first
        if (target[property]) {
          return target[property];
        }
        
        // Return page methods
        if (page[property]) {
          // Bind methods to maintain proper 'this' context
          if (typeof page[property] === 'function') {
            return page[property].bind(page);
          }
          return page[property];
        }

        // Return browser methods
        if (browser[property]) {
          // Bind methods to maintain proper 'this' context
          if (typeof browser[property] === 'function') {
            return browser[property].bind(browser);
          }
          return browser[property];
        }

        return undefined;
      },
    });
  }

  constructor(page, browser) {
    this.page = page;
    this.browser = browser; // Store browser reference
  }

 async login(){
     const user = await userFactory();
  const { session, sig } = sessionFactory(user);
  
  await this.page.setCookie({ name: 'session', value: session });
  await this.page.setCookie({ name: 'session.sig', value: sig });
  await this.page.goto('http://localhost:3000/blogs');
  await this.page.waitForSelector('a[href="/auth/logout"]');
 }

 async getContentsOf(selector){
  return this.page.$eval(selector, el => el.innerHTML);
 }

  // Custom method to properly close everything
  async close() {
    await this.page.close();
    await this.browser.close();
  }

  // Helper method to properly handle goto
  async goto(url, options) {
    return await this.page.goto(url, options);
  }

  // Helper method for eval
  async $eval(selector, pageFunction, ...args) {
    return await this.page.$eval(selector, pageFunction, ...args);
  }

  // Helper method for click
  async click(selector, options) {
    return await this.page.click(selector, options);
  }

  // Helper method for waitForSelector
  async waitForSelector(selector, options) {
    return await this.page.waitForSelector(selector, options);
  }

  // Helper method for setCookie
  async setCookie(...cookies) {
    return await this.page.setCookie(...cookies);
  }

  // Helper method to get URL
  async url() {
    return this.page.url();
  }

 get(path){
    return this.page.evaluate(
      (_path)=>{
        return fetch(_path,{
          method:'GET',
          credentials:'same-origin',
          headers:{
            'Content-Type':'application/json'
          }
        }).then(res=>res.json())
      }
      ,path)
 }

 post(path,data){
   return this.page.evaluate(
      (_path, _data) => {
        return fetch(_path, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(_data)
        }).then(res => res.json()); 
      },path,data);
 }
execRequests(actions) {
  return Promise.all(
    actions.map(async ({ method, path, data }) => {
      // Get the method from page object if not found on this
      const func = this[method] || this.page[method];
      if (typeof func !== 'function') {
        throw new Error(`Method ${method} not found`);
      }
      return await func.call(this, path, data);
    })
  );
}

}

module.exports = CustomPage;