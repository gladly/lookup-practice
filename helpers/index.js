require('dotenv').config();

const _ = require('lodash');
const dayjs = require('dayjs');
const crypto = require('crypto');

module.exports.logger = function (req, res, next) {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got ${req.method} request from Gladly.\n-- Path: ${req.path}\n-- Body: ${JSON.stringify(req.body)}\n-- Headers: ${JSON.stringify(req.headers)}\n\n`);
  next();
}

module.exports.validateGladlySignature = function (req, res, next) {
  const KEY = process.env.GLADLY_SIGNING_KEY;
  //if no Query string, set to empty string
  const QUERY = req._parsedUrl.query ?? "";
  const REQUEST_METHOD = req.method;
  const REQUEST_PATH = req._parsedUrl.path;
  const requestBody = req.body;
  let requestHeaders = {};
  _.each(req.headers, (v, k) => {
    requestHeaders[k.toLowerCase().trim()] = v.trim();
  });

  //NOTE: If you are sending GET params in lookup adapter, you MUST follow instructions: https://help.gladly.com/developer/docs/request-signing
  const signatureToCheck = /Signature=(.*)/.exec(requestHeaders['gladly-authorization'])[1];

  //STEP 1
  let requestBodyHash;
  if (REQUEST_METHOD == 'GET') {
    //this is a GET request, so we don't have a request body, this is the hash of an empty string
    //JS doesn't do empty string hashes well, so we'll use the hash of an empty string
   requestBodyHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  } else {
    requestBodyHash = crypto.createHash('sha256').update(JSON.stringify(requestBody)).digest('hex').toLowerCase();
  }
  console.log(`STEP 1: Request body hash: ${requestBodyHash}\n\n\n---------------\n\n`);

  //STEP 2
  const headersToSign = /SignedHeaders=(.*?),/.exec(requestHeaders['gladly-authorization'])[1];
  let requestHeadersBodyComboString = `${REQUEST_METHOD}\n${REQUEST_PATH}\n${QUERY}\n`;
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

  if (signature == signatureToCheck) {
    return next();
  } else {
    res.sendStatus(403);
  }
}