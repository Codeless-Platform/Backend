'use strict';

/**
 * last controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::last.last');
