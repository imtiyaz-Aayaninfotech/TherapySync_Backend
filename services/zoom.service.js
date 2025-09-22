const axios = require('axios');
const qs = require('querystring'); // Not required for axios v1+, use URLSearchParams in new Node if preferred

// These values must be stored securely (use env variables)
const CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

async function getZoomOAuthToken() {
  const tokenUrl = 'https://zoom.us/oauth/token';
  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const data = {
    grant_type: 'account_credentials',
    account_id: ACCOUNT_ID
  };
  const response = await axios.post(tokenUrl, qs.stringify(data), {
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data.access_token;
}

async function createZoomMeeting(topic, scheduledAt) {
  const token = await getZoomOAuthToken(); // Fetch fresh token each time
  const body = {
    topic,
    type: 2,
    start_time: new Date(scheduledAt).toISOString(),
    duration: 40,
    timezone: 'Asia/Kolkata', // use your preferred timezone
    settings: {
      host_video: true,
      participant_video: true
    }
  };
  const response = await axios.post(
    'https://api.zoom.us/v2/users/me/meetings',
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

module.exports = { createZoomMeeting };
