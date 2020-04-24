const Schema = require("../../lib/schema");

describe("Test the baseline schema object by making sure that", function test_schema_load() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("Create a schema with default settings", () => {
    const default_schema = new Schema(test_db_config);
    assert.strictEqual(default_schema.result_dir, "lib/jaorm/result");
    assert.strictEqual(default_schema.resultset_dir, "lib/jaorm/resultset");
  });

  it("we fail to create a schema with an invalid log level setting", () => {
    try {
      const bad_schema = new Schema(test_db_config, { logging_level: "plaid" });
      throw new Error("The schema instantiated even with an invalid log level");
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        'Error: Log level "plaid" is invalid.',
        "Got the correct error for invalid log level"
      );
    }
  });

  it.skip("we fail to create a schema with an invalid driver", () => {
    try {
      const bad_schema = new Schema(test_db_config, {
        driver_type: "hibernate"
      });
      throw new Error("The schema instantiated even with an invalid driver");
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: Failed to load driver of type hibernate: Error: Cannot find module './drivers/hibernate.js'",
        "Got the correct error for invalid driver"
      );
    }
  });

  it("we get the correct number of tables", async () => {
    const table_list = await schema.list_tables();
    assert.strictEqual(
      table_list.length,
      Object.keys(fixtures.table_data).length,
      "Same number of tables in the fixtures as in the test db"
    );
  });

  it("we get the correct column info ", async () => {
    const message_columns = await schema.list_columns("message");
    const column_names = Object.keys(message_columns);
    assert.strictEqual(
      column_names.includes("sender_id"),
      true,
      "Found the sender_id column"
    );
    assert.strictEqual(
      column_names.includes("recipient_id"),
      true,
      "Found the recipient_id column"
    );
    assert.strictEqual(
      column_names.includes("read"),
      true,
      "Found the read column"
    );
    assert.strictEqual(
      column_names.includes("message"),
      true,
      "Found the message column"
    );
    assert.strictEqual(
      column_names.includes("date_created"),
      true,
      "Found the date_created column"
    );
  });

  it("trying to get an invalid resultset throws", () => {
    try {
      schema.rs("garbage");
      throw new Error("That call should not have succeeded!");
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        'Error: No ResultSet for table "garbage"',
        "Got the correct error message"
      );
    }
  });

  it("trying to get a valid default-style resultset gives you the resultset", () => {
    const meta_rs = schema.rs("meta");
    assert.strictEqual(meta_rs._table, "meta", "Got the meta ResultSet");
    assert.strictEqual(
      meta_rs.constructor.name,
      "ResultSet",
      "The meta table uses the default ResultSet class"
    );
  });

  it("trying to get a custom resultset gives you the custom one", () => {
    const message_rs = schema.rs("message");
    assert.strictEqual(
      message_rs._table,
      "message",
      "Got the message ResultSet"
    );
    assert.strictEqual(
      message_rs.constructor.name,
      "MessageResultSet",
      "Uses the custom ResultSet class"
    );
    assert.strictEqual(
      message_rs.custom_method(),
      'This is a custom method on the ResultSet for "message"',
      "Got the custom method's text"
    );
  });

  it("we get a proper response from a raw call", async () => {
    // The format of the results changes wildly based on the specific driver,
    // so as long as this doesn't explode we're okay. Check the results manually
    // if/when you need to make sure that this is working.
    await schema.raw("SELECT 1");
  });
});
