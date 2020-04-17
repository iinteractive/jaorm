const Schema = require("../../lib/schema");

describe("Test the baseline schema object's serialization by making sure that", function test_schema_load() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let json_schema = null;
  let no_json_schema = null;

  before("Instantiate the two schemas", async () => {
    json_schema = new Schema(test_db_config, { serialize_objects: true });
    no_json_schema = new Schema(test_db_config, { serialize_objects: false });
    await json_schema.initialize();
    await no_json_schema.initialize();
  });

  it("passing an object with serialize on works", async () => {
    const meta_rs = json_schema.rs("meta");
    const obj = { foo: "bar", baz: "qux " };

    await meta_rs.create({ key: "good test key", value: obj });
    meta_rs.clear();
    const meta_entry = await meta_rs.where({ key: "good test key" }).first();
    assert.strictEqual(
      meta_entry.value(),
      json_schema.serialize(obj),
      "obj was stringified and stored"
    );
    await meta_rs.destroy_all({ key: "test_key" });
  });

  it("passing an object with serialize off fails", async () => {
    const meta_rs = no_json_schema.rs("meta");
    const obj = { foo: "bar", baz: "qux " };

    try {
      await meta_rs.create({ key: "bad test key", value: obj });
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "The value for key is an object, and serialization is turned off",
        "Got the correct error message"
      );
    }
  });
});
