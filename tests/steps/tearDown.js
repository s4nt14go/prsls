const AWS = require('aws-sdk')
const DocumentClient = new AWS.DynamoDB.DocumentClient()

const an_authenticated_user = async (user) => {
  const cognito = new AWS.CognitoIdentityServiceProvider()

  let req = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: user.username
  }
  await cognito.adminDeleteUser(req).promise()

  console.log(`[${user.username}] - user deleted`)
}

const restaurants_created = async (restaurants) => {
  const deleteReqs = restaurants.map(x => ({
    DeleteRequest: {
      Key: {
        'name': x.name
      }
    }
  }))

  const req = {
    RequestItems: {
      [process.env.restaurants_table]: deleteReqs
    }
  }

  await DocumentClient.batchWrite(req).promise()
  console.log(`${deleteReqs.length} restaurants deleted with themes ${restaurants[0].themes}`);
}

module.exports = {
  an_authenticated_user,
  restaurants_created,
}
