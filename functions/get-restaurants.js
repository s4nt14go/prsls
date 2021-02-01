const middy = require('@middy/core')
const ssm = require('@middy/ssm')
const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient
const dynamodb = new DocumentClient()

const { serviceName/*, stage*/ } = process.env
const tableName = process.env.restaurants_table

const getRestaurants = async (count) => {
  console.log(`fetching ${count} restaurants from ${tableName}...`)
  const req = {
    TableName: tableName,
    Limit: count
  }

  const resp = await dynamodb.scan(req).promise()
  console.log(`found ${resp.Items.length} restaurants`)
  return resp.Items
}

module.exports.handler = middy(async (event, context) => {
  if (process.env.defaultResults === undefined) throw Error(`defaultResults wasn't picked up from SSM`);
  const restaurants = await getRestaurants(process.env.defaultResults)
  return {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }
}).use(ssm({
  cache: true,
  cacheExpiryInMillis: 5 * 60 * 1000, // 5 mins
  names: {
    // config: `/${serviceName}/${stage}/get-restaurants/config`
    // Use parameters from "dev" stage for all environments
    config: `/${serviceName}/dev/get-restaurants/config`
  },
  onChange: () => {
    const config = JSON.parse(process.env.config)
    process.env.defaultResults = config.defaultResults
  }
}))
