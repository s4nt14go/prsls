const EventBridge = require('aws-sdk/clients/eventbridge')
const eventBridge = new EventBridge()
const chance = require('chance').Chance()
const DynamoDB = require('aws-sdk/clients/dynamodb');
const DocumentClient = new DynamoDB.DocumentClient();

const { bus_name, orders_table } = process.env

module.exports.handler = async (event) => {
  const restaurantName = JSON.parse(event.body).restaurantName

  const orderId = chance.guid()
  console.log(`placing order ID [${orderId}] to [${restaurantName}]`)

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

  console.log(`published 'order_placed' event into EventBridge`)

  let Item = {
    orderId,
    restaurantName,
    sub: event.requestContext.authorizer.claims.sub,
    placedAt: new Date().toJSON(),
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
}
