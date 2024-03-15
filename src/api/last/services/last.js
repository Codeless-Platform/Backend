'use strict';

/**
 * last service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::last.last');
