'use strict';

/**
 * authontication service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::authontication.authontication');
