
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./rn-antmedia.cjs.production.min.js')
} else {
  module.exports = require('./rn-antmedia.cjs.development.js')
}
