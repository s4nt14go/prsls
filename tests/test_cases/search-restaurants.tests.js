const chance  = require('chance').Chance()
const { init } = require('../steps/init')
const when = require('../steps/when')
const tearDown = require('../steps/tearDown')
const given = require('../steps/given')
console.log = jest.fn()

describe('Given an authenticated user', () => {
  let user, restaurantsCreated, quantity, theme;

  beforeAll(async () => {
    await init()
    await given.eight_initial_restaurants();

    user = await given.an_authenticated_user()

    quantity = chance.integer({ min: 1, max: 5 });
    theme = chance.animal();
    console.log('Random theme', theme);
    restaurantsCreated = await given.restaurants_with_a_theme(theme, quantity)
  })

  afterAll(async () => {
    await tearDown.an_authenticated_user(user)
    await tearDown.restaurants_created(restaurantsCreated)
  })

  describe(`When we invoke the POST /restaurants/search endpoint with theme 'cartoon'`, () => {
    it(`Should return an array of 4 restaurants`, async () => {
      const res = await when.we_invoke_search_restaurants('cartoon', user)

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveLength(4)

      for (const restaurant of res.body) {
        expect(restaurant).toHaveProperty('name')
        expect(restaurant).toHaveProperty('image')
      }
    })
  })

  describe(`When we invoke the POST /restaurants/search endpoint with a random theme and quantity`, () => {
    it(`Should return the quantity of restaurants with the random theme created`, async () => {

      const res = await when.we_invoke_search_restaurants(theme, user)

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveLength(quantity)

      for (const restaurant of res.body) {
        expect(restaurant).toHaveProperty('name')
        expect(restaurant).toHaveProperty('image')
      }

    })
  })
})
