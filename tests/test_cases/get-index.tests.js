const cheerio = require('cheerio')
const when = require('../steps/when')
const { init } = require('../steps/init')
const given = require('../steps/given')

describe(`When we invoke the GET / endpoint`, () => {
  beforeAll(async () => {
    await init();
    await given.eight_initial_restaurants();
  })

  it(`Should return the index page with 8 restaurants`, async () => {
    const res = await when.we_invoke_get_index()

    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('text/html; charset=UTF-8')
    expect(res.body).toBeDefined()

    const $ = cheerio.load(res.body)
    const restaurants = $('.restaurant', '#restaurantsUl')
    expect(restaurants.length).toBeGreaterThanOrEqual(8)  // As search-restaurants.tests.js creates restaurants we may get some of them
  })
})
