// "use strict";
// /* global it, describe */
// require('babel/register');

// var _ = require('lodash');
// var sinon = require('sinon');
// var chai = require('chai');
// var expect = chai.expect;
// chai.use(require('sinon-chai'));
// chai.should();

// var config = {
//   id: '550964db687ee7866d000057',
//   secret: 'abcd12345',
//   organization: 'hull-demos.hullapp.io'
// };

// var Hull = require('../lib/index');
// var Client = require('../lib/index');

// describe('Main Entry point', function() {

//   it('should be a function', function() {
//     Hull.should.be.a('function');
//   });

//   it('should be a subclass of Client', function() {
//     var hull = new Hull(config);
//     expect(hull).to.be.an.instanceOf(Client);
//   });
//   it('should have an "as" method', function() {
//     var hull = new Hull(config);
//     expect(hull).to.be.an.instanceOf(Client);
//   });
//   it('should return a new Client when calling "as"', function() {
//     var hull = new Hull(config);
//     var user = hull.as('1234');
//     expect(user).to.be.an.instanceOf(Client);
//   });
//   // it('should return an instance of the HTTP client', function() {
//   //   Hull({appId:true, organization:true, appSecret:true}).should.be.instanceOf(Client);
//   // });

//   // describe('The exported "client" property', function() {
//   //   it('should be the same as the module exports', function() {
//   //     Hull.client.should.equal(Hull);
//   //   });
//   // });
// });


