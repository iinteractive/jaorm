/* Base Result class. Subclass it as needed. */

class Result {
  constructor(schema, table, column_info, values = {}) {
    const self = this;

    if (!table) {
      throw new Error("Result objects require a table name");
    }

    self._schema = schema;
    self._table = table;
    self._column_info = column_info;
    self._values = {};
    self._related_results = {};

    for (const [key, value] of Object.entries(values)) {
      if (typeof value === "object" && value !== null) {
        let related_table = key;

        // If it's not an actual table, but a relation, look it up
        if (self._schema.column_info[key] === undefined) {
          related_table = self._schema.relations[self._table][key].table;
        }

        for (const entry of values[key]) {
          if (self._related_results[key] === undefined) {
            self._related_results[key] = [];
          }

          const inner_result = new self._schema.results[related_table](
            self._schema,
            related_table,
            self._schema.column_info[related_table],
            entry,
            {}
          );
          inner_result.initialize();

          self._related_results[key].push(inner_result);
        }
      } else {
        self._values[key] = values[key];
      }
    }

    self.integer_types = ["integer", "bigint"];
    return self;
  }

  initialize() {
    const self = this;

    for (const column of Object.keys(self._column_info)) {
      if (self._column_info[column].type === "boolean") {
        if (self._values[column]) {
          self._values[column] = true;
        } else {
          self._values[column] = false;
        }
      }

      // The pg driver returns everything as a string, so coerce if need be
      if (
        self.integer_types.includes(self._column_info[column].type) &&
        typeof self._values[column] === "string"
      ) {
        self._values[column] = parseInt(self._values[column], 10);
      }

      if (!Object.prototype.hasOwnProperty.call(self, column)) {
        self[column] = function accessor(arg) {
          const inner_self = this;
          if (arg === undefined) {
            return inner_self._values[column];
          }

          const update_values = {};
          update_values[column] = arg;

          return inner_self.update(update_values);
        };
      }
    }

    for (const relation of Object.keys(self._related_results)) {
      const relation_info = self._schema.relations[self._table][relation];

      if (relation_info) {
        if (relation_info.has_one) {
          self[relation_info.has_one] = function foreign_accessor() {
            return self._related_results[relation][0];
          };
        }
        if (relation_info.has_many) {
          self[relation_info.has_many] = function foreign_accessor() {
            return self._related_results[relation];
          };
        }
      } else {
        // We're not an actual relation, but something that got here in a chain
        const names = self._schema._automatic_accessor_names(relation);
        self[names.singular] = function foreign_accessor() {
          return self._related_results[relation][0];
        };
        self[names.plural] = function foreign_accessor() {
          return self._related_results[relation];
        };
      }
    }
  }

  // This just passes through to the update_all method.
  // That's ok though, because we're going to have a PK here.
  // If we *don't* have a PK, fail out; they have to use the RS method
  // so that it's obvious what they're doing.
  async update(update_values, driver_options) {
    const self = this;

    const self_rs = self._schema.rs(self._table);

    const pks = self.pks();

    // If we don't have a primary key, we can't reliably get the correct item
    // with an update. Throw an error to have them use update_all so it's at
    // least explicit what they're doing.
    if (pks.length === 0) {
      throw new Error(
        "You can't use a single object update() without a primary key on the table. Please use rs.update_all()."
      );
    }

    const pk_values = {};
    for (const pk of pks) {
      pk_values[pk] = self._values[pk];
    }

    // Yank the first value, since it'll be an array of one.
    const [retval] = await self_rs.where(pk_values).update_all(update_values);

    return retval;
  }

  // Like update(), this just passes through to the resultset's destroy_all method.
  // That's ok though, because we're going to have a PK here.
  // If we *don't* have a PK, fail out; they have to use the RS method
  // so that it's obvious what they're doing.
  async destroy() {
    const self = this;

    const self_rs = self._schema.rs(self._table);

    const pks = self.pks();

    // If we don't have a primary key, we can't reliably get the correct item
    // with a DELETE statement. Throw an error to have them use delete_all so it's at
    // least explicit what they're doing.
    if (pks.length === 0) {
      throw new Error(
        "You can't use a single object destroy() without a primary key on the table. Please use rs.destroy_all()."
      );
    }

    const pk_values = {};
    for (const pk of pks) {
      pk_values[pk] = self._values[pk];
    }

    // Send it to the resultset version with appropriate values.
    await self_rs.destroy_all(pk_values);

    // We don't have anything useful to return here, so return null so it's obvious we
    // send nothing back on purpose.
    return null;
  }

  to_object() {
    const self = this;
    const values = {};
    for (const [key, val] of Object.entries(self._values)) {
      values[key] = val;
    }

    for (const [key, objects] of Object.entries(self._related_results)) {
      const relation_info = self._schema.relations[self._table][key];
      if (relation_info) {
        if (relation_info.has_one) {
          values[relation_info.has_one] = objects[0].to_object();
        }
        if (relation_info.has_many) {
          values[relation_info.has_many] = objects.map(o => o.to_object());
        }
      }
    }
    return values;
  }

  to_json_string() {
    const self = this;
    return self._schema.serialize(self.to_object());
  }

  pk() {
    const self = this;

    return self.pks();
  }

  pks() {
    const self = this;

    // Did we get it from the database?
    if (self._schema.pks[self._table]) {
      return self._schema.pks[self._table];
    }

    // No? Okay, is there an 'id' column? That's a safe bet.
    if (self._schema.column_info[self._table].id) {
      return ["id"];
    }

    // We didn't get anything from the database and there's no id column.
    // Nothing we can do but return an empty array.
    return [];
  }

  jaorm_table() {
    const self = this;

    return self._table;
  }
}

module.exports = Result;
