require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const CUSTOM_OBJECT = process.env.HUBSPOT_CUSTOM_OBJECT_NAME;
const PROPERTIES = (process.env.HUBSPOT_PROPERTIES || 'Name,Publisher,Price').split(',');

if (!HUBSPOT_TOKEN || !CUSTOM_OBJECT) {
  console.warn('Please set HUBSPOT_PRIVATE_APP_TOKEN and HUBSPOT_CUSTOM_OBJECT_NAME in .env');
}

// Helper: hubspot axios instance
const hubspot = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// ------- ROUTES --------

// Homepage - GET /
app.get('/', async (req, res) => {
  try {
    // GET objects - include properties
    const propsParam = PROPERTIES.join(',');
    const resp = await hubspot.get(`/crm/v3/objects/${CUSTOM_OBJECT}`, {
      params: {
        properties: propsParam,
        limit: 100
      }
    });

    const results = resp.data.results || [];
    // Transform results to easier shape for template
    const items = results.map(item => {
      const id = item.id;
      const props = item.properties || {};
      // ensure properties exist
      const row = {};
      PROPERTIES.forEach(p => row[p] = props[p] || '');
      return { id, ...row };
    });

    res.render('homepage', { title: 'Custom Object Table', items, properties: PROPERTIES });
  } catch (err) {
    console.error('Error fetching objects:', err?.response?.data || err.message);
    res.status(500).send('Error fetching custom objects. Check server logs.');
  }
});

// GET form to create new custom object record
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
    properties: PROPERTIES
  });
});

// POST - create new record
app.post('/update-cobj', async (req, res) => {
  try {
    // Build properties payload from form
    const properties = {};
    PROPERTIES.forEach(prop => {
      if (req.body[prop] !== undefined) properties[prop] = req.body[prop];
    });

    // HubSpot create object
    await hubspot.post(`/crm/v3/objects/${CUSTOM_OBJECT}`, { properties });

    // after creation redirect to homepage
    res.redirect('/');
  } catch (err) {
    console.error('Error creating object:', err?.response?.data || err.message);
    res.status(500).send('Error creating object. Check server logs.');
  }
});

app.listen(PORT, () => {
  console.log(`App listening on http://localhost:${PORT}`);
});