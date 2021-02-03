const when = require('../steps/when')
const given = require('../steps/given')
const tearDown = require('../steps/tearDown')
const { init } = require('../steps/init')
const AWS = require('aws-sdk')
const messages = require('../messages')
console.log = jest.fn()

const mockPutEvents = jest.fn()
AWS.EventBridge.prototype.putEvents = mockPutEvents

describe('Given an authenticated user', () => {
  let user

  beforeAll(async () => {
    await init()
    user = await given.an_authenticated_user()
  })

  afterAll(async () => {
    await tearDown.an_authenticated_user(user)
  })

  describe(`When we invoke the POST /orders endpoint`, () => {
    let resp

    beforeAll(async () => {
      if (process.env.TEST_MODE === 'handler') {
      mockPutEvents.mockClear()
      mockPutEvents.mockReturnValue({
        promise: async () => {}
      })
      } else {
        messages.startListening()
      }

      resp = await when.we_invoke_place_order(user, 'Fangtasia')
    })

    it(`Should return 200`, async () => {
      expect(resp.statusCode).toEqual(200)
    })

    if (process.env.TEST_MODE === 'handler') {
      it(`Should publish a message to EventBridge`, async () => {
        expect(mockPutEvents).toBeCalledWith({
          Entries: [
            expect.objectContaining({
              Source: 'big-mouth',
              DetailType: 'order_placed',
              Detail: expect.stringContaining(`"restaurantName":"Fangtasia"`),
              EventBusName: expect.stringMatching(process.env.bus_name)
            })
          ]
        })
      })
    } else {
      it(`Should publish a message to EventBridge bus`, async () => {
        const { orderId } = resp.body

        await messages.waitForMessage(
          'eventbridge',
          process.env.EVENT_BUS_NAME,
          JSON.stringify({
            source: 'big-mouth',
            'detail-type': 'order_placed',
            detail: {
              orderId,
              restaurantName: 'Fangtasia'
            }
          })
        )
      }, 10000)
    }
  })
})
