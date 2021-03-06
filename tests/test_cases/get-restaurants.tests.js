const { init } = require('../steps/init')
const when = require('../steps/when')
console.log = jest.fn()
const given = require('../steps/given')

describe(`When we invoke the GET /restaurants endpoint`, () => {
  beforeAll(async () => {
    await init()
    await given.eight_initial_restaurants();
  })

  it(`Should return an array of 8 restaurants`, async () => {
    const res = await when.we_invoke_get_restaurants()

    expect(res.statusCode).toEqual(200)
    expect(res.body.length).toBeGreaterThanOrEqual(8)  // As search-restaurants.tests.js creates restaurants we may get some of them

    for (let restaurant of res.body) {
      expect(restaurant).toHaveProperty('name')
      expect(restaurant).toHaveProperty('image')
    }
  })
})
