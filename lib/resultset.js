/* Base ResultSet class. Subclass it as needed. */

class ResultSet {
  constructor(schema, table, column_info, defined_relations) {
    const self = this;

    if (!schema) {
      throw new Error("ResultSet requires the schema object");
    }
    if (!table) {
      throw new Error("ResultSet objects require a table name");
    }

    self._table = table;
    self._schema = schema;
    self._column_info = column_info;
    self._defined_relations = defined_relations;

    self._attributes = {};
    self._relations = {};
    self._driver_options = {};
    self._results = [];

    return self;
  }

  _new_self() {
    const self = this;

    const copy = Object.create(self);
    return copy;
  }

  driver_arguments() {
    const self = this;
    return {
      table: self._table,
      attributes: self._attributes,
      schema: self._schema,
      relations: self._relations,
      driver_options: self._driver_options
    };
  }

  relations() {
    const self = this;
    return self._relations;
  }

  defined_relations() {
    const self = this;
    return self._schema.relations[self._table];
  }

  clear() {
    const self = this;

    self._attributes = {};
    self._relations = {};
    self._driver_options = {};
    self._results = [];

    return self;
  }

  static manual_relations() {
    return {};
  }

  inflate(values) {
    const self = this;

    const result = new self._schema.results[self._table](
      self._schema,
      self._table,
      self._column_info,
      values
    );
    result.initialize();
    return result;
  }

  // Set query parameters ahead of time
  where(attributes, driver_options) {
    const self = this;
    const new_rs = self._new_self();
    new_rs._process_arguments(new_rs, attributes, driver_options);
    return new_rs;
  }

  // Add relations
  with(relations, driver_options) {
    const self = this;
    const new_rs = self._new_self();
    if (new_rs._process_relations(new_rs, relations, driver_options)) {
      return new_rs;
    }
    throw new Error("Invalid argument to with().");
  }

  // READ OPERATIONS

  async all(transaction) {
    const self = this;

    // If we're in a transaction, re-dispatch
    if (transaction) {
      const new_rs = self._new_self();
      new_rs._process_driver_options(new_rs, { transaction });
      return new_rs.all();
    }

    const results = [];

    const raw_results = await self._schema.driver.all(self.driver_arguments());
    const grouped_results = self._group_results(raw_results);

    for (const result of grouped_results) {
      const inflated = self.inflate(result);
      results.push(inflated);
    }

    if (self._schema.cache_results === true) {
      self._results = results;
    }
    return results;
  }

  results() {
    const self = this;
    return self._results;
  }

  to_objects() {
    const self = this;
    const objects = self._results.map(r => r.to_object());
    return objects;
  }

  async count(transaction) {
    const self = this;

    // If we're in a transaction, re-dispatch
    if (transaction) {
      const new_rs = self._new_self();
      new_rs._process_driver_options(new_rs, { transaction });
      return new_rs.count();
    }

    return await self._schema.driver.count(self.driver_arguments());
  }

  async first(transaction) {
    const self = this;

    // If we're in a transaction, re-dispatch
    if (transaction) {
      const new_rs = self._new_self();
      new_rs._process_driver_options(new_rs, { transaction });
      return new_rs.first();
    }

    const raw_result = await self._schema.driver.first(self.driver_arguments());
    if (raw_result === null) {
      return null;
    }

    const results = self._group_results([raw_result]);
    const result = self.inflate(results[0]);

    if (self._schema.cache_results === true) {
      self._results = [result];
    }
    return result;
  }

  async one(transaction) {
    const self = this;

    // If we're in a transaction, re-dispatch
    if (transaction) {
      const new_rs = self._new_self();
      new_rs._process_driver_options(new_rs, { transaction });
      return new_rs.one();
    }

    const raw_results = await self._schema.driver.all(self.driver_arguments());

    if (raw_results.length !== 1) {
      if (raw_results.length === 0) {
        return null;
      }
      throw new Error(
        `A call to one() for ${self._table} yielded multiple results.`
      );
    }

    const results = self._group_results([raw_results[0]]);
    const result = self.inflate(results[0]);

    if (self._schema.cache_results === true) {
      self._results = [result];
    }
    return result;
  }

