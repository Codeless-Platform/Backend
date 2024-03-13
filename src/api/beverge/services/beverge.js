'use strict';

/**
 * beverge service
 */

const { createCoreService } = require('@strapi/strapi').factories;

// @ts-ignore
module.exports = createCoreService('api::beverge.beverge');
