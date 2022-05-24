require('dotenv').config();

const _ = require('lodash');
const dayjs = require('dayjs');
const crypto = require('crypto');

module.exports.logger = function(req, res, next) {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got ${req.method} request from Gladly.\n-- Path: ${req.path}\n-- Body: ${JSON.stringify(req.body)}\n-- Headers: ${JSON.stringify(req.headers)}\n\n`);
  next();
}

module.exports.validateGladlySignature = function(req, res, next) {
  const KEY = process.env.GLADLY_SIGNING_KEY;
  const REQUEST_METHOD = req.method;
  const REQUEST_PATH = req.path;
  const QUERY = req.query;
  const requestBody = req.body;

  let requestHeaders = {};
  _.each(req.headers, (v, k) => {
    requestHeaders[k.toLowerCase().trim()] = v.trim();
  });

  //NOTE: If you are sending GET params in lookup adapter, you MUST follow instructions: https://help.gladly.com/developer/docs/request-signing
  let query = '';

  const signatureToCheck = /Signature=(.*)/.exec(requestHeaders['gladly-authorization'])[1];

  //STEP 1
  const requestBodyHash = crypto.createHash('sha256').update(JSON.stringify(requestBody)).digest('hex').toLowerCase();
  console.log(`STEP 1: Request body hash: ${requestBodyHash}\n\n\n---------------\n\n`);

  //STEP 2
  const headersToSign = /SignedHeaders=(.*?),/.exec(requestHeaders['gladly-authorization'])[1];
  let requestHeadersBodyComboString = `${REQUEST_METHOD}\n${REQUEST_PATH}\n${query}\n`;
  _.each(headersToSign.split(';'), (header) => {
      requestHeadersBodyComboString += `${header.toLowerCase()}:${requestHeaders[header].split(/\s+/).join(' ').trim()}\n`;
  });
  requestHeadersBodyComboString += `\n${headersToSign}\n${requestBodyHash}`;
  const requestHeadersBodyComboHash = crypto.createHash('sha256').update(requestHeadersBodyComboString).digest('hex').toLowerCase();
  console.log(`STEP 2.a: Request headers / body combo:\n${requestHeadersBodyComboString}\n`);
  console.log(`STEP 2.b: Request headers / body combo hash: ${requestHeadersBodyComboHash}\n\n\n---------------\n\n`);

  //STEP 3
  const requestDate = /(.*)T/.exec(requestHeaders['gladly-time'])[1];
  const signingKey = Buffer.from(crypto.createHmac('sha256', KEY).update(requestDate).digest('hex'), 'hex');

  //STEP 4
  const stringToSign = `hmac-sha256\n${requestHeaders['gladly-time'].trim()}\n${requestHeadersBodyComboHash.trim()}`;
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  console.log(`STEP 3.a: String to sign:\n${stringToSign}\n`);
  console.log(`STEP 3.b: Signature: ${signature}\n\n\n---------------\n\n`);

  console.log(signature == signatureToCheck ? 'SUCCESS: Signatures match - proceeding with response!' : 'ERROR: Signatures do not match - stopping response');

  if(signature == signatureToCheck) {
    return next();
  } else {
    res.sendStatus(403);
  }
}
