const https = require('https');
const generateZoomJWT = require('../utils/zoomJwt.util');

function createZoomMeeting(topic, scheduledAt) {
  const token = generateZoomJWT();
  const data = JSON.stringify({
    topic: topic,
    type: 2,
    start_time: new Date(scheduledAt).toISOString(),
    duration: 40,
    timezone: 'Europe/Berlin',
    settings: {
      host_video: true,
      participant_video: true,
    },
  });

  const options = {
    hostname: 'api.zoom.us',
    path: '/v2/users/me/meetings',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseBody);
            resolve(parsedData);
          } catch (e) {
            reject(new Error('Failed to parse Zoom meeting response'));
          }
        } else {
          reject(new Error(`Zoom API request failed: ${res.statusCode} - ${responseBody}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

module.exports = { createZoomMeeting };
