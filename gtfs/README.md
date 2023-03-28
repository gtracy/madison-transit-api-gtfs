# GTFS Notes
A collection of notes to help you manage the GTFS files and various tasks requuired to keep the API datastore up to date as Metro makes updates to its system.

This directory captures a snapshot of the **full** list of GTFS files from Metro. Each time there is an update, we will make a commit to update all files. Only a handful of these files are actually used by the API, however.

The source of truth for the GTFS files, and the location used for the download into this repo is:

[http://transitdata.cityofmadison.com/GTFS/](http://transitdata.cityofmadison.com/GTFS/)

## Core file definitions
**calendar.txt**: describes the dates applied for the service details found in the GTFS files. You'll find "service_id" fields in some GTFS files that map to the dates her in the calendar.

**trips.txt**: describes every route through every stop on every day of the week. This is the core data structure of the Metro system when parsing the real-time transit feed. This file is constantly being updated by Metro and this project has a specific script designed for uploading new files and storing in DynamoDB.

**stops.txt**: describe the details for every bus stop in the system. This includes stop IDs, location and street intersections. The API uses these details for many of the endpoints to provide human readable resuls for requests related to specific stops. This file is routinely being updated by Metro and this project has a specific script designed for uploading new files and storing in DynamoDB.

**routes.txt**: describes the details for every route in the system. Unlike trips, which describes end-to-end bus travel, a route is essentially a label and a destination. It's human readable and the most recognizable description for riders. It's a pretty small set so rather than pushing it into DynamoDB and querying constantly, we have a script that transforms the GTFS file into a JSON object.

## Import scripts
The repo contains scripts that automate the process of importing the GTFS files and deploying them for use by the API. In the case of the trips and stops data, the import pushes the data into DynamoDB. In the case of the route data, it transforms the GTFS text file into a JSON object that is stored within the API code itself.

All of these transformation and ingest jobs have scripts defined in package.json

```
npm run calendar-import
npm run trip-import
npm run stop-import
npm run route-import
```

By default, these scripts write to localhost, which is useful when you are debugging locally and using the Dynamo Docker image. You can run these scripts locally but write to your production DynamoDB tables by specifying the NODE_ENV. 

```
NODE_ENV=prod npm run trip-import
```

## GTFS Update Steps
As currently designed, the import functions will append new records to Dynamo so old and new GTFS records can co-exist without a problem. The routes.json file that gets generated, however, uses route IDs that reflect the new service. So route lookups can and will fail until Metro flips over to the new schedule. **As a result - and this sucks - you really can't deploy the code with a new lib/routes.json file until after the schedule change.**
1. Download GTFS zip file from Metro using the link above.
1. Unzip the GTFS file and move the files into the /gtfs folder of this repo.
1. Run all four npm scripts listed above. Specify the correct NODE_ENV based on your goal - "prod" or "dev"
1. Re-deploy the Lambda function to use the new routes.json
    ```
    > zip -r function.zip *
    > aws lambda update-function-code --function-name <function-name> --zip-file fileb://function.zip
    ```
1. Commit code
1. Push to Github

