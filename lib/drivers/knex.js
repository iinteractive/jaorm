const knex = require("knex");

class DriverKnex {
  constructor(db_connection_options) {
    const self = this;
    self.knex = knex(db_connection_options);

    return self;
  }

  raw(stmt, options) {
    const self = this;

    return self.knex.raw(stmt, options);
  }

  base_query(table_name) {
    const self = this;
    return self.knex(table_name);
  }

  obtain_transaction() {
    const self = this;

    const txn = f => self.knex.transaction(f);
    return txn;
  }

  async all({
    table,
    attributes = {},
    schema,
    relations = [],
    driver_options = {},
    query_options = {}
  }) {
    const self = this;

    const tables_to_fetch_columns_for = [[table, table]];
    let query = self.base_query(table);
    for (const [attr_name, attr_value] of Object.entries(attributes)) {
      if (typeof attr_value === "object" && attr_value !== null) {
        const [where_type, where_value] = Object.entries(attr_value)[0];
        switch (where_type) {
          case "like":
          case "<":
          case "<=":
          case ">":
          case ">=":
            query = query.where(attr_name, where_type, where_value);
            break;
          case "in":
            if (!Array.isArray(where_value)) {
              throw new Error("'in' requires an array");
            }
            query = query.whereIn(attr_name, where_value);
            break;
          case "not in":
            if (!Array.isArray(where_value)) {
              throw new Error("'in' requires an array");
            }
            query = query.whereNotIn(attr_name, where_value);
            break;
          case "!=":
            query = query.whereNot(attr_name, where_value);
            break;
          case "raw":
            query = query.whereRaw(where_value);
            break;
          default:
            throw new Error(`Unsupported where type ${where_type}`);
        }
      } else {
        query = query.where(attr_name, attr_value);
      }
    }

    for (const related_table_entries of Object.values(relations)) {
      for (const [relation_name, relation_config] of Object.entries(
        related_table_entries
      )) {
        const foreign_relation_parts = relation_config.foreign
          .split(".")
          .map(p => self._format_identifier(p));
        foreign_relation_parts[0] = self._format_identifier(relation_name);
        const foreign_relation = foreign_relation_parts.join(".");

        const local_relation = relation_config.local
          .split(".")
          .map(p => self._format_identifier(p))
          .join(".");
        query = query.joinRaw(
          `LEFT JOIN ${self._format_identifier(
            relation_config.table
          )} AS ${self._format_identifier(
            relation_name
          )} ON ${foreign_relation} = ${local_relation}`
        );
        tables_to_fetch_columns_for.push([
          relation_config.table,
          relation_name
        ]);
      }
    }

    if (query_options.limit) {
      query = query.limit(query_options.limit);
    }

    if (query_options.count) {
      query = query.count();
    } else {
      const returning = await self._columns_to_fetch(
        tables_to_fetch_columns_for
      );
      query = query.columns(self._format_columns_for_fetch(returning));
    }

    // We do everything in a transaction, either inherited or generated
    if (driver_options && driver_options.transaction) {
      return await self._execute_select(query, driver_options.transaction);
    }

    const txn = self.obtain_transaction();
    return await txn(async trx => await self._execute_select(query, trx));
  }

  async count({ table, attributes, schema, relations, driver_options }) {
    const self = this;

    const result = await self.all({
      table,
      attributes,
      relations,
      driver_options,
      query_options: { count: true }
    });

    return self._parse_count(result);
  }

  async first({ table, attributes, schema, relations, driver_options }) {
    const self = this;

    const result = await self.all({
      table,
      attributes,
      relations,
      driver_options,
      query_options: { limit: 1 }
    });
    return result[0] || null;
  }

  async create({ table, attributes, schema, relations, driver_options }) {
    const self = this;

    // We do everything in a transaction, either inherited or generated
    if (driver_options && driver_options.transaction) {
      return await self._execute_insert(
        table,
        attributes,
        driver_options.transaction
      );
    }

    const txn = self.obtain_transaction();
    return await txn(
      async trx => await self._execute_insert(table, attributes, trx)
    );
  }

  async update({ table, attributes, new_attributes, schema, driver_options }) {
    const self = this;

    // We do everything in a transaction, either inherited or generated
    if (driver_options && driver_options.transaction) {
      return await self._execute_update(
        table,
        attributes,
        new_attributes,
        driver_options.transaction
      );
    }

    const txn = self.obtain_transaction();
    return await txn(
      async trx =>
        await self._execute_update(table, attributes, new_attributes, trx)
    );
  }

  async destroy({ table, attributes, schema, driver_options }) {
    const self = this;

    // We do everything in a transaction, either inherited or generated
    if (driver_options && driver_options.transaction) {
      return await self._execute_destroy(
        table,
        attributes,
        driver_options.transaction
      );
    }

    const txn = self.obtain_transaction();
    return await txn(
      async trx => await self._execute_destroy(table, attributes, trx)
    );
  }