  async only_one(transaction) {
    const self = this;

    // If we're in a transaction, re-dispatch
    if (transaction) {
      const new_rs = self._new_self();
      new_rs._process_driver_options(new_rs, { transaction });
      return new_rs.only_one();
    }

    const raw_results = await self._schema.driver.all(self.driver_arguments());

    if (raw_results.length !== 1) {
      if (raw_results.length === 0) {
        throw new Error(
          `A call to only_one() for ${self._table} yielded no result.`
        );
      }
      throw new Error(
        `A call to only_one() for ${self._table} yielded multiple results.`
      );
    }

    const results = self._group_results([raw_results[0]]);
    const result = self.inflate(results[0]);

    if (self._schema.cache_results === true) {
      self._results = [result];
    }
    return result;
  }

  async none(transaction) {
    const self = this;

    // If we're in a transaction, re-dispatch
    if (transaction) {
      const new_rs = self._new_self();
      new_rs._process_driver_options(new_rs, { transaction });
      return new_rs.none();
    }

    const raw_result = await self._schema.driver.first(self.driver_arguments());

    if (raw_result === null) {
      return null;
    }

    throw new Error(`A call to none() for ${self._table} yielded results.`);
  }

  properties() {
    const self = this;
    return {
      attributes: self._attributes,
      driver_options: self._driver_options
    };
  }

  // WRITE OPERATIONS
  async create(attributes, driver_options) {
    const self = this;
    self._process_arguments(self, attributes, driver_options);

    const raw_results = await self._schema.driver.create(
      self.driver_arguments()
    );
    const [result] = self._group_results(raw_results);
    return self.inflate(result);
  }

  async update_all(new_attributes, driver_options) {
    const self = this;
    self._process_arguments(self, undefined, driver_options);

    const options = self.driver_arguments();
    options.new_attributes = new_attributes;
    const raw_results = await self._schema.driver.update(options);

    const grouped_results = self._group_results(raw_results);

    const results = [];
    for (const result of grouped_results) {
      const inflated = self.inflate(result);
      results.push(inflated);
    }

    if (self._schema.cache_results === true) {
      self._results = results;
    }
    return results;
  }

  async destroy_all(attributes, driver_options) {
    const self = this;
    self._process_arguments(self, undefined, driver_options);

    const options = self.driver_arguments();
    options.attributes = attributes;
    await self._schema.driver.destroy(options);

    return null;
  }

  // method helpers

  // This method is used to prep the new Resultset we return for method chaining.
  // This means we use a lot of "no-param-reassign" eslint disabling here.
  // This is expected and fine.
  _process_arguments(rs, attributes, driver_options) {
    const self = this;
    self._schema.log.trace(
      `_process_arguments called with attributes: ${self._schema.serialize(
        attributes
      )}`
    );

    if (attributes !== undefined) {
      if (attributes === null) {
        // eslint-disable-next-line no-param-reassign
        rs._attributes = {};
      } else {
        for (const attr_key of Object.keys(attributes)) {
          if (attributes[attr_key] === undefined) {
            // eslint-disable-next-line no-param-reassign
            delete rs._attributes[attr_key];
          } else if (typeof attributes[attr_key] === "boolean") {
            // eslint-disable-next-line no-param-reassign
            rs._attributes[attr_key] = attributes[attr_key] ? 1 : 0;
          } else if (
            typeof attributes[attr_key] === "object" &&
            attributes[attr_key] !== null
          ) {
            if (self._schema.serialize_objects === true) {
              rs._attributes[attr_key] = self._schema.serialize(
                attributes[attr_key]
              );
            } else {
              throw new Error(
                `The value for "${attr_key}" is an object, and serialization is turned off.`
              );
            }
          } else {
            // eslint-disable-next-line no-param-reassign
            rs._attributes[attr_key] = attributes[attr_key];
          }
        }
      }
    }

    return self._process_driver_options(rs, driver_options);
  }

