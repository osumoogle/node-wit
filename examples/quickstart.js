'use strict';

let Wit = null;
let interactive = null;
let http = require('http');
let https = require('https');
let q = require('q');
let url = require('url');
let _ = require('lodash');
try {
  // if running from repo
  Wit = require('../').Wit;
  interactive = require('../').interactive;
} catch (e) {
  Wit = require('node-wit').Wit;
  interactive = require('node-wit').interactive;
}

const accessToken = (() => {
  if (process.argv.length !== 3) {
    console.log('usage: node examples/quickstart.js <wit-access-token>');
    process.exit(1);
  }
  return process.argv[2];
})();

// Quickstart example
// See https://wit.ai/ar7hur/quickstart

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  send(request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    return new Promise(function(resolve, reject) {
      console.log('sending...', JSON.stringify(response));
      return resolve();
    });
  },
  findContacts({context, entities}) {
    return new Promise(function(resolve, reject) {
      var target = firstEntityValue(entities, 'target')
      if (target) {
        var theUrl = url.parse(target);
        console.log(theUrl);
        var body = '';
        if(theUrl.protocol === 'http:'){
          console.log('calling get');
          get(theUrl.hostname, theUrl.path)
            .then(function(res){
              context.contacts = findEmailAddresses(res);
              delete context.missingLocation;
              return resolve(context);
            });
        }
        else{
          console.log('calling getSecure');
          getSecure(theUrl.hostname, theUrl.path)
            .then(function(res){
              console.log(res.length);
              context.contacts = findEmailAddresses(res);
              delete context.missingLocation;
              return resolve(context);
            });
        }
      } else {
        context.missingTarget = true;
        delete context.contacts;
      }
    });
  },
  get(target){
  },
};

function get(host, path){
  var deferred = q.defer();
  http.get({
    host: host,
    path: path,
  }, function(response){
    var body = '';
    response.on('data', function(d){
      body += d;
    });
    response.on('end', function(){
      deferred.resolve(body);
    });
  });
  return deferred.promise;
};

function getSecure(host, path){
  var deferred = q.defer();
  https.get({
    host: host,
    path: path,
    method: 'GET',
    port: 443
  }, function(response){
    var body = '';
    response.on('data', function(d){
      body += d;
    });
    response.on('end', function(){
      deferred.resolve(body);
    });
  });
  return deferred.promise;
};

function findEmailAddresses(body){
  var separateEmailsBy = ", ";
  var email = "<none>"; // if no match, use this
  var emailsArray = body.match(/[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,}/gi);
  if (emailsArray) {
    emailsArray = _.uniq(emailsArray);
    email = "";
    for (var i = 0; i < emailsArray.length; i++) {
      if (i != 0) 
        email += separateEmailsBy;
      email += emailsArray[i];
    }
  }
  return email;
}

const client = new Wit({accessToken, actions});
interactive(client);
