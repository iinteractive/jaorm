module.exports = {
  extends: ["airbnb", "prettier"],

  // Overridden rules specific to this project.

  rules: {
    // We use snake_case for methods and variables and CamelCase for classes or imports.

    camelcase: "off",

    // Serial processing of database records requires await in a loop.

    "no-await-in-loop": "off",

    // We make extensive use of for..of loops for serial processing.
    // The Airbnb style guide forbids for..of loops, which we require.

    "no-restricted-syntax": [
      "error",
      {
        selector: "ForInStatement",
        message:
          "for..in loops iterate over the entire prototype chain, which is virtually never what you want.  Use for..of or Object.{keys,values,entries} to iterate over the array."
      },
      {
        selector: "LabeledStatement",
        message:
          "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand."
      },
      {
        selector: "WithStatement",
        message:
          "`with` is disallowed in strict mode because it makes code impossible to predict and optimize."
      }
    ],

    // We use underscore prefixes to designate a method as private to the enclosing class or module.

    "no-underscore-dangle": "off",

    // We use function expressions as well as arrow functions.

    "prefer-arrow-callback": "off",

    // We require async expressions to contain at least one await-ed function call, or to have a
    // comment explaining why the function is defined as async despite not containing any async calls.

    "require-await": "error",

    // To satisfy the require-await rule, it may be necessary to return
    // an await.  Although doing so is redundant and there may be a tiny
    // performance penalty versus just returning, it explicitly reflects
    // what will happen, so we allow "return await" expressions.

    "no-return-await": "off",

    // We take advantage of function hoisting.

    "no-use-before-define": [
      "error",
      { functions: false, classes: true, variables: false }
    ],

    // We expect functions to be declared with the list of arguments they accept even
    // if those arguments are unused.

    "no-unused-vars": ["error", { args: "none" }],

    // We expect class methods to use `this`, in all methods
    "class-methods-use-this": ["error", { exceptMethods: [] }]
  },

  // An "environment" tells eslint what global variables to expect are
  // predefined.  Since we are using mocha, we need to enable the mocha
  // environment.

  env: {
    mocha: true
  }
};
