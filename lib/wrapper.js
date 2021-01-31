const middy = require('@middy/core')
const ssm = require('@middy/ssm')
const validator = require('@middy/validator')
const { serviceName, stage } = process.env

module.exports = f => {
  return middy(f)
    .use(validateInput())
    .use(middleware1())
    .use(middleware2())
    .use(validateOutput());
}

const inputSchema = {
  required: ['body'/*, 'foo'*/],
  properties: {
    // this will pass validation
    body: {
      type: 'string'
    },
    /*// this won't as it won't be in the event
    foo: {
      type: 'string'
    }*/
  }
}

function validateInput(){
  return validator({
    inputSchema
  });
}

const outputSchema = {
  required: ['body', 'statusCode'],
  properties: {
    body: {
      type: 'string'
    },
    statusCode: {
      type: 'number'
    }
  }
}

function validateOutput(){
  return validator({
    outputSchema
  });
}

function middleware1(){
  return ssm({
    cache: true,
    cacheExpiryInMillis: 5 * 60 * 1000, // 5 mins
    names: {
      config: `/${serviceName}/${stage}/search-restaurants/config`
    },
    onChange: () => {
      const config = JSON.parse(process.env.config)
      process.env.defaultResults = config.defaultResults
    }
  })
}

function middleware2() {
  return ssm({
    cache: true,
    cacheExpiryInMillis: 5 * 60 * 1000, // 5 mins
    names: {
      secretString: `/${serviceName}/${stage}/search-restaurants/secretString`
    },
    setToContext: true
  })
}
