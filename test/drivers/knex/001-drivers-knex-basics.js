const Schema = require("../../../lib/schema");

describe("Test the knex driver object by making sure that", function test_knex_driver() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;

  let invalid_db_config = {
    client: "mssql",
    connection: {
      host: "127.0.0.1",
      user: "jaorm_test",
      password: "jaorm_test",
      database: "jaorm"
    }
  };

  before("Instantiate the base object", async () => {
    schema = new Schema(invalid_db_config);
  });

  it("Get an error attempting to list tables", async () => {
    try {
      const tables = await schema.list_tables();
      throw new Error(
        "We should have thrown an exception trying to retrieve table listings on a DB we don't support"
      );
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: Invalid client type",
        "Failed to list tables on an unsupported platform"
      );
    }
  });

  it("Get an error attempting to retrieve primary keys", async () => {
    try {
      const pks = await schema.get_pks();
      throw new Error(
        "We should have thrown an exception trying to retrieve PKs on a DB we don't support"
      );
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: Invalid client type",
        "Failed to get PKs on an unsupported platform"
      );
    }
  });
});
