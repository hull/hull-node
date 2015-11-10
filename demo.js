var Hull = require('./index');

if (process.env.HULL_PLATFORM_ID && process.env.HULL_PLATFORM_SECRET && process.env.HULL_ORG_URL) {
  var hull = new Hull({
    platformId: process.env.HULL_PLATFORM_ID,
    platformSecret: process.env.HULL_PLATFORM_SECRET,
    orgUrl: process.env.HULL_ORG_URL
  });

  hull.get('/org').then(function(res) {
    console.log(res);
  });
} else {
  console.log('Environment variables not set.');
}
