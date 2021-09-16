//Require libraries to enable this application
const express = require('express');
const _ = require('lodash');
const request = require('request');
const lookupService = require('../services/orders');
const dayjs = require('dayjs');

module.exports = () => {
  const router = express.Router();

  router.post('/', (req, res) => {
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got POST from Gladly ${JSON.stringify(req.body)} for orders lookup adapter`);

    if(req.body.lookupLevel == 'BASIC') {
      lookupService.basicLookup(req.body)
      .then((customers) => {
        res.send(JSON.stringify(customers));
      });
    } else if(req.body.lookupLevel == 'DETAILED') {
      lookupService.detailedLookup(req.body)
      .then((customer) => {
        res.send(JSON.stringify(customer));
      });
    } else  {
      res.sendStatus(500);
    }
  });

  //Render the order action form
  router.get('/action', (req, res) => {
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got GET request to render Actions form from Gladly ${JSON.stringify(req.query)} for orders lookup adapter`);

    let form = {
      title: 'SAMPLE Order Action',
      submitButton: 'Do it!',
      closeButton: 'Stop!',
      actionUrl: `/do/action?orderId=${req.query.order}`, //when the user presses on the submit button, Gladly makes a POST request with this URL
      sections: [{ //you can have as many sections as you'd like
        type: 'input', //only input-section is allowed for now. think of these as custom inputs / POST parameters for the form being submitted
        label: 'SAMPLE Select Box',
        attr: 'sample-select-box',
        hint: 'not required',
        input: {
          type: 'select',
          placeholder: 'Select a Reason',
          optional: false,
          options: [{ //each option has to have a unique value. think of this as a <option/> list in a <select/> dropdown
            text: 'R1',
            value: 'reason-1'
          },{
            text: 'R2',
            value: 'reason-2'
          }]
        }
      }, { //you can have as many sections as you'd like
        type: 'input', //only input-section is allowed for now. think of these as custom inputs / POST parameters for the form being submitted
        defaultValue: true,
        label: 'SAMPLE Check Box',
        attr: 'sample-checkbox',
        input: {
          type: "checkbox",
          text: "To check or uncheck"
        }
      }, { //you can have as many sections as you'd like
        type: 'input', //only input-section is allowed for now. think of these as custom inputs / POST parameters for the form being submitted
        defaultValue: '12345',
        label: 'SAMPLE Text Box',
        attr: 'sample-text',
        hint: 'enter only numbers; if you put 911 in here, a special error occurs',
        input: {
          type: "text"
        }
      }]
    };

    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Sending Actions form back ${JSON.stringify(form)}`);

    res.status(200).json(form)
  });

  router.post('/do/action', (req, res) => {
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got Actions POST from Gladly with body: ${JSON.stringify(req.body)} and query ${JSON.stringify(req.query)} for orders lookup adapter`);

    let numericValue = req.body['sample-text'].trim();

    //This error allows the agent to retry again within the same form
    if(numericValue !== '' && !/^\d+/.exec(numericValue)) {
      let response = {
        errors: [
          {
            detail: 'Could not complete action',
            message: 'Could not complete action'
          },
          {
            attr: 'sample-text',
            detail: 'Must only be numbers',
            code: '12345'
          }
        ]
      };

      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Sending back response ${JSON.stringify(response)} to form submission`);

      res.status(400).json(response)
    } else if (numericValue && numericValue == '911') {
      let response = {
        errors: [
          {
            detail: '911 in SAMPLE Text Box results in 406 status, thus dismissing form',
            message: 'Could not complete action'
          }
        ]
      };

      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Sending back response ${JSON.stringify(response)} to form submission`);

      res.status(406).json(response);
    }
    else { //This error says the action was successful, and the form disappears from view (until the next DETAILED lookup response)
      let response = {
        detail: `Conducted a sample action on order ${req.query.orderId}`,
        message: 'Completed order action'
      };

      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Sending back response ${JSON.stringify(response)} to form submission`);

      res.status(200).json(response)
    }
  });

  return router;
};
