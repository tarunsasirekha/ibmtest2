const fs = require('fs/promises')
const {Builder, By} = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const compareImages = require('resemblejs/compareImages')
const {until} = require('selenium-webdriver');


const HOST = 'http://localhost:4567'

describe('Product card', function () {
  let driver
  beforeAll(async () => {
    const screen = {width: 640, height: 680}
    const options = new chrome.Options();
    if (options.headless) {
      options.addArguments("--headless");
    }
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options.windowSize(screen)).build();
    await driver.get(HOST);
  });

  afterAll(async () => {
    await driver.quit();
  });

  const positionsMap = {
    'product-card-image': {x: 25, y: 25},
    'product-card-title': {y: 221},
    'product-card-price': {y: 263},
    'product-card-button': {x: 105, y: 305}
  }

  it.each([
    'product-card-image', 'product-card-title', 'product-card-price'
  ])('should position %s correctly', async (className) => {
    const card = await driver.wait(until.elementIsVisible(driver.findElement(By.className('product-card'))));
    const cardRect = await card.getRect()

    const actual = await driver.wait(until.elementIsVisible(driver.findElement(By.className(className))));
    const actualRect = await actual.getRect()
    const paddingLeftPx = await actual.getCssValue('padding-left')
    const paddingTopPx = await actual.getCssValue('padding-top')
    const paddingLeft = parseInt(paddingLeftPx)
    const paddingTop = parseInt(paddingTopPx)

    const epsilon = 1

    if (positionsMap[className].x) {
      const expectedX = cardRect.x + positionsMap[className].x - paddingLeft
      expect(Math.round(actualRect.x)).toBeWithin(expectedX - epsilon, expectedX + epsilon)
    }
    const expectedY = cardRect.y + positionsMap[className].y - paddingTop
    expect(Math.round(actualRect.y)).toBeWithin(expectedY - epsilon, expectedY + epsilon)
  })

  it('should position product-card-button correctly', async () => {
    const card = await driver.wait(until.elementIsVisible(driver.findElement(By.className('product-card'))));
    const cardRect = await card.getRect()

    const actual = await driver.wait(until.elementIsVisible(driver.findElement(By.className('product-card-button'))));
    const actualRect = await actual.getRect()

    const epsilon = 1

    const expectedX = cardRect.x + positionsMap['product-card-button'].x
    const expectedY = cardRect.y + positionsMap['product-card-button'].y
    expect(Math.round(actualRect.x)).toBeWithin(expectedX - epsilon, expectedX + epsilon)
    expect(Math.round(actualRect.y)).toBeWithin(expectedY - epsilon, expectedY + epsilon)
  })

  it('should position all elements as it is mentioned on the template', async () => {
    const actualCard = await driver.wait(until.elementIsVisible(driver.findElement(By.className('product-card'))));
    const actualCardImage = await actualCard.takeScreenshot()

    const actualCardImageBase64 = 'data:image/png;base64,' + actualCardImage
    const templateImageBase64 = await fs.readFile('./template.png')

    const {misMatchPercentage, getBuffer} = await compareImages(actualCardImageBase64, templateImageBase64)
    await fs.writeFile('diff.png', getBuffer(), 'base64')

    const epsilon = 1
    expect(parseFloat(misMatchPercentage)).toBeLessThan(epsilon)
  })
})