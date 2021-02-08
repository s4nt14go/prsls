const DynamoDB = require('aws-sdk/clients/dynamodb');
const DocumentClient = new DynamoDB.DocumentClient();
const XRay = require('aws-xray-sdk-core')
XRay.captureAWSClient(DocumentClient.service)
const EventBridge = require('aws-sdk/clients/eventbridge')
const eventBridge = new EventBridge()

const { orders_table, bus_name } = process.env;

module.exports.handler = async (event) => {

  const { orderId } = event.pathParameters;

  console.log(`client's completing order ${orderId}`);
  let response = { message: `orderId not received` }
  if (!orderId) return { statusCode: 200, body: JSON.stringify(response) };

  response.message = `Order doesn't exist`;
  const { Item: order } = await DocumentClient.get({
    TableName: orders_table,
    Key: {
      orderId
    }
  }).promise();
  if (!order) return { statusCode: 200, body: JSON.stringify(response) };

  console.log('order', order);

  response.message = `Order doesn't belong to user`;
  if (order.sub !== event.requestContext.authorizer.claims.sub) return { statusCode: 200, body: JSON.stringify(response) };

  const validStatus = 'order_accepted';
  response.message = `Order status should be '${validStatus}' in order to be completed`;
  if (order.status !== validStatus) return { statusCode: 200, body: JSON.stringify(response) };

  const newStatus = 'completed';
  await eventBridge.putEvents({
    Entries: [{
      Source: 'big-mouth',
      DetailType: newStatus,
      Detail: JSON.stringify({ order }),
      EventBusName: bus_name,
    }]
  }).promise()

  const params = {
    TableName: orders_table,
    Key: {
      orderId
    },
    UpdateExpression: "set #name1 = :value1, #name2 = :value2",
    ExpressionAttributeNames: {
      "#name1": "status",
      "#name2": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":value1": newStatus,
      ":value2": new Date().toJSON(),
    }
  };
  await DocumentClient.update(params).promise();
  response.message = `${newStatus} for order ${orderId} received successfully`;
  console.log(response.message);

  return { statusCode: 200, body: JSON.stringify(response) };
}
