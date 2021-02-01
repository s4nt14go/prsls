const wrap = require('../lib/wrapper')
const { scanTable } = require('../lib/table')

const tableName = process.env.restaurants_table

const findRestaurantsByTheme = async (theme, count) => {
  if (typeof Number(count) !== 'number') throw Error(`Invalid count: ${count}`);
  console.log(`finding (up to ${count}) restaurants with the theme ${theme}...`)
  const req = {
    TableName: tableName,
    Limit: count,
    FilterExpression: "contains(themes, :theme)",
    ExpressionAttributeValues: { ":theme": theme }
  }

  const resp = await scanTable(req);
  console.log(`found ${resp.length} restaurants`)
  return resp
}

module.exports.handler = wrap(async (event, context) => {
  console.log('context.secretString', context.secretString);
  if (context.secretString === undefined) throw Error(`secretString not gotten`);
  const req = JSON.parse(event.body)
  const theme = req.theme
  const restaurants = await findRestaurantsByTheme(theme, process.env.defaultResults)
  return {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }
});
