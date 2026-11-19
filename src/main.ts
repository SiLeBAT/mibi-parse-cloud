// import order is important here
// data-encryption first: its hooks must exist before any module saves or reads data
import './modules/data-encryption';

import './modules/system-update';

import './modules/system-initialise';

import './modules/system-monitoring';

import './modules/user-management';

import './modules/catalog-management';

import './modules/orders';
