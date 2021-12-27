const express = require('express');
const app = express();

// API endpoint registration
require('./api/schedule')(app);

const port = 3300;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})