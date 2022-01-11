# Madison Transit API
Node implementation for a Madison Transit API

This implementation is a replacement to the [legacy web scraping solution](https://github.com/gtracy/madison-transit-api/), and is built on top of the GTFS data feeds from Madison Metro. It's still a bit hacky, however. One of the goals of the projects was to drop in a new, robust solution without changing the API definition. I wanted the implementation to go live without requiring any changes by the various apps. 

The app is currently deployed on AWS.

https://api.smsmybus.com

This application provides access to a free, easy to use, JSON-based web service interface for Madison Metro service. Once you've received a developer token, you have access to the following services:

* Real-time arrival estimates for every route at every stop in the city.
* A list of all stops in a specified route
* The geo-location of any stop in the city
* Search for stops near a specified geo-location
* A list of all routes in the system

## Running your own instance
Whether you are running locally or inside AWS, there are a handful of steps required to setup your environment.

#### Setup Node environment

```
npm install
```

#### Load DynamoDB data

These must be loaded on a fresh install as well as every time Madison Metro changes their system and publishes new GTFS files. The goal is to keep the /gtfs directory in sync with Metro. 

Scripts are designed to work out of the box with their defaults.  

**Load Trip GTFS data**
```
npm run trip-import
```

**Load Stop GTFS data**
```
npm run stop-import
```

**Load Route GTFS data**
```
npm run route-import
```

**Setup minimal dev key table**
```
npm run devkey-import
```

#### Run server

```
node app-local.js
```

By default, the server runs in dev mode and presumes a local instance of Dynamo which you [can run in Docker](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html). 

If you'd like to point to an AWS instance of Dynamo, you can set NODE_ENV=prod when you start the server, or you can modify the AWS configuration directly in config.js

### Deployment
API server is designed to be deployed on Lambda. Use the aws cli to deploy your zip file. 
```
> zip -r ../function.zip *
> aws lambda update-function-code --function-name <function-name> --zip-file fileb://../function.zip
```

#### Configuration
The server supports a few different command-line parameters.

* `NODE_ENV` can be be `dev` or `prod` or omitted. Check config.js for value behavior. 
* `AWS_ACCESS_ID` and `AWS_ACCESS_SECRET` are optional unless your NODE_ENV is prod.
* `DEV_KEYS` is optional and can be a list of developer keys. It's a simple way to avoid Dynamo lookups for common dev keys. i.e. `DEV_KEYS=test,kiosk,george`
* `LOG_LEVEL` can be any level from (pino logging)[https://getpino.io/#/] such as `debug`, `info` or `error`. It's not required. We default to info in prod and debug in dev.

