const Log = require('@dazn/lambda-powertools-logger')
const middy = require('@middy/core')
const ssm = require('@middy/ssm')
const { scanTable } = require('../lib/table')

const { serviceName/*, stage*/ } = process.env
const tableName = process.env.restaurants_table

const getRestaurants = async (count) => {
  Log.debug('getting restaurants from DynamoDB...', {
    count,
    tableName
  })
  const req = {
    TableName: tableName,
    Limit: count
  }

  const resp = await scanTable(req);
  Log.debug('found restaurants', {
    count: resp.Items.length
  })
  return resp
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
  },
  throwOnFailedCall: true
}))
