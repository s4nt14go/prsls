const DynamoDB = require('aws-sdk/clients/dynamodb');
const DocumentClient = new DynamoDB.DocumentClient();

module.exports.handler = async (event) => {

  const { Items } = await DocumentClient.query({
    TableName: process.env.orders_table,
    IndexName: 'bySub',
    KeyConditionExpression: "#name1 = :value1",
    ExpressionAttributeValues: {
      ":value1": event.requestContext.authorizer.claims.sub
    },
    ExpressionAttributeNames: {
      "#name1": "sub"
    }
  }).promise();

  console.log('Items', Items);
  return { statusCode: 200, body: JSON.stringify(Items) };
}
