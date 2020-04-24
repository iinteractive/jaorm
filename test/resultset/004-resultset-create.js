const Schema = require("../../lib/schema");

describe("Test the resultset create() functionality by making sure that we", function test_resultset_create() {
  const { assert, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("get the expected result from a simple creation", async () => {
    const user_rs = schema.rs("user");
    const user_count = await user_rs.count();
    const new_user = await user_rs.create({
      username: "alberto",
      password: "987654321"
    });

    assert.strictEqual(
      new_user.id(),
      user_count + 1,
      "Got the new user we expected, with the next id in sequence"
    );
    assert.strictEqual(
      new_user.username(),
      "alberto",
      "Got the new user we expected, with the passed in username"
    );
    assert.strictEqual(
      new_user.password(),
      "987654321",
      "Got the new user we expected, with the awful password they submitted"
    );
    assert.isDefined(
      new_user.date_created(),
      "Got the new user we expected, with a creation date"
    );
  });

  it("get the expected result from a simple creation", async () => {
    const role_rs = schema.rs("role");
    const role_count = await role_rs.count();
    const new_role = await role_rs.create({ name: "Trial Account" });

    // Greater than because of a race with other tests that do deletions/transactions
    assert.isAbove(
      new_role.id(),
      role_count,
      "Got the new role we expected, with a higher id in sequence"
    );
    assert.strictEqual(
      new_role.name(),
      "Trial Account",
      "Got the new role we expected, with the passed in name"
    );
    assert.isDefined(
      new_role.date_created(),
      "Got the new role we expected, with a creation date"
    );
  });

  it("get the expected result from a simple creation", async () => {
    const user_role_rs = schema.rs("user_role");
    const num_user_roles = await user_role_rs.count();
    const new_user_role = await user_role_rs.create({ user_id: 1, role_id: 2 });

    // Clear any attributes, since the creation params are still there
    user_role_rs.clear();
    const new_num_user_roles = await user_role_rs.count();

    assert.strictEqual(
      num_user_roles + 1,
      new_num_user_roles,
      "One more user_role object"
    );
    assert.strictEqual(
      new_user_role.user_id(),
      1,
      "New user_role object has the correct user_id"
    );
    assert.strictEqual(
      new_user_role.role_id(),
      2,
      "New user_role object has the correct role_id"
    );
    assert.isDefined(
      new_user_role.date_created(),
      "New user_role object has a creation date"
    );
  });
});
