/* The Schema object. This should never be subclassed. */

const pluralize = require("pluralize");
const stringify = require("json-stringify-safe");

const Logger = require("./logging.js");
const Result = require("./result.js");
const ResultSet = require("./resultset.js");

class Schema {
  constructor(db_connection_options, schema_options = {}, mapping = {}) {
    const self = this;

    self.client = db_connection_options.client;
    self.driver_type = schema_options.driver_type || "knex";
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const DriverClass = require(`./drivers/${self.driver_type}.js`);
      self.driver = new DriverClass(db_connection_options);
    } catch (err) {
      throw new Error(
        `Failed to load driver of type ${self.driver_type}: ${err}`
      );
    }
    self.column_info = {};
    self.relations = {};
    self.cache_results = schema_options.cache_results || false;
    self.result_dir = schema_options.result_dir || "lib/jaorm/result";
    self.resultset_dir = schema_options.resultset_dir || "lib/jaorm/resultset";

    self.serialize = stringify;
    self.log = new Logger(schema_options.logging_level);

    self.results = {};
    self.resultsets = {};

    return self;
  }

  async initialize() {
    const self = this;

    self.log.trace("Initializing schema");

    let tables = [];
    try {
      tables = await self.driver.list_tables();
    } catch (err) {
      throw new Error("unable to retrieve table information");
    }

    const manual_relations = {};

    self.pks = await self.get_pks();

    for (const table of tables) {
      const column_info = await self.list_columns(table);
      self.column_info[table] = column_info;

      // Speculatively load a custom result class
      try {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const custom_result_class = require(`${process.cwd()}/${
          self.result_dir
        }/${table}.js`);
        self.results[table] = custom_result_class;
      } catch (err) {
        // No worries if we failed; just use the default template
        self.results[table] = Result;
      }

      // Speculatively load a custom resultset class
      try {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const custom_resultset_class = require(`${process.cwd()}/${
          self.resultset_dir
        }/${table}.js`);
        self.log.trace(`Adding custom resultset object for ${table}`);
        self.resultsets[table] = { class: custom_resultset_class, column_info };
        manual_relations[table] = custom_resultset_class.manual_relations();
        self.log.trace(`Added custom resultset object for ${table}`);
      } catch (err) {
        // No worries if we failed; just use the default template
        self.resultsets[table] = { class: ResultSet, column_info };
      }
    }

    for (const table of tables) {
      self._automatic_relations(table);
      if (manual_relations[table] !== undefined) {
        self.log.trace(`Setting manual relations for ${table}`);
        for (const [relation_name, manual_relation] of Object.entries(
          manual_relations[table]
        )) {
          const foreign_table = manual_relation.table;
          if (self.relations[table] === undefined) {
            self.relations[table] = {};
            self.relations[table][foreign_table] = {};
          }
          if (self.relations[foreign_table] === undefined) {
            self.relations[foreign_table] = {};
          }
          self.relations[table][relation_name] = {
            table: manual_relation.table,
            local: manual_relation.local,
            foreign: manual_relation.foreign,
            has_one: manual_relation.local_has_one,
            has_many: manual_relation.local_has_many
          };

          const foreign_relation_name =
            manual_relation.foreign_has_one || manual_relation.foreign_has_many;
          if (
            foreign_relation_name === undefined ||
            foreign_relation_name === null
          ) {
            throw new Error(
              `The manual relations for ${table} are malformed: you need a defined foreign_has_one or a foreign_has_many`
            );
          }

          self.relations[foreign_table][foreign_relation_name] = {
            table,
            local: manual_relation.foreign,
            foreign: manual_relation.local,
            has_one: manual_relation.foreign_has_one,
            has_many: manual_relation.foreign_has_many
          };
        }
      }
    }
  }

  // Anything that ends in _id gets linked if it can be
  _automatic_relations(table_name) {
    const self = this;

    const id_regexp = new RegExp("_id$");
    const columns = self.column_info[table_name];
    if (self.relations[table_name] === undefined) {
      self.log.trace(`Setting automatic relations for ${table_name}`);
      self.relations[table_name] = {};
    }
    for (const column of Object.keys(columns)) {
      if (id_regexp.test(column)) {
        self.log.trace(
          `Checking automatic relations for ${table_name}.${column}`
        );
        // See if there's something logical to link it to
        const foreign_table_name = column.substring(0, column.length - 3);
        if (self.column_info[foreign_table_name] !== undefined) {
          if (self.relations[foreign_table_name] === undefined) {
            self.relations[foreign_table_name] = {};
          }

          self.log.trace(
            `Adding automatic relation for ${table_name}.${column} -> ${foreign_table_name}.id`
          );

          const local_accessor_names = self._automatic_accessor_names(
            table_name
          );
          const foreign_accessor_names = self._automatic_accessor_names(
            foreign_table_name
          );

          self.relations[table_name][foreign_table_name] = {
            table: foreign_table_name,
            local: `${table_name}.${column}`,
            foreign: `${foreign_table_name}.id`,
            has_one: foreign_accessor_names.singular,
            has_many: foreign_accessor_names.plural
          };

          self.relations[foreign_table_name][table_name] = {
            table: table_name,
            local: `${foreign_table_name}.id`,
            foreign: `${table_name}.${column}`,
            has_one: local_accessor_names.singular,
            has_many: local_accessor_names.plural
          };
        }
      }
    }
  }

  // This is a fairly simplistic approach; we give people the ability to override this,
  // so it doesn't need to be perfect, just a best guess
  _automatic_accessor_names(table_name) {
    const self = this;
    self.log.trace(`generating automatic accessors for ${table_name}`);

    const names = {};

    if (pluralize.isSingular(table_name)) {
      names.singular = table_name;
      names.plural = pluralize.plural(table_name);
    } else {
      names.plural = table_name;
      names.singular = pluralize.singular(table_name);
    }

    // If for whatever reason that didn't work, do the simplest thing possible.
    if (
      names.plural === names.singular ||
      names.plural === undefined ||
      names.singular === undefined
    ) {
      names.singular = table_name;
      names.plural = `${table_name}s`;
    }

    return names;
  }

  resultset(table_name) {
    const self = this;
    const rs_info = self.resultsets[table_name];
    if (rs_info) {
      // eslint-disable-next-line new-cap
      return new rs_info.class(
        self,
        table_name,
        rs_info.column_info,
        self.relations[table_name]
      );
    }
    throw new Error(`No ResultSet for table "${table_name}"`);
  }

  rs(table_name) {
    const self = this;
    return self.resultset(table_name);
  }

  transaction(f) {
    const self = this;

    const txn = self.driver.obtain_transaction();
    return txn(f).catch(err => {
      // eslint-disable-next-line no-unused-expressions
      txn.rollback;
      return false;
    });
  }

  async get_pks() {
    const self = this;
    return await self.driver.get_pks();
  }

  list_pks() {
    const self = this;
    return self.pks;
  }

  async list_columns(table) {
    const self = this;
    return await self.driver.list_columns(table);
  }

  async list_tables() {
    const self = this;
    return await self.driver.list_tables();
  }

  schema_info() {
    const self = this;

    return {
      columns: self.column_info,
      relations: self.relations
    };
  }

  // Sometimes you gotta just chuck some SQL at things
  async raw(query, options) {
    const self = this;

    return await self.driver.raw(query, options);
  }
}

module.exports = Schema;
