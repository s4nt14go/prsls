const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient
const dynamodb = new DocumentClient()

const scanTable = async (params) => {
  let scanResults = [];
  let items;
  do{
    items =  await dynamodb.scan(params).promise();
    items.Items.forEach((item) => scanResults.push(item));
    params.ExclusiveStartKey  = items.LastEvaluatedKey;
  }while(typeof items.LastEvaluatedKey != 'undefined');
  return scanResults;
};

module.exports = {
  scanTable,
}
