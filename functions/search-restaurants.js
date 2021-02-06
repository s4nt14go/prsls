const wrap = require('../lib/wrapper')
const { scanTable } = require('../lib/table')

const tableName = process.env.restaurants_table

const findRestaurantsByTheme = async (theme, count) => {
  if (typeof Number(count) !== 'number') throw Error(`Invalid count: ${count}`);
  console.log(`finding (up to ${count}) restaurants with the theme ${theme}...`)
  const req = {
    TableName: tableName,
    Limit: count,
  }
  if (theme.trim() !== '') {  // In the case the user sent a void string, the scan will return all restaurants (working as a reset of previous searches), in other cases searches for a matching theme
    req['FilterExpression'] = "contains(themes, :theme)";
    req['ExpressionAttributeValues'] = { ":theme": theme }
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
