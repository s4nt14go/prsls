const wrap = require('@dazn/lambda-powertools-pattern-basic')
const Log = require('@dazn/lambda-powertools-logger')
const ssm = require('@middy/ssm')
const { scanTable } = require('../lib/table')

const { serviceName, stage } = process.env
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
    count: resp.length
  })
  return resp
}

module.exports.handler = wrap(async (event, context) => {
  const restaurants = await getRestaurants(process.env.defaultResults)
  return {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }
}).use(ssm({
  cache: true,
  cacheExpiryInMillis: 5 * 60 * 1000, // 5 mins
  names: {
    config: `/${serviceName}/${stage}/get-restaurants/config`
  },
  onChange: () => {
    const config = JSON.parse(process.env.config)
    process.env.defaultResults = config.defaultResults
  },
  throwOnFailedCall: true
}))
