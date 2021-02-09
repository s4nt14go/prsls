const CorrelationIds = require('@dazn/lambda-powertools-correlation-ids')
const wrap = require('@dazn/lambda-powertools-pattern-basic')
const Log = require('@dazn/lambda-powertools-logger')
const XRay = require('aws-xray-sdk-core')
const chance = require('chance').Chance()
const DynamoDB = require('aws-sdk/clients/dynamodb');
const DocumentClient = new DynamoDB.DocumentClient();
const eventBridge = XRay.captureAWSClient(require('@dazn/lambda-powertools-eventbridge-client'))

const { bus_name, orders_table } = process.env

module.exports.handler = wrap(async (event, context) => {
  const restaurantName = JSON.parse(event.body).restaurantName

  const orderId = chance.guid()
  const userId = event.requestContext.authorizer.claims.sub
  CorrelationIds.set('userId', userId)
  CorrelationIds.set('orderId', orderId)
  CorrelationIds.set('restaurantName', restaurantName)
  Log.debug('placing order...')

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
