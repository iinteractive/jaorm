/* A custom ResultSet class for the purposes of the tests */

const ResultSet = require("../../../lib/resultset.js");

class MessageResultSet extends ResultSet {
  constructor(schema, table, column_info, defined_relations) {
    const self = super(schema, table, column_info, defined_relations);

    return self;
  }

  custom_method() {
    const self = this;

    return `This is a custom method on the ResultSet for "${self._table}"`;
  }

  // Override
  static manual_relations() {
    const relations = super.manual_relations();
    relations.sender = {
      table: "user",
      local: "message.sender_id",
      local_has_one: "sender",
      local_has_many: null,
      foreign: "user.id",
      foreign_has_one: null,
      foreign_has_many: "sent_messages"
    };
    relations.recipient = {
      table: "user",
      local: "message.recipient_id",
      local_has_one: "recipient",
      local_has_many: null,
      foreign: "user.id",
      foreign_has_one: null,
      foreign_has_many: "received_messages"
    };
    return relations;
  }
}

module.exports = MessageResultSet;
