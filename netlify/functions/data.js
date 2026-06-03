cat << 'EOF'
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { getStore } = require('@netlify/blobs');

    const store = getStore({
      name: 'hermit-island',
      siteID: process.env.SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });

    const key = 'appdata';

    if (event.httpMethod === 'GET') {
      let data = null;
      try {
        const raw = await store.get(key);
        if (raw) data = JSON.parse(raw);
      } catch(e) { console.log('GET blob error:', e.message); }
      if (!data) {
        data = { commitments: [], customItems: [] };
        try { await store.set(key, JSON.stringify(data)); } catch(e) {}
      }
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      let data = null;
      try {
        const raw = await store.get(key);
        if (raw) data = JSON.parse(raw);
      } catch(e) {}
      if (!data) data = { commitments: [], customItems: [] };

      if (body.action === 'addCommit') {
        if (!data.commitments.find(c => c.catId === body.catId && c.itemName === body.itemName && c.personName === body.personName)) {
          data.commitments.push({ id: Date.now(), catId: body.catId, itemName: body.itemName, personName: body.personName, note: body.note || '' });
        }
      }
      if (body.action === 'removeCommit') {
        data.commitments = data.commitments.filter(c => c.id !== body.id);
      }
      if (body.action === 'addCustomItem') {
        if (!data.customItems.find(c => c.catId === body.catId && c.itemName === body.itemName)) {
          data.customItems.push({ catId: body.catId, itemName: body.itemName });
        }
      }
      await store.set(key, JSON.stringify(data));
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error) {
    console.error('ERROR:', error.name, error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message, type: error.name }) };
  }
};
EOF
Output

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { getStore } = require('@netlify/blobs');

    const store = getStore({
      name: 'hermit-island',
      siteID: process.env.SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });

    const key = 'appdata';

    if (event.httpMethod === 'GET') {
      let data = null;
      try {
        const raw = await store.get(key);
        if (raw) data = JSON.parse(raw);
      } catch(e) { console.log('GET blob error:', e.message); }
      if (!data) {
        data = { commitments: [], customItems: [] };
        try { await store.set(key, JSON.stringify(data)); } catch(e) {}
      }
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      let data = null;
      try {
        const raw = await store.get(key);
        if (raw) data = JSON.parse(raw);
      } catch(e) {}
      if (!data) data = { commitments: [], customItems: [] };

      if (body.action === 'addCommit') {
        if (!data.commitments.find(c => c.catId === body.catId && c.itemName === body.itemName && c.personName === body.personName)) {
          data.commitments.push({ id: Date.now(), catId: body.catId, itemName: body.itemName, personName: body.personName, note: body.note || '' });
        }
      }
      if (body.action === 'removeCommit') {
        data.commitments = data.commitments.filter(c => c.id !== body.id);
      }
      if (body.action === 'addCustomItem') {
        if (!data.customItems.find(c => c.catId === body.catId && c.itemName === body.itemName)) {
          data.customItems.push({ catId: body.catId, itemName: body.itemName });
        }
      }
      await store.set(key, JSON.stringify(data));
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error) {
    console.error('ERROR:', error.name, error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message, type: error.name }) };
  }
};

