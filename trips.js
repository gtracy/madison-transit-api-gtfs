const _ = require('underscore');

function Trips() {

    // setup datastore connection
    const db = undefined;

    // fetch by tripId
    this.fetchDescriptionById = async function(trip_id) {
        if( !db ) {
            return "mocked trip description";
        } else {
            return 'houston, we hava  problem';
        }
    }


}
module.exports = Trips;
