require('dotenv').config();
const axios = require('axios');

// Make sure your .env has HUBSPOT_PRIVATE_APP_TOKEN
const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

if (!HUBSPOT_TOKEN) {
  console.error('Please set HUBSPOT_PRIVATE_APP_TOKEN in your .env');
  process.exit(1);
}

const hubspot = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

(async () => {
  try {
    const res = await hubspot.get('/crm/v3/schemas');
    console.log('--- All Custom Objects ---\n');
    res.data.results.forEach(obj => {
      // obj.labels.singular is the display name
      console.log('Name:', obj.name, '| Label:', obj.labels.singular, '| ID:', obj.objectTypeId);
    });
    console.log('\nUse the "ID" field for your HUBSPOT_CUSTOM_OBJECT_NAME in .env');
  } catch (err) {
    console.error('Error fetching schemas:', err?.response?.data || err.message);
  }
})();