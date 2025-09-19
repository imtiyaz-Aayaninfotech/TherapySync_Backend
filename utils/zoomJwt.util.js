const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateZoomJWT() {
  const payload = {
    iss: process.env.ZOOM_API_KEY,
    exp: Math.floor(Date.now() / 1000) + 60 * 5 // valid for 5 min
  };
  return jwt.sign(payload, process.env.ZOOM_API_SECRET);
}
module.exports = generateZoomJWT;
