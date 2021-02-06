const EventBridge = require('aws-sdk/clients/eventbridge')
const eventBridge = new EventBridge()
const DynamoDB = require('aws-sdk/clients/dynamodb');
const DocumentClient = new DynamoDB.DocumentClient();

const { bus_name, orders_table } = process.env

module.exports.handler = async (event) => {

  let parsed, response = { message: `Malformed input: ${event.body}` }
  try {
    parsed = JSON.parse(event.body)
  } catch (e) {
    console.log(e);
    console.log(response.message);
    return { statusCode: 200, body: JSON.stringify(response) };
  }

  const { orderId, acceptance } = parsed;
  console.log(`restaurant's acceptance for ${orderId} received: ${acceptance}`);

  response.message = `orderId not received`;
  if (!orderId) { console.log(response.message); return { statusCode: 200, body: JSON.stringify(response) }; }

  response.message = `Order doesn't exist`;
  const order = (await DocumentClient.get({
    TableName: orders_table,
    Key: {
      orderId
    }
  }).promise()).Item;
  if (!order) { console.log(response.message); return { statusCode: 200, body: JSON.stringify(response) }; }

  response.message = `Invalid acceptance: ${acceptance}`;
  if (!['order_accepted', 'order_rejected'].includes(acceptance)) { console.log(response.message); return { statusCode: 200, body: JSON.stringify(response) }; }

  const validStatus = 'order_placed';
  response.message = `Order ${orderId} should have status '${validStatus}' before sending acceptance, current state is '${order.status}'`;
  if (order.status !== validStatus) { console.log(response.message); return { statusCode: 200, body: JSON.stringify(response) }; }

  await eventBridge.putEvents({
    Entries: [{
      Source: 'big-mouth',
      DetailType: 'acceptance',
      Detail: JSON.stringify({ order, response: acceptance }),
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
      ":value1": acceptance,
      ":value2": new Date().toJSON(),
    }
  };
  await DocumentClient.update(params).promise();
  response.message = `${acceptance} for order ${order.orderId} received successfully`;
  console.log(response.message);

  return { statusCode: 200, body: JSON.stringify(response) };
}
