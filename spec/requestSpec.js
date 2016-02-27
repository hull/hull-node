// 'use strict';
// /* global it, describe */

// var _ = require('lodash');
// var sinon = require('sinon');
// var chai = require('chai');
// var expect = chai.expect;
// chai.use(require('sinon-chai'));
// chai.should();

// var Configuration = require('../lib/configuration');
// var RestAPI = require('../lib/rest-api');
// var config = {
//   id: '550964db687ee7866d000057',
//   secret: 'abcd12345',
//   organization: 'hull-demos.hullapp.io'
// };


// describe('Request Module', function() {

//   describe('API', function() {

//     it('should be a function', function() {
//       var restAPI = new RestAPI(new Configuration(config));
//       restAPI.perform.should.be.a('function');
//     });

//     it('should throw when no configuration is passed', function() {
//       expect(function() {
//         var restAPI = new RestAPI(new Configuration());
//       }).to.throw();
//     });

//     it('should throw when configuration is invalid', function() {
//       expect(function() {
//         var restAPI = new RestAPI(new Configuration(_.omit(config, 'organization')));
//       }).to.throw();
//     });

//   });
// });

