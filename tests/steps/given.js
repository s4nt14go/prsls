const AWS = require('aws-sdk')
const chance  = require('chance').Chance()
const DocumentClient = new AWS.DynamoDB.DocumentClient()
const dynamodb = new AWS.DynamoDB.DocumentClient()

let initialRestaurants = [
  {
    name: "Fangtasia",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/fangtasia.png",
    themes: ["true blood"]
  },
  {
    name: "Shoney's",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/shoney's.png",
    themes: ["cartoon", "rick and morty"]
  },
  {
    name: "Freddy's BBQ Joint",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/freddy's+bbq+joint.png",
    themes: ["netflix", "house of cards"]
  },
  {
    name: "Pizza Planet",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/pizza+planet.png",
    themes: ["netflix", "toy story"]
  },
  {
    name: "Leaky Cauldron",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/leaky+cauldron.png",
    themes: ["movie", "harry potter"]
  },
  {
    name: "Lil' Bits",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/lil+bits.png",
    themes: ["cartoon", "rick and morty"]
  },
  {
    name: "Fancy Eats",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/fancy+eats.png",
    themes: ["cartoon", "rick and morty"]
  },
  {
    name: "Don Cuco",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/don%20cuco.png",
    themes: ["cartoon", "rick and morty"]
  },
];
// needs number, special char, upper and lower case
const random_password = () => `${chance.string({ length: 8})}B!gM0uth`

const an_authenticated_user = async () => {
  const cognito = new AWS.CognitoIdentityServiceProvider()

  const userpoolId = process.env.COGNITO_USER_POOL_ID
  const clientId = process.env.COGNITO_USER_POOL_SERVER_CLIENT_ID

  const firstName = chance.first({ nationality: "en" })
  const lastName  = chance.last({ nationality: "en" })
  const suffix    = chance.string({length: 8, pool: "abcdefghijklmnopqrstuvwxyz"})
  const username  = `test-${firstName}-${lastName}-${suffix}`
  const password  = random_password()
  const email     = `${firstName}-${lastName}@big-mouth.com`

  const createReq = {
    UserPoolId        : userpoolId,
    Username          : username,
    MessageAction     : 'SUPPRESS',
    TemporaryPassword : password,
    UserAttributes    : [
      { Name: "given_name",  Value: firstName },
      { Name: "family_name", Value: lastName },
      { Name: "email",       Value: email }
    ]
  }
  await cognito.adminCreateUser(createReq).promise()

  console.log(`[${username}] - user is created`)

  const req = {
    AuthFlow        : 'ADMIN_NO_SRP_AUTH',
    UserPoolId      : userpoolId,
    ClientId        : clientId,
    AuthParameters  : {
      USERNAME: username,
      PASSWORD: password
    }
  }
  const resp = await cognito.adminInitiateAuth(req).promise()

  console.log(`[${username}] - initialised auth flow`)

  const challengeReq = {
    UserPoolId          : userpoolId,
    ClientId            : clientId,
    ChallengeName       : resp.ChallengeName,
    Session             : resp.Session,
    ChallengeResponses  : {
      USERNAME: username,
      NEW_PASSWORD: random_password()
    }
  }
  const challengeResp = await cognito.adminRespondToAuthChallenge(challengeReq).promise()

  console.log(`[${username}] - responded to auth challenge`)

  return {
    username,
    firstName,
    lastName,
    idToken: challengeResp.AuthenticationResult.IdToken
  }
}

const restaurants_with_a_theme = async (theme, quantity) => {

  const images = ["https://d2qt42rcwzspd6.cloudfront.net/manning/fangtasia.png", "https://d2qt42rcwzspd6.cloudfront.net/manning/shoney's.png", "https://d2qt42rcwzspd6.cloudfront.net/manning/freddy's+bbq+joint.png", "https://d2qt42rcwzspd6.cloudfront.net/manning/pizza+planet.png", "https://d2qt42rcwzspd6.cloudfront.net/manning/leaky+cauldron.png", "https://d2qt42rcwzspd6.cloudfront.net/manning/lil+bits.png", "https://d2qt42rcwzspd6.cloudfront.net/manning/fancy+eats.png", "https://d2qt42rcwzspd6.cloudfront.net/manning/don%20cuco.png"]

  let restaurants = [];
  for (let i = 0; i < quantity; i++) {
    restaurants.push({
      name: chance.company(),
      image: images[Math.floor(Math.random()*images.length)],
      themes: [theme]
    })
  }

  const putReqs = restaurants.map(x => ({
    PutRequest: {
      Item: x
    }
  }))

  const req = {
    RequestItems: {
      [process.env.restaurants_table]: putReqs
    }
  }

  await DocumentClient.batchWrite(req).promise()
  console.info(`${quantity} restaurants put in table with theme ${theme}`)
  return restaurants;
}

const eight_initial_restaurants = async () => {
  const putReqs = initialRestaurants.map(x => ({
    PutRequest: {
      Item: x
    }
  }))

  const req = {
    RequestItems: {
      [process.env.restaurants_table]: putReqs
    }
  }
  await dynamodb.batchWrite(req).promise()
}

module.exports = {
  an_authenticated_user,
  restaurants_with_a_theme,
  eight_initial_restaurants,
}