  async list_tables() {
    const self = this;
    let query = null;
    let bindings = [];

    const client_type = self.knex.client.constructor.name;

    switch (client_type) {
      //      case "Client_MSSQL":
      //        (query =
      //          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_catalog = ?"),
      //          (bindings = [self.knex.client.database()]);
      //        break;
      case "Client_MySQL":
      case "Client_MySQL2":
        query =
          "SELECT table_name FROM information_schema.tables WHERE table_schema = ?";
        bindings = [self.knex.client.database()];
        break;
      //      case "Client_Oracle":
      //      case "Client_Oracledb":
      //        query = "SELECT table_name FROM user_tables";
      //        break;
      case "Client_PG":
        query =
          "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_catalog = ?";
        bindings = [self.knex.client.database()];
        break;
      case "Client_SQLite3":
        query =
          "SELECT name AS table_name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'";
        break;
      default:
        throw new Error("Invalid client type");
    }

    const results = await self.knex.raw(query, bindings);
    switch (client_type) {
      case "Client_MySQL":
      case "Client_MySQL2":
        return results[0].map(row => row.table_name);
      case "Client_PG":
        return results.rows.map(row => row.table_name);
      case "Client_SQLite3":
      default:
        return results.map(row => row.table_name);
    }
  }

  async list_columns(table, trx) {
    const self = this;

    if (trx) {
      return await self
        .knex(table)
        .columnInfo()
        .transacting(trx);
    }
    return await self.knex(table).columnInfo();
  }

  async get_pks() {
    const self = this;

    let primary_keys = [];
    const processed_list = {};
    const client_type = self.knex.client.constructor.name;

    switch (client_type) {
      case "Client_MySQL":
      case "Client_MySQL2":
        const [mysql_pks] = await self.knex.raw(
          "SELECT t.table_name, k.column_name FROM information_schema.table_constraints t LEFT JOIN information_schema.key_column_usage k USING (constraint_name, table_schema, table_name) WHERE t.constraint_type = 'PRIMARY KEY' AND t.table_schema=DATABASE();"
        );
        primary_keys = mysql_pks.map(pk => ({
          table_name: pk.table_name,
          column: pk.column_name
        }));
        break;
      case "Client_PG":
        const pg_pks = await self.knex.raw(
          "SELECT t.table_name, k.column_name FROM information_schema.table_constraints t LEFT JOIN information_schema.key_column_usage k USING (constraint_name, table_schema, table_name) WHERE t.constraint_type = 'PRIMARY KEY'"
        );
        primary_keys = pg_pks.rows.map(pk => ({
          table_name: pk.table_name,
          column: pk.column_name
        }));
        break;
      case "Client_SQLite3":
        const sqlite_tables = await self.list_tables();
        for (const tbl of sqlite_tables) {
          const sqlite_columns = await self.knex.raw(
            `PRAGMA table_info(${tbl});`
          );
          for (const col of sqlite_columns) {
            if (col.pk) {
              primary_keys.push({ table_name: tbl, column: col.name });
            }
          }
        }
        break;
      default:
        throw new Error("Invalid client type");
    }

    for (const pk of primary_keys) {
      if (processed_list[pk.table_name] === undefined) {
        processed_list[pk.table_name] = [pk.column];
      } else {
        processed_list[pk.table_name].push(pk.column);
      }
    }
    return processed_list;
  }

  async _columns_to_fetch(tables, trx) {
    const self = this;
    const columns = [];
    for (const entry of tables) {
      const [table, alias] = entry;
      const cols = await self.list_columns(table, trx);
      for (const col of Object.keys(cols)) {
        columns.push(`${alias}.${col}`);
      }
    }
    return columns;
  }

  _format_columns_for_fetch(columns) {
    // eslint-disable-next-line no-unused-vars
    const self = this;

    const column_aliases = {};
    for (const column of columns) {
      const alias = column.replace(".", ":");
      column_aliases[alias] = column;
    }

    return column_aliases;
  }

  _parse_count(result) {
    const self = this;

    switch (self.knex.client.constructor.name) {
      case "Client_PG":
        return parseInt(result[0].count, 10);
      default:
        return result[0]["count(*)"];
    }
  }

  async _execute_select(query, trx) {
    // eslint-disable-next-line no-unused-vars
    const self = this;

    return await query.select().transacting(trx);
  }

  async _execute_insert(table, attributes, trx) {
    const self = this;
    const insert_query = self.base_query(table);
    let select_query = self.base_query(table);
    const count_query = self
      .base_query(table)
      .transacting(trx)
      .count();

    // Get the existing count, since we can't rely on knex.insert or .returning to be useful everywhere
    // We're in a transaction though, so just counting is Good Enough™
    const count_result = await count_query.select();
    const offset = self._parse_count(count_result);

    const returning = await self._columns_to_fetch([[table, table]], trx);
    select_query = select_query.columns(
      self._format_columns_for_fetch(returning)
    );
    select_query = select_query.limit(1);

    await insert_query.transacting(trx).insert(attributes);
    select_query = select_query.offset(offset);

    const retval = await self._execute_select(select_query, trx);
    return retval;
  }

  async _execute_update(table, attributes, new_attributes, trx) {
    const self = this;

    const update_query = self.base_query(table);
    await update_query
      .transacting(trx)
      .where(attributes)
      .update(new_attributes);

    let select_query = self.base_query(table);
    const returning = await self._columns_to_fetch([[table, table]], trx);
    select_query = select_query.columns(
      self._format_columns_for_fetch(returning)
    );

    const merged_attributes = { ...attributes, ...new_attributes };
    select_query = select_query.where(merged_attributes);

    return await self._execute_select(select_query, trx);
  }

  async _execute_destroy(table, attributes, trx) {
    const self = this;

    const delete_query = self.base_query(table);

    return await delete_query
      .transacting(trx)
      .where(attributes)
      .del();
  }

  // Postgres loves its quotes
  _format_identifier(str) {
    const self = this;

    const client_type = self.knex.client.constructor.name;
    switch (client_type) {
      case "Client_PG":
        return `"${str}"`;
      default:
        return str;
    }
  }
}

module.exports = DriverKnex;
