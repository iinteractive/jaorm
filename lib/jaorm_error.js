class JaormError {
  constructor(message, options = {}) {
    const self = this;
    self.message = message;
  }
}

module.exports = JaormError;
