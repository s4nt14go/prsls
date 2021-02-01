require('dotenv').config()
const { promisify } = require('util')
const awscred = require('awscred')

let initialized = false

const init = async () => {
  if (initialized) {
    return
  }

  const { credentials, region } = await promisify(awscred.load)()
  console.info('credentials', credentials);
  console.info('region', region);

  process.env.AWS_ACCESS_KEY_ID     = credentials.accessKeyId
  process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey
  process.env.AWS_REGION            = region
  console.info('process.env.AWS_REGION', process.env.AWS_REGION);

  if (credentials.sessionToken) {
    process.env.AWS_SESSION_TOKEN = credentials.sessionToken
  }

  console.log('AWS credential loaded')

  initialized = true
}

module.exports = {
  init
}
