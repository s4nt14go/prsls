const EventBridge = require('aws-sdk/clients/eventbridge')
const eventBridge = new EventBridge()
const DynamoDB = require('aws-sdk/clients/dynamodb');
const DocumentClient = new DynamoDB.DocumentClient();
const XRay = require('aws-xray-sdk-core')
XRay.captureAWSClient(DocumentClient.service)

const { bus_name, orders_table } = process.env

module.exports.handler = async (event) => {

  const { orderId } = event.pathParameters;

  console.log(`Deleting order ${orderId}`);
  let response = { message: `orderId not received` }
  if (!orderId) return { statusCode: 200, body: JSON.stringify(response) };

  response.message = `Order doesn't exist`;
  const { Item: order } = await DocumentClient.get({
    TableName: orders_table,
    Key: {
      orderId
    }
  }).promise();
  if (!order) { console.log(response.message); return { statusCode: 200, body: JSON.stringify(response) }; }

  const validStatuses = ['completed', 'order_rejected'];
  response.message = `Order ${orderId} should have statuses '${validStatuses.join('\' or \'')}' before being deleted, current status is '${order.status}'`;
  if (!validStatuses.includes(order.status)) { console.log(response.message); return { statusCode: 200, body: JSON.stringify(response) }; }

  const newStatus = 'deleted';
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
    }
  };
  await DocumentClient.delete(params).promise();
  response.message = `Order ${orderId} deleted successfully`;
  console.log(response.message);

  return { statusCode: 200, body: JSON.stringify(response) };
}
