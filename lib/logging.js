const log_levels = ["trace", "debug", "info", "warn", "error", "fatal", "off"];
const minimum_stderr_log_level = log_levels.indexOf("error");

class Logging {
  constructor(log_level_arg) {
    const self = this;
    self.log_level = log_levels.indexOf("fatal");

    if (log_level_arg) {
      const ll_index = log_levels.indexOf(log_level_arg.toLowerCase());
      if (ll_index === -1) {
        throw new Error(`Log level "${log_level_arg}" is invalid.`);
      } else {
        self.log_level = ll_index;
      }
    }
  }

  _log_message(level, message) {
    const self = this;

    if (level < self.log_level) {
      return false;
    }

    const formatted_message = `[${log_levels[level]}] ${message}\n`;
    if (level < minimum_stderr_log_level) {
      process.stdout.write(formatted_message);
    } else {
      process.stderr.write(formatted_message);
    }
    return true;
  }

  trace(message) {
    const self = this;
    return self._log_message(log_levels.indexOf("trace"), message);
  }

  debug(message) {
    const self = this;
    return self._log_message(log_levels.indexOf("debug"), message);
  }

  info(message) {
    const self = this;
    return self._log_message(log_levels.indexOf("info"), message);
  }

  warn(message) {
    const self = this;
    return self._log_message(log_levels.indexOf("warn"), message);
  }

  error(message) {
    const self = this;
    return self._log_message(log_levels.indexOf("error"), message);
  }

  fatal(message) {
    const self = this;
    return self._log_message(log_levels.indexOf("fatal"), message);
  }
}

module.exports = Logging;
