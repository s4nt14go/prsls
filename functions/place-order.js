const wrap = require('@dazn/lambda-powertools-pattern-basic')
const Log = require('@dazn/lambda-powertools-logger')
const EventBridge = require('aws-sdk/clients/eventbridge')
const eventBridge = new EventBridge()
const chance = require('chance').Chance()
const DynamoDB = require('aws-sdk/clients/dynamodb');
const DocumentClient = new DynamoDB.DocumentClient();

const { bus_name, orders_table } = process.env

module.exports.handler = wrap(async (event, context) => {
  const restaurantName = JSON.parse(event.body).restaurantName

  const orderId = chance.guid()
  Log.debug('placing order...', { orderId, restaurantName })

  await eventBridge.putEvents({
    Entries: [{
      Source: 'big-mouth',
      DetailType: 'order_placed',
      Detail: JSON.stringify({
        orderId,
        restaurantName,
      }),
      EventBusName: bus_name
    }]
  }).promise()

  Log.debug(`published event into EventBridge`, {
    eventType: 'order_placed',
    bus_name
  })

  let Item = {
    orderId,
    restaurantName,
    sub: event.requestContext.authorizer.claims.sub,
    updatedAt: new Date().toJSON(),
    status: 'order_placed'
  };
  await DocumentClient.put({
    TableName: orders_table,
    Item,
  }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ orderId })
  }
})
