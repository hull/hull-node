require('babel-register');
// var Hull = require('./lib/index.js');
var Hull = require('./src/index.js');

if (process.env.HULL_ID && process.env.HULL_SECRET && process.env.HULL_ORGANIZATION) {
  var hull = new Hull({
    id: process.env.HULL_ID,
    secret: process.env.HULL_SECRET,
    organization: process.env.HULL_ORGANIZATION
  });

  hull.get('/org').then(function(data) {
    console.log('Org Name');
    console.log(data.name);
    console.log('-------\n');
  }).catch(function(err) {
    console.log(err);
  });
  hull.get('/org/comments').then(function(data) {
    console.log('Comments');
    console.log(data);
    console.log('-------\n');
  }).catch(function(err) {
    console.log(err);
  });

  var me = hull.as(process.env.HULL_ME_TEST);

  me.get('/me').then(function(data) {
    console.log('/me email for ' + process.env.HULL_ME_TEST);
    console.log(data.email);
    console.log('-------\n');
  });
  me.get('/me/liked/5103a55193e74e3a1f00000f').then(function(data) {
    console.log('Did I Like Org', data);
    console.log('-------\n');
  }).catch(function(err){
    console.log(err);
    console.log('-------\n');
  });

} else {
  console.log('Environment variables not set.');
}
