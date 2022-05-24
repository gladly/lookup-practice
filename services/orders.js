const Promise = require('promise');
const _ = require('lodash');
const csv = require('csvtojson');
const dayjs = require('dayjs')

module.exports.basicLookup = function(lookup) {
  return new Promise((resolve, reject) => {
    csv()
    .fromFile(`${__dirname}/../sample-data/users-orders-sample.csv`)
    .then((customers) => {
      //In this example, we lookup only by email. In reality, customers can choose to lookup by any other attributes they wish
      let lookupEmail = '';

      if(typeof lookup.query.emails !== 'undefined' && lookup.query.emails.length > 0) {
        //BASIC suggestions
        lookupEmail = lookup.query.emails[0];
      } else if(typeof lookup.query.email !== 'undefined' && lookup.query.email) {
        //BASIC search
        lookupEmail = lookup.query.email;
      }

      //Nothing to return here
      if(!lookupEmail) {
        console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][BASIC] Sending results ${JSON.stringify({results: []})} for orders lookup`);

        return resolve({
          results: []
        });
      }

      let results = [];
      _.each(_.filter(customers, (customer) => { return customer.email == lookupEmail}), (customer) => {
        results.push({
          externalCustomerId: customer.id,
          emails: [{
            original: customer.email
          }],
          name: customer.name
        });
      });

      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][BASIC] Sending results ${JSON.stringify({results: results})} for orders lookup`);

      resolve({
        results: results
      })
    })
    .catch((e) => {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][BASIC] Sending results ${JSON.stringify({results: []})} for orders lookup due to error ${JSON.stringify(e)}`);

      //If you can't load it, send an empty result back
      resolve({
        results: []
      });
    });
  });
}

module.exports.detailedLookup = function(lookup) {
  return new Promise((resolve, reject) => {
    Promise.all([
      csv().fromFile(`${__dirname}/../sample-data/users-orders-sample.csv`),
      csv().fromFile(`${__dirname}/../sample-data/transactions-orders-sample.csv`)
    ])
    .then((res) => {
      const customers = res[0];
      const transactions = res[1];

      const rawCustomerObject = _.filter(customers, (customer) => { return customer.id == lookup.query.externalCustomerId });

      if(!rawCustomerObject || !rawCustomerObject.length) {
        console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][DETAILED] Sending results ${JSON.stringify({results: []})} for orders lookup`);

        return resolve({
          results: []
        });
      }

      //Get a list of rewards
      let orders = [];
      _.each(_.filter(transactions, (transaction) => { return transaction.customerId == lookup.query.externalCustomerId }), (order) => {
        orders.push({
          type: 'ORDER',
          createdAt: order.createdAt,
          status: order.status,
          orderNumber: order.id,
          products: [{ //sample hard-coded products
            id: '1', //integers must be converted to strings
            name: 'SAMPLE product',
            sku: '1',
            unitPrice: '$10.00',
            quantity: '1'
          }],
          actions: [{
            name: 'SAMPLE Action!',
            formUrl: `/action?order=${order.id}`
          }]
        });
      });

      const results = {
        results: [
          {
            externalCustomerId: rawCustomerObject[0].id,
            emails: [
              {
                original: rawCustomerObject[0].email
              }
            ],
            phones: [
              {
                original: rawCustomerObject[0].phone
              }
            ],
            customAttributes: {
              points: rawCustomerObject[0].points,
              membershipStatus: rawCustomerObject[0].membershipStatus
            },
            name: rawCustomerObject[0].name,
            transactions: orders
          }
        ]
      };

      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][DETAILED] Sending results ${JSON.stringify(results)} for orders lookup`);

      resolve(results);
    })
    .catch((e) => {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][DETAILED] Sending results ${JSON.stringify({results: []})} for orders lookup due to error ${JSON.stringify(e)}`);

      //If you can't load it, send an empty result back
      resolve({
        results: []
      });
    });
  });
}
