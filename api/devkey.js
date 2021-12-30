'use strict';


module.exports.validateDevKey = async function(req,res,next) {

        const dev_key = req.query.devKey;

        console.log('validating devkey: ' + dev_key);
        if( !dev_key ) {
            console.dir('missing devkey in the request');
            next("Missing devKey in request");
        } else {
            console.dir('dev key valid!');
            next();
        }

}

