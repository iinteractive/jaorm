/* Run the test suite.
   Depending on environment variables, it will cycle the tests repeatedly
   against all available test databases and data sets.
*/

// eslint-disable-next-line import/no-extraneous-dependencies
const Mocha = require("mocha");
// eslint-disable-next-line import/no-extraneous-dependencies
const chai = require("chai");
// eslint-disable-next-line import/no-extraneous-dependencies
const chalk = require("chalk");
const fs = require("fs");
const knex = require("knex");
// eslint-disable-next-line import/no-extraneous-dependencies
const sqlite3 = require("sqlite3");

const test_fixture_data = JSON.parse(
  fs.readFileSync("test/fixtures/table_data.json")
);

const sqlite_test_db_configuration = {
  // debug: true,
  client: "sqlite3",
  connection: {},
  useNullAsDefault: true
};

const mysql_test_db_configuration = {
  // debug: true,
  client: "mysql",
  connection: {
    host: "127.0.0.1",
    user: "jaorm_test",
    password: "jaorm_test",
    database: "jaorm"
  }
};

const mysql2_test_db_configuration = {
  // debug: true,
  client: "mysql2",
  connection: {
    host: "127.0.0.1",
    user: "jaorm_test",
    password: "jaorm_test",
    database: "jaorm"
  }
};

const pg_test_db_configuration = {
  // debug: true,
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "jaorm_test",
    password: "jaorm_test",
    database: "jaorm"
  }
};

let db_type = "sqlite";

async function run_tests(options) {
  Object.defineProperty(Mocha.Suite.prototype, "db_type", {
    get() {
      return db_type;
    },
    set() {}
  });

  Object.defineProperty(Mocha.Suite.prototype, "assert", {
    get() {
      return chai.assert;
    },
    set() {}
  });

  Object.defineProperty(Mocha.Suite.prototype, "fixtures", {
    get() {
      return test_fixture_data;
    },
    set() {}
  });

  Object.defineProperty(Mocha.Suite.prototype, "schema_options", {
    get() {
      return {
        logging_level: "error",
        result_dir: "test/lib/result",
        resultset_dir: "test/lib/resultset"
      };
    },
    set() {}
  });

  Object.defineProperty(Mocha.Suite.prototype, "test_db_config", {
    get() {
      switch (db_type) {
        case "mysql":
        case "mysql2":
          return mysql_test_db_configuration;
        case "pg":
          return pg_test_db_configuration;
        case "sqlite":
        default:
          return sqlite_test_db_configuration;
      }
    },
    set() {}
  });

  const databases_to_test = ["sqlite", "mysql", "mysql2", "pg"];

  // We need a separate mocha instance for each round of this, because it
  // doesn't clear listeners properly.
  const mochas = {};
  let num_failures = 0;
  for (const dbt of databases_to_test) {
    process.stdout.write(`Starting type ${dbt}\n`);
    db_type = dbt;

    const test_timeout = options.timeout || 120000;
    mochas[db_type] = new Mocha({ reporter: "spec", timeout: test_timeout });

    const files = [];
    let test_sections = ["test/schema", "test/resultset", "test/result"];
    if (options.files && options.files.length > 0) {
      test_sections = options.files;
    }
    for (const ts of test_sections) {
      let section_files = Mocha.utils.lookupFiles(ts, ["js"], true);
      if (Array.isArray(section_files) === false) {
        section_files = [section_files];
      }
      Array.prototype.push.apply(files, section_files);
    }

    // Nuke the require cache in case this isn't the first run
    mochas[db_type].files = files;

    const enabled = await _setup_tests(db_type);
    if (enabled === true) {
      process.stdout.write(`Running test suite against DB type '${db_type}'\n`);
      // eslint-disable-next-line no-loop-func
      const failures = await new Promise((resolve, reject) =>
        mochas[db_type].run(resolve)
      );

      // Clear Node's require cache so the next round doesn't think the tests
      // have been run already
      mochas[db_type].unloadFiles();
      num_failures += failures;

      // Do any cleanup that we need to, but only if we passed
      if (num_failures === 0) {
        await _cleanup(db_type);
      }
    } else {
      process.stdout.write(`Skipping DB type '${db_type}'\n`);
    }
  }
  return num_failures;
}

