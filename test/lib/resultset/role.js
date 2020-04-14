/* A custom ResultSet class for the purposes of the tests */

const ResultSet = require("../../../lib/resultset.js");

class RoleResultSet extends ResultSet {
  constructor(schema, table, column_info, defined_relations) {
    const self = super(schema, table, column_info, defined_relations);

    return self;
  }

  custom_method() {
    const self = this;

    return `This is a custom method on the ResultSet for "${self._table}"`;
  }
}

module.exports = RoleResultSet;
