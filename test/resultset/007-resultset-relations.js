const Schema = require("../../lib/schema");

describe("Test resultset relations by making sure that we", function test_resultset_relations() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;

  before("instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("get a blank relations list if we pass in nothing", () => {
    const user_rs = schema.rs("user").with();
    assert.deepEqual(
      user_rs.relations(),
      {},
      "Got a blank set of relations when passing in undef"
    );
  });

  it("get a blank relations list if we pass in null", () => {
    const user_rs = schema.rs("user").with(null);
    assert.deepEqual(
      user_rs.relations(),
      {},
      "Got a blank set of relations when passing in undef"
    );
  });

  it("get a blank relations list if we pass in an empty array", () => {
    const user_rs = schema.rs("user").with([]);
    assert.deepEqual(
      user_rs.relations(),
      {},
      "Got a blank set of relations when passing in an empty array"
    );
  });

  it("throw an exception if we pass in a defined value that isn't an array", () => {
    try {
      const user_rs = schema.rs("user").with("kid tested, mother approved");
      throw new Error("We didn't fail passing in a pure string to with()");
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: Invalid argument to with().",
        "with() failed properly with an invalid argument"
      );
    }
  });

  it("throw an exception if we pass in an invalid relation", () => {
    try {
      const user_rs = schema.rs("user").with(["banned_ips"]);
      throw new Error(
        "We didn't fail passing in an invalid relation to with()"
      );
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: Relation banned_ips is not defined for resultset user.",
        "with() failed properly with an invalid relation"
      );
    }
  });

  it("can use the singular relation accessor", async () => {
    const fred = await schema
      .rs("user")
      .where({ username: "fred" })
      .first();
    const role_rs = schema.rs("role");
    const free_users = await role_rs
      .where({ name: "Free User" })
      .with(["user_role:user"])
      .first();
    assert.deepEqual(
      free_users.user().to_object(),
      fred.to_object(),
      "We get the proper object from the singular accessor"
    );
  });

  it("can use the plural relation accessor", async () => {
    const fred = await schema
      .rs("user")
      .where({ username: "fred" })
      .first();
    const jimmy = await schema
      .rs("user")
      .where({ username: "jimmy" })
      .first();
    const role_rs = schema
      .rs("role")
      .where({ name: "Free User" })
      .with(["user_role:user"]);
    const free_users = await role_rs.all();
    assert.strictEqual(
      free_users[0].users()[0].username(),
      fred.username(),
      "We get the proper objects from the plural accessor"
    );
    assert.strictEqual(
      free_users[0].users()[1].username(),
      jimmy.username(),
      "We get the proper objects from the plural accessor"
    );
  });
});
