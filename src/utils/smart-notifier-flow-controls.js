/**
 * This modules exports all the default flow controls
 */

module.exports = {
  defaultSuccessFlowControl: {
    type: "next",
    size: 1,
    in: 1000
  },

  defaultErrorFlowControl: {
    type: "retry",
    in: 1000
  },

  unsupportedChannelFlowControl: {
    type: "next",
    size: 100,
    in: 1
  }
};
