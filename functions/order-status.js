const DynamoDB = require('aws-sdk/clients/dynamodb');
const DocumentClient = new DynamoDB.DocumentClient();
const XRay = require('aws-xray-sdk-core')
XRay.captureAWSClient(DocumentClient.service)

module.exports.handler = async (event) => {

  const { Item } = await DocumentClient.get({
    TableName: process.env.orders_table,
    Key: {
      orderId: event.orderId
    }
  }).promise();

  console.log('Item', Item);

  return { ...event, status: Item.status };

}
