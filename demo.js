var Hull = require('./lib/index');
if (process.env.HULL_PLATFORM_ID && process.env.HULL_PLATFORM_SECRET && process.env.HULL_ORG_URL) {
  var hull = new Hull({
    platformId: process.env.HULL_PLATFORM_ID,
    platformSecret: process.env.HULL_PLATFORM_SECRET,
    orgUrl: process.env.HULL_ORG_URL
  });

  hull.get('/org').then(function(data) {
    console.log('Org Name');
    console.log(data.name);
    console.log('-------\n');
  }).catch(function(err) {
    console.log(err);
  });

  var me = hull.as(process.env.HULL_ME_TEST);

  me.get('/me').then(function(data) {
    console.log('/me for ' + process.env.HULL_ME_TEST);
    console.log(data.email);
    console.log('-------\n');
  });
} else {
  console.log('Environment variables not set.');
}
