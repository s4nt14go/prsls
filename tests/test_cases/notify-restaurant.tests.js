const { init } = require('../steps/init')
const when = require('../steps/when')
const AWS = require('aws-sdk')
const chance = require('chance').Chance()
const messages = require('../messages')

const mockPutEvents = jest.fn()
const mockPublish = jest.fn()

describe(`When we invoke the notify-restaurant function`, () => {
  const event = {
    source: 'big-mouth',
    'detail-type': 'order_placed',
    detail: {
      orderId: chance.guid(),
      restaurantName: 'Fangtasia'
    }
  }

  beforeAll(async () => {
    await init()

    if (process.env.TEST_MODE === 'handler') {
      AWS.EventBridge.prototype.putEvents = mockPutEvents
      AWS.SNS.prototype.publish = mockPublish

      mockPutEvents.mockReturnValue({
        promise: async () => {}
      })
      mockPublish.mockReturnValue({
        promise: async () => {}
      })
    } else {
      messages.startListening()
    }

    await when.we_invoke_notify_restaurant(event)
  })

  afterAll(() => {
    if (process.env.TEST_MODE === 'handler') {
      mockPutEvents.mockClear()
      mockPublish.mockClear()
    }
  })

  if (process.env.TEST_MODE === 'handler') {
    it(`Should publish message to SNS`, async () => {
      expect(mockPublish).toBeCalledWith({
        Message: expect.stringMatching(`"restaurantName":"Fangtasia"`),
        TopicArn: expect.stringMatching(process.env.restaurant_notification_topic)
      })
    })

    it(`Should publish event to EventBridge`, async () => {
      expect(mockPutEvents).toBeCalledWith({
        Entries: [
          expect.objectContaining({
            Source: 'big-mouth',
            DetailType: 'restaurant_notified',
            Detail: expect.stringContaining(`"restaurantName":"Fangtasia"`),
            EventBusName: expect.stringMatching(process.env.bus_name)
          })
        ]
      })
    })
  } else {
    it(`Should publish message to SNS`, async () => {
      await messages.waitForMessage(
        'sns',
        process.env.RESTAURANT_NOTIFICATION_TOPIC_ARN,
        JSON.stringify(event.detail)
      )
    }, 10000)

    it(`Should publish "restaurant_notified" event to EventBridge`, async () => {
      await messages.waitForMessage(
        'eventbridge',
        process.env.EVENT_BUS_NAME,
        JSON.stringify({
          ...event,
          'detail-type': 'restaurant_notified'
        })
      )
    }, 10000)
  }
})
