import { describe, it, expect } from '@jest/globals'
import { BrowserHandler } from './browser-handler'

describe('BrowserHandler', () => {
  it('killBrowser', async () => {
    const browserHandler = new BrowserHandler(true)
    const browserHandler2 = new BrowserHandler(false)
    const browser = await browserHandler.getBrowser()
    const page = await browser.newPage()
    await page.goto('https://www.google.it')
    const browser2 = await browserHandler2.getBrowser()
    const page2 = await browser2.newPage()
    await page2.goto('https://www.google.it')
    await browserHandler.killBrowser()
    await browserHandler2.killBrowser()

    expect(browser).not.toEqual(browser2)
  }, 10000)
})
