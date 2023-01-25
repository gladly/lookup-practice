const Promise = require('promise');
const _ = require('lodash');
const csv = require('csvtojson');
const dayjs = require('dayjs')

module.exports.basicLookup = function(lookup) {
  return new Promise((resolve, reject) => {
    csv()
    .fromFile(`${__dirname}/../sample-data/users-loyalty-sample.csv`)
    .then((customers) => {
      //In this example, we lookup only by email or phone. In reality, customers can choose to lookup by any other attributes they wish
      let lookupEmail = '';
      let lookupPhone = '';

      //Get the email address being search on; only use the 1st email address if there are multiple
      if(typeof lookup.query.emails !== 'undefined' && lookup.query.emails.length > 0) {
        //BASIC suggestions
        lookupEmail = lookup.query.emails[0];
      } else if(typeof lookup.query.email !== 'undefined' && lookup.query.email) {
        //BASIC search
        lookupEmail = lookup.query.email;
      }

      //Get the phone number being searched on; only use the 1st phone number if there are multiple
      if(typeof lookup.query.phones !== 'undefined' && lookup.query.phones.length > 0) {
        lookupPhone = lookup.query.phones[0];
      } else if(typeof lookup.query.phone !== 'undefined' && lookup.query.phone) {
        //BASIC search
        lookupPhone = lookup.query.phone;
      }

      //Nothing to return here
      if(!lookupEmail && !lookupPhone) {
        console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][BASIC] Sending results ${JSON.stringify({results: []})} for loyalty lookup`);

        return resolve({
          results: []
        });
      }

      let results = [];

      //This is an OR search, not an AND search, but customers are free to build this logic as they see fit
      _.each(_.filter(customers, (customer) => {
        return ((lookupEmail && customer.email == lookupEmail) || (lookupPhone && customer.phone == lookupPhone))
      }), (customer) => {
        results.push({
          externalCustomerId: customer.id,
          emails: customer.email ? [{original: customer.email}] : [],
          phones: customer.phone ? [{original: customer.phone, type: 'MOBILE'}] : [], //MOBILE numbers are considered unique in Gladly. To auto-link, phone number type has to be set to MOBILE in either the lookup adpator OR within the Gladly Customer Profile AND phone number in lookup adaptor response has to match the phone number in Gladly Customer Profile.
          name: customer.name,
          customAttributes: {
            points: customer.points
          }
        });
      });

      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][BASIC] Sending results ${JSON.stringify({results: results})} for loyalty lookup`);

      resolve({
        results: results
      })
    })
    .catch((e) => {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][BASIC] Sending results ${JSON.stringify({results: []})} for loyalty lookup due to error ${JSON.stringify(e)}`);

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
      csv().fromFile(`${__dirname}/../sample-data/users-loyalty-sample.csv`),
      csv().fromFile(`${__dirname}/../sample-data/transactions-loyalty-sample.csv`)
    ])
    .then((res) => {
      const customers = res[0];
      const transactions = res[1];

      const rawCustomerObject = _.filter(customers, (customer) => { return customer.id == lookup.query.externalCustomerId });

      if(!rawCustomerObject || !rawCustomerObject.length) {
        console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][DETAILED] Sending results ${JSON.stringify({results: []})} for loyalty lookup; ${lookup.query.externalCustomerId} could not be found in sample data set`);

        return resolve({
          results: []
        });
      }

      //Get a list of rewards - even though it is of type GENERIC, Gladly can only support 1 transaction format across all adapters today
      let rewards = [];
      _.each(_.filter(transactions, (transaction) => { return transaction.customerId == lookup.query.externalCustomerId }), (reward) => {
        rewards.push({
          type: 'ORDER',
          name: reward.rewardName,
          amount: reward.rewardAmount
        });
      });

      const results = {
        results: [
          {
            externalCustomerId: rawCustomerObject[0].id,
            emails: rawCustomerObject[0].email ? [
              {
                original: rawCustomerObject[0].email
              }
            ] : [],
            phones: rawCustomerObject[0].phone ? [
              {
                original: rawCustomerObject[0].phone,
                type: 'MOBILE'
              }
            ] : [],
            customAttributes: {
              points: rawCustomerObject[0].points
            },
            name: rawCustomerObject[0].name,
            transactions: rewards,
            actions: [
              {
                name: 'A SAMPLE Action on Customer',
                formUrl: `/action?customer=${rawCustomerObject[0].id}`
              }
            ]
          }
        ]
      };

      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][DETAILED] Sending results ${JSON.stringify(results)} for loyalty lookup`);

      resolve(results);
    })
    .catch((e) => {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}][DETAILED] Sending results ${JSON.stringify({results: []})} for loyalty lookup due to error ${JSON.stringify(e)}`);

      //If you can't load it, send an empty result back
      resolve({
        results: []
      });
    });
  });
}
