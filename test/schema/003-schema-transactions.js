const Schema = require("../../lib/schema");

describe("Test the schema object's transaction functionality by making sure that", function test_schema_transactions() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("a transaction returns the proper thing", async () => {
    let numero = 1;
    const user_rs = schema.rs("user");

    await schema.transaction(async transaction => {
      numero = await user_rs.count(undefined, { transaction });
      return true;
    });

    assert.strictEqual(
      numero,
      fixtures.table_data.user.length,
      "numero was set to the correct value in the block"
    );
  });

  it("a transaction doesn't return the proper thing if it throws", async () => {
    let numero = 1;
    const user_rs = schema.rs("user");

    await schema.transaction(async transaction => {
      throw new Error("Did I leave the stove on?");
      // eslint-disable-next-line no-unreachable
      numero = await user_rs.count(undefined, { transaction });
    });

    assert.strictEqual(
      numero,
      1,
      "numero wasn't set because the transaction bailed out"
    );
  });

  it("a transaction returns the proper thing if set directly", async () => {
    let numero = 1;
    const user_rs = schema.rs("user");

    numero = await schema.transaction(
      async transaction => await user_rs.count(undefined, { transaction })
    );

    assert.strictEqual(
      numero,
      fixtures.table_data.user.length,
      "numero was set to the correct value directly"
    );
  });

  it("a transaction rolls back a creation properly", async () => {
    const role_rs = schema.rs("role");
    const role_count = await role_rs.count();

    await schema.transaction(async trx => {
      await role_rs.create(
        { name: "Ultimate Administrator" },
        { transaction: trx }
      );
      throw new Error("That's a ridiculous name. Have some dignity, people.");
    });

    role_rs.clear();
    const new_role_count = await role_rs.count();
    assert.strictEqual(
      role_count,
      new_role_count,
      "The new role got rolled back"
    );
  });

  it("a transaction rolls back an update properly", async () => {
    const role_rs = schema.rs("role");
    const role_count = await role_rs.where({ name: "Free User" }).count();

    await schema.transaction(async trx => {
      await role_rs
        .where({ name: "Free User" })
        .update_all({ name: "Ultimate Administrator" }, { transaction: trx });
      throw new Error("That's a ridiculous name. Have some dignity, people.");
    });

    role_rs.clear();
    const new_role_count = await role_rs.where({ name: "Free User" }).count();
    assert.strictEqual(
      role_count,
      new_role_count,
      "The new role got rolled back"
    );
  });

  it("a transaction rolls back a destroy properly", async () => {
    const role_rs = schema.rs("role");
    const role_count = await role_rs.where({ name: "Free User" }).count();

    await schema.transaction(async trx => {
      await role_rs.destroy_all({ name: "Free User" }, { transaction: trx });
      throw new Error("Don't get rid of the free tier!");
    });

    role_rs.clear();
    const new_role_count = await role_rs.where({ name: "Free User" }).count();
    assert.strictEqual(
      role_count,
      new_role_count,
      "The free tier got put back"
    );
  });
});