if (require.main === module) {
  const start_time = new Date();
  run_tests({})
    .then(num_failures => {
      const end_time = new Date();
      const elapsed = end_time - start_time;
      if (num_failures === 0) {
        process.stdout.write(
          chalk.cyan("Test results: ") +
            chalk.green("PASS") +
            "\n" +
            chalk.cyan("Duration: ") +
            chalk.green(elapsed) +
            "ms\n"
        );
        process.exit(0);
      } else {
        process.stdout.write(
          chalk.cyan("Test results: ") +
            chalk.red("FAIL") +
            "\n" +
            chalk.cyan("Duration: ") +
            chalk.red(elapsed) +
            "ms\n"
        );
        process.exit(1);
      }
    })
    .catch(err => {
      const end_time = new Date();
      const elapsed = end_time - start_time;
      process.stderr.write(err.stack + "\n\n");
      process.stderr.write(
        chalk.cyan("Test results: ") +
          chalk.magenta("ERROR") +
          "\n" +
          chalk.cyan("Duration: ") +
          chalk.magenta(elapsed) +
          "ms\n"
      );
      process.exit(2);
    });
}

// Generic helpers

// Dispatch
async function _setup_tests(database_type) {
  switch (database_type) {
    case "sqlite":
      return await _setup_sqlite();
    case "mysql":
      return await _setup_mysql();
    case "mysql2":
      return await _setup_mysql2();
    case "pg":
      return await _setup_pg();
    default:
      // Not real sure how we'd get here, but just in case
      throw new Error("Got an invalid db_type to test!");
  }
}

// Clean up afterwards
function _cleanup(database_type) {
  switch (database_type) {
    case "sqlite":
      return _cleanup_sqlite();
    case "mysql":
      return _cleanup_mysql();
    case "mysql2":
      return _cleanup_mysql2();
    case "pg":
      return _cleanup_pg();
    default:
      return true;
  }
}

// Populate the DBs
async function _populate_db(test_db) {
  for (const table_name of test_fixture_data.table_order) {
    const table_db = test_db(table_name);
    for (const row of test_fixture_data.table_data[table_name]) {
      await table_db.insert(row);
    }
  }
}

async function _build_table_creation(options) {
  const { database_type, test_db, drop, quote } = options;

  const quoted = quote || "";

  // Clear out the tables in case this isn't sqlite
  if (drop === true) {
    for (const table_name of test_fixture_data.table_order.slice().reverse()) {
      await test_db.raw(
        `DROP TABLE IF EXISTS ${quoted}${table_name}${quoted};`
      );
    }
  }

  const statements = fs
    .readFileSync(`test/databases/table_creation_${database_type}.sql`)
    .toString()
    .split("\n");
  for (const stmt of statements) {
    if (stmt.length > 0) {
      await test_db.raw(stmt);
    }
  }
  return true;
}

// SQLite helpers
async function _setup_sqlite() {
  const sqlite_db_filename = `jaorm-test-${Date.now()}.db`;
  sqlite_test_db_configuration.connection.filename = sqlite_db_filename;

  // We don't actually use the sqlite db directly, so it's fine that we don't
  // assign it to anything
  // eslint-disable-next-line no-new
  new sqlite3.Database(sqlite_db_filename);
  const test_db = knex(sqlite_test_db_configuration);

  await _build_table_creation({
    database_type: "sqlite",
    test_db
  });
  await _populate_db(test_db);
  return true;
}

function _cleanup_sqlite() {
  const sqlite_filename = sqlite_test_db_configuration.connection.filename;
  if (sqlite_filename) {
    fs.unlinkSync(sqlite_filename);
  }
  return true;
}

// MySQL helpers
async function _setup_mysql() {
  if (!process.env.JAORM_MYSQL_TEST_ENABLED) {
    return false;
  }
  const test_db = knex(mysql_test_db_configuration);

  await _build_table_creation({
    database_type: "mysql",
    drop: true,
    test_db
  });
  await _populate_db(test_db);
  return true;
}

function _cleanup_mysql() {
  return true;
}

// MySQL2 helpers
async function _setup_mysql2() {
  if (!process.env.JAORM_MYSQL2_TEST_ENABLED) {
    return false;
  }
  const test_db = knex(mysql2_test_db_configuration);

  await _build_table_creation({
    database_type: "mysql",
    drop: true,
    test_db
  });
  await _populate_db(test_db);
  return true;
}

function _cleanup_mysql2() {
  return true;
}

// PG helpers
async function _setup_pg() {
  if (!process.env.JAORM_PG_TEST_ENABLED) {
    return false;
  }

  const test_db = knex(pg_test_db_configuration);
  await _build_table_creation({
    database_type: "pg",
    drop: true,
    test_db,
    quote: '"'
  });
  await _populate_db(test_db);
  return true;
}

function _cleanup_pg() {
  return true;
}
