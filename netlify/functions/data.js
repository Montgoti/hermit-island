const https = require('https');

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = 'appJOvEYol0RsHWZT';
const COMMITMENTS_TABLE = 'Commitments';
const CUSTOM_ITEMS_TABLE = 'CustomItems';

function airtableRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/${BASE_ID}/${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getAllRecords(table) {
  let records = [], offset = null;
  do {
    const path = offset
      ? `${encodeURIComponent(table)}?offset=${offset}`
      : encodeURIComponent(table);
    const res = await airtableRequest('GET', path, null);
    if (res.body.records) records = records.concat(res.body.records);
    offset = res.body.offset || null;
  } while (offset);
  return records;
}

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
    if (event.httpMethod === 'GET') {
      const [commitRecs, customRecs] = await Promise.all([
        getAllRecords(COMMITMENTS_TABLE),
        getAllRecords(CUSTOM_ITEMS_TABLE),
      ]);
      const commitments = commitRecs.filter(r => r.fields.catId).map(r => ({
        id: r.id,
        catId: r.fields.catId || '',
        itemName: r.fields.itemName || '',
        personName: r.fields.personName || '',
        note: r.fields.note || '',
      }));
      const customItems = customRecs.map(r => ({
        id: r.id,
        catId: r.fields.catId || '',
        itemName: r.fields.itemName || '',
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ commitments, customItems }) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);

      if (body.action === 'addCommit') {
        const res = await airtableRequest('POST', encodeURIComponent(COMMITMENTS_TABLE), {
          records: [{ fields: {
            catId: body.catId,
            itemName: body.itemName,
            personName: body.personName,
            note: body.note || '',
          }}]
        });
        if (res.status !== 200) throw new Error('Airtable error: ' + JSON.stringify(res.body));
      }

      if (body.action === 'removeCommit') {
        await airtableRequest('DELETE', `${encodeURIComponent(COMMITMENTS_TABLE)}/${body.id}`, null);
      }

      if (body.action === 'addCustomItem') {
        const res = await airtableRequest('POST', encodeURIComponent(CUSTOM_ITEMS_TABLE), {
          records: [{ fields: {
            catId: body.catId,
            itemName: body.itemName,
          }}]
        });
        if (res.status !== 200) throw new Error('Airtable error: ' + JSON.stringify(res.body));
      }

      // Return fresh data after any write
      const [commitRecs, customRecs] = await Promise.all([
        getAllRecords(COMMITMENTS_TABLE),
        getAllRecords(CUSTOM_ITEMS_TABLE),
      ]);
      const commitments = commitRecs.map(r => ({
        id: r.id,
        catId: r.fields.catId || '',
        itemName: r.fields.itemName || '',
        personName: r.fields.personName || '',
        note: r.fields.note || '',
      }));
      const customItems = customRecs.map(r => ({
        id: r.id,
        catId: r.fields.catId || '',
        itemName: r.fields.itemName || '',
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ commitments, customItems }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error) {
    console.error('ERROR:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
