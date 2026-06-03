const { getStore } = require('@netlify/blobs');

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
    const store = getStore('hermit-island-2026');

    if (event.httpMethod === 'GET') {
      let data;
      try {
        data = await store.get('appdata', { type: 'json' });
      } catch(e) {
        data = null;
      }
      if (!data) {
        data = { commitments: [], customItems: [] };
        await store.setJSON('appdata', data);
      }
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const action = body.action;

      let data;
      try {
        data = await store.get('appdata', { type: 'json' });
      } catch(e) {
        data = null;
      }
      if (!data) data = { commitments: [], customItems: [] };

      if (action === 'addCommit') {
        const { catId, itemName, personName, note } = body;
        const exists = data.commitments.find(
          c => c.catId === catId && c.itemName === itemName && c.personName === personName
        );
        if (!exists) {
          data.commitments.push({ id: Date.now(), catId, itemName, personName, note: note || '' });
        }
      }

      if (action === 'removeCommit') {
        data.commitments = data.commitments.filter(c => c.id !== body.id);
      }

      if (action === 'addCustomItem') {
        const { catId, itemName } = body;
        const exists = data.customItems.find(c => c.catId === catId && c.itemName === itemName);
        if (!exists) {
          data.customItems.push({ catId, itemName });
        }
      }

      await store.setJSON('appdata', data);
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
