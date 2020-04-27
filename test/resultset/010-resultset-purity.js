const Schema = require("../../lib/schema");

describe("Test resultset purity by making sure that we", function test_resultset_purity() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("maintain the original ResultSet attributes on a count()", async () => {
    const user_rs = schema.rs("user");
    const full_user_count = await user_rs.count();
    const restricted_user_count = await user_rs.count({ username: "fred" });
    const full_user_count_again = await user_rs.count();
    assert.strictEqual(
      full_user_count,
      full_user_count_again,
      "Resultset was not modified by passing arguments to count()"
    );
    assert.notStrictEqual(
      full_user_count,
      restricted_user_count,
      "count() took arguments properly"
    );
  });

  it("maintain the original ResultSet attributes on an all()", async () => {
    const user_rs = schema.rs("user");
    const full_users = await user_rs.all();
    const restricted_users = await user_rs.all({ username: "fred" });
    const full_users_again = await user_rs.all();
    assert.strictEqual(
      full_users.length,
      full_users_again.length,
      "Resultset was not modified by passing arguments to all()"
    );
    assert.notStrictEqual(
      full_users.length,
      restricted_users.length,
      "all() took arguments properly"
    );
  });

  it("maintain the original ResultSet attributes on a first()", async () => {
    const user_rs = schema.rs("user");
    const first_user = await user_rs.first();
    const first_billy = await user_rs.first({ username: "billy" });
    const first_user_again = await user_rs.first();
    assert.strictEqual(
      first_user.username(),
      first_user_again.username(),
      "Resultset was not modified by passing arguments to first()"
    );
    assert.notStrictEqual(
      first_user.username(),
      first_billy.username(),
      "first() took arguments properly"
    );
  });

  it("maintain the original ResultSet attributes on a one()", async () => {
    const user_rs = schema.rs("user").where({ username: "fred" });
    const fred = await user_rs.one();
    const billy = await user_rs.one({ username: "billy" });
    const fred_again = await user_rs.one();
    assert.strictEqual(
      fred.username(),
      fred_again.username(),
      "Resultset was not modified by passing arguments to one()"
    );
    assert.notStrictEqual(
      fred.username(),
      billy.username(),
      "one() took arguments properly"
    );
  });

  it("maintain the original ResultSet attributes on an only_one()", async () => {
    const user_rs = schema.rs("user").where({ username: "fred" });
    const fred = await user_rs.only_one();
    const billy = await user_rs.only_one({ username: "billy" });
    const fred_again = await user_rs.only_one();
    assert.strictEqual(
      fred.username(),
      fred_again.username(),
      "Resultset was not modified by passing arguments to only_one()"
    );
    assert.notStrictEqual(
      fred.username(),
      billy.username(),
      "only_one() took arguments properly"
    );
  });

  it("maintain the original ResultSet attributes on a none()", async () => {
    const user_rs = schema.rs("user").where({ username: "freddd" });
    const freddd = await user_rs.none();
    try {
      const billy = await user_rs.only_one({ username: "billy" });
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: A call to none() for user yielded results.",
        "none() took arguments properly"
      );
    }
    const freddd_again = await user_rs.none();
    assert.strictEqual(
      freddd,
      freddd_again,
      "Resultset was not modified by passing arguments to none()"
    );
  });

  it("maintain the original ResultSet attributes on write actions", async () => {
    const user_rs = schema.rs("user");
    const joshua_rs = schema.rs("user").where({ username: "joshua" });

    const original_user_count = await user_rs.count();
    const original_joshua_count = await joshua_rs.count();

    await user_rs.create({ username: "joshua", password: "tater_t0ts" });
    const second_user_count = await user_rs.count();
    const second_joshua_count = await joshua_rs.count();

    await joshua_rs.update_all({ username: "joshuaaa" });
    const third_user_count = await user_rs.count();
    const third_joshua_count = await joshua_rs.count();

    await user_rs.destroy_all({ username: "joshuaaa" });
    const fourth_user_count = await user_rs.count();
    const fourth_joshua_count = await joshua_rs.count();

    assert.strictEqual(
      original_user_count + 1,
      second_user_count,
      "ResultSet stayed pure during create()"
    );
    assert.strictEqual(
      original_user_count + 1,
      third_user_count,
      "ResultSet stayed pure during update_all()"
    );
    assert.strictEqual(
      original_user_count,
      fourth_user_count,
      "ResultSet stayed pure during destroy_all()"
    );

    assert.strictEqual(original_joshua_count, 0, "No joshua to start");
    assert.strictEqual(second_joshua_count, 1, "joshua created");
    assert.strictEqual(third_joshua_count, 0, "joshua updated");
    assert.strictEqual(fourth_joshua_count, 0, "joshua deleted");
  });
});