  _process_relations(rs, relations, driver_options) {
    const self = this;
    self._schema.log.trace(
      `_process_relations() called with relations: ${self._schema.serialize(
        relations
      )}`
    );

    if (relations === undefined || relations === null) {
      // eslint-disable-next-line no-param-reassign
      rs._relations = {};
      return true;
    }

    if (!Array.isArray(relations)) {
      return false;
    }

    if (relations.length === 0) {
      // eslint-disable-next-line no-param-reassign
      rs._relations = {};
      return true;
    }

    for (const rel of relations) {
      if (rs._valid_relation(rs._table, rel) === false) {
        throw new Error(
          `Relation ${rel} is not defined for resultset ${rs._table}.`
        );
      }
      const relation_chain = rel.split(":");
      relation_chain.unshift(rs._table);
      relation_chain.forEach((relation, chain_index) => {
        if (chain_index < relation_chain.length - 1) {
          const origin = relation_chain[chain_index];
          const foreign = relation_chain[chain_index + 1];
          if (rs._relations[origin] === undefined) {
            // eslint-disable-next-line no-param-reassign
            rs._relations[origin] = {};
          }
          // eslint-disable-next-line no-param-reassign
          rs._relations[origin][foreign] =
            rs._schema.relations[origin][foreign];
        }
      });
    }

    return self._process_driver_options(rs, driver_options);
  }

  _valid_relation(origin, rel) {
    const self = this;

    const { relations } = self._schema;

    // A defined relation, so we can stop
    if (
      relations[origin] !== undefined &&
      relations[origin][rel] !== undefined
    ) {
      return true;
    }

    // Look for the : syntax indicating a chain of relations, and if it's not
    // there, kick out
    const separator_index = rel.indexOf(":");
    if (separator_index === -1) {
      return false;
    }

    // We have the :, so take everything after the first one and re-pass it, in case
    // it goes a few levels deep.
    return self._valid_relation(
      rel.substring(0, separator_index),
      rel.substring(separator_index + 1)
    );
  }

  _process_driver_options(rs, driver_options) {
    const self = this;
    self._schema.log.trace(
      `_process_driver_options() called with options: ${self._schema.serialize(
        driver_options
      )}`
    );

    if (driver_options !== undefined) {
      if (driver_options === null) {
        // eslint-disable-next-line no-param-reassign
        rs._driver_options = {};
      } else {
        for (const driver_opt_key of Object.keys(driver_options)) {
          if (driver_options[driver_opt_key] === undefined) {
            // eslint-disable-next-line no-param-reassign
            delete rs._driver_options[driver_opt_key];
          } else {
            // eslint-disable-next-line no-param-reassign
            rs._driver_options[driver_opt_key] = driver_options[driver_opt_key];
          }
        }
      }
    }
    return true;
  }

  _group_results(raw_results) {
    const self = this;
    self._schema.log.trace(`Grouping objects`);
    const result_list = {};

    for (const res of raw_results) {
      const current_result = {};
      const current_relations = {};
      self._schema.log.trace(`${self._schema.serialize(res, null, 2)}`);
      for (const [key, value] of Object.entries(res)) {
        const [relation, field] = key.split(":");
        if (relation === self._table) {
          current_result[field] = value;
        } else {
          if (current_relations[relation] === undefined) {
            current_relations[relation] = {};
          }
          current_relations[relation][field] = value;
        }
      }
      const current_result_key = self._schema.serialize(current_result);
      if (result_list[current_result_key] === undefined) {
        result_list[current_result_key] = {};
      }
      for (const [cr_key, cr_value] of Object.entries(current_relations)) {
        if (result_list[current_result_key][cr_key] === undefined) {
          result_list[current_result_key][cr_key] = {};
        }
        const cr_relation_key = self._schema.serialize(cr_value);
        result_list[current_result_key][cr_key][cr_relation_key] = true;
      }
    }

    const results = [];
    // The keys of this are the top level elements
    for (const [element, relations] of Object.entries(result_list)) {
      const new_result = JSON.parse(element);
      for (const relation_name of Object.keys(relations)) {
        new_result[relation_name] = [];
        for (const related_element of Object.keys(
          result_list[element][relation_name]
        )) {
          new_result[relation_name].push(JSON.parse(related_element));
        }
      }
      results.push(new_result);
    }
    return results;
  }
}

module.exports = ResultSet;
