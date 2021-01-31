const middy = require('@middy/core')
const ssm = require('@middy/ssm')
const { serviceName, stage } = process.env

module.exports = f => {
  return middy(f)
    .use(middleware1())
    .use(middleware2());
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
