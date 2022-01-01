'use strict';

module.exports = function(app) {

    app.get('/v1/getparking',  (req,res) => {
        res.json({
            status : 0,
            description : "this endpoint has been deprecated"
        });
    });

}
