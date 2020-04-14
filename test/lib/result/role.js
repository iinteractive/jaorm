/* A custom Result class for the purposes of the tests */

const Result = require("../../../lib/result.js");

class RoleResult extends Result {
  constructor(schema, table, column_info, values = {}) {
    const self = super(schema, table, column_info, values);

    return self;
  }

  is_regular_user() {
    const self = this;
    return self.id() > 2;
  }
}

module.exports = RoleResult;
