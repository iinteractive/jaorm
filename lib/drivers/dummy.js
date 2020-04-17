class DriverDummy {
  constructor(db_connection_options) {
    const self = this;

    // Do something with db_connection_options!

    return self;
  }

  // Implement some way to call raw SQL.
  raw(stmt, options) {
    const self = this;

    throw new Error('not implemented');
  }

  // Retrieve all records for the given query.
  async all({
    table,
    attributes = {},
    schema,
    relations = [],
    driver_options = {},
    query_options = {}
  }) {
    const self = this;

    throw new Error('not implemented');
  }

  // Return the count of retrieved records.
  async count({ table, attributes, schema, relations, driver_options }) {
    const self = this;

    throw new Error('not implemented');
  }

  // Return the first record from a query.
  async first({ table, attributes, schema, relations, driver_options }) {
    const self = this;

    throw new Error('not implemented');
  }

  // Implement CREATE.
  // Returns the created record on success.
  async create({ table, attributes, schema, relations, driver_options }) {
    const self = this;

    throw new Error('not implemented');
  }

  // Implement UPDATE.
  // Returns the updated record(s) on success.
  async update({ table, attributes, new_attributes, schema, driver_options }) {
    const self = this;

    throw new Error('not implemented');
  }

  // Implement DELETE.
  // Returns null on success.
  async destroy({ table, attributes, schema, driver_options }) {
    const self = this;

    throw new Error('not implemented');
  }

  // Return the list of tables.
  // Format is an array: [ 'user', 'role', 'posts' ]
  async list_tables() {
    const self = this;

    throw new Error('not implemented');
  }

  // Retrieve all primary keys for the relevant database.
  // Format is a hash with array values: { user: [ 'id' ], role: [ 'id' ], friend_list: [ 'user_id', 'friend_id' ] }
  async get_pks() {
    const self = this;

    throw new Error('not implemented');
  }
}

module.exports = DriverDummy;
