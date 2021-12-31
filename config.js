let AWS = require('aws-sdk');

module.exports = {

    getPort : function getPort() {
        return 3300
    },

    getEnv : function getEnv() {
        if( process.env.NODE_ENV === 'prod' ) {
            return process.env.NODE_ENV;
        } else {
            return 'dev';
        }
    },

    getAWSConfig : function getAWSConfig() {
        if( process.env.NODE_ENV === 'prod' ) {
            return {
                region : 'us-east-2',
                access_id : process.env.AWS_ACCESS_ID,
                access_secret : process.env.AWS_ACCESS_SECRET
            }
        } else {
            return {
                region : 'local',
                endpoint : 'http://localhost:8000'
            }
        }
    }
}