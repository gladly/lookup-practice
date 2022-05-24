//Require libraries to enable this application
const express = require('express');
const _ = require('lodash');
const request = require('request');
const lookupService = require('../services/loyalty');
const dayjs = require('dayjs');

module.exports = () => {
  const router = express.Router();

  router.post('/', (req, res) => {
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
    let form = {
      title: 'SAMPLE Loyalty Action',
      submitButton: 'Do it!',
      closeButton: 'Stop!',
      actionUrl: `/do/action?customerId=${req.query.customer}`, //when the user presses on the submit button, Gladly makes a POST request with this URL
      sections: [{ //you can have as many sections as you'd like
        type: 'input', //only input-section is allowed for now. think of these as custom inputs / POST parameters for the form being submitted
        defaultValue: '',
        label: 'SAMPLE Text Box',
        attr: 'sample-text',
        hint: 'anything you want',
        input: {
          type: "text"
        }
      },{ //you can have as many sections as you'd like
        type: 'text', //only input-section is allowed for now. think of these as custom inputs / POST parameters for the form being submitted
        text: "Section 1",
      },{ //you can have as many sections as you'd like
        type: 'text', //only input-section is allowed for now. think of these as custom inputs / POST parameters for the form being submitted
        text: "-----------------------------------",
      },{ //you can have as many sections as you'd like
        type: 'text', //only input-section is allowed for now. think of these as custom inputs / POST parameters for the form being submitted
        text: "Section 2",
      },{ //you can have as many sections as you'd like
        type: 'input', //only input-section is allowed for now. think of these as custom inputs / POST parameters for the form being submitted
        defaultValue: 'asdf',
        label: 'SAMPLE Text Box 2',
        attr: 'sample-text2',
        hint: 'anything you want',
        input: {
          type: "text"
        }
      }]
    };

    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Sending Actions form back ${JSON.stringify(form)}`);

    res.status(200).json(form);
  });

  router.post('/do/action', (req, res) => {
    let response = {
      detail: `Conducted a sample action on customer ${req.query.customerId}`,
      message: 'Completed loyalty action'
    };

    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Sending back response ${JSON.stringify(response)} to form submission`);

    res.status(200).json(response);
  });

  return router;
};
