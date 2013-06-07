"use strict";

var defaultRequiredProps = ['appId', 'appSecret', 'orgUrl'];

function checkConfiguration (obj, props) {
  props = props || defaultRequiredProps;
  props.forEach(function (p) {
    if (!obj.hasOwnProperty(p)) {
      throw new Error('The configuration is missing the required property ' + p);
    }
  });
}

module.exports = {
  check: checkConfiguration
};

