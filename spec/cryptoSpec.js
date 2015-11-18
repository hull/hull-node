// 'use strict';
// require('babel/register');
// /* global it, describe */

// var _ = require('lodash');
// var sinon = require('sinon');
// var chai = require('chai');
// var expect = chai.expect;
// chai.use(require('sinon-chai'));
// chai.should();

// var crypto = require('../lib/crypto');
// var invalidConfig = {
//   platformId: true
// };
// var config = {
//   platformId: '550964db687ee7866d000057',
//   platformSecret: 'abcd12345',
//   orgUrl: 'https://hull-demos.hullapp.io'
// };
// var fooBar = ['foo', 'bar'];
// var signedFooBar = 'c206e90efa41627cbf49e1e75d0a66643d4e14e5';
// var userToken = '1234567';
// var userId='1234567';

// describe('Crypto module', function() {
//   describe('sign', function() {
//     it('should throw if no config', function() {
//       expect(function() {
//         crypto.sign();
//       }).to.throw();
//     });
//     it('should throw if config is invalid', function() {
//       expect(function() {
//         crypto.sign(invalidConfig);
//       }).to.throw();
//       expect(function() {
//         crypto.sign('StringConfig');
//       }).to.throw();
//     });
//     it('should return the right signature item when secret is valid', function() {
//       var signed = crypto.sign(config, fooBar.join('.'));
//       expect(signed).to.equal(signedFooBar);
//     });
//     it('should throw if payload is not a string', function() {
//       expect(function() {
//         crypto.sign(config, fooBar);
//       }).to.throw();
//     });
//     it('should not return the right signature item when secret is invalid', function() {
//       var signed = crypto.sign({
//         platformId: config.platformId,
//         orgUrl: config.orgUrl,
//         platformSecret: 'invalid'
//       }, fooBar.join('.'));
//       expect(signed).to.not.be.equal(signedFooBar);
//     });
//   });
//   describe('userToken', function() {
//     it('should throw if config is invalid', function() {
//       expect(function() {
//         crypto.userToken(invalidConfig);
//       }).to.throw();
//     });
//   });
//   describe('currentUserId', function() {
//     it('should throw if config is invalid', function() {
//       expect(function() {
//         crypto.sign(invalidConfig, fooBar);
//       }).to.throw();
//     });
//     it('should return the user if signature is valid', function() {
//       var time = '1234567';
//       var data = [time, userId].join('-');
//       var sign = crypto.sign(config, data);
//       var uid = crypto.currentUserId(config, userId, [time, sign].join('.'));
//       expect(uid).to.equal(true);
//     });
//   });
// });
