const isUndefined = (value) => {
  return value === undefined;
};

const isNotValidString = (value) => {
  return typeof value !== "string" || value.trim().length === 0 || value === "";
};

const isNotValidUUID = (value) => {
  const uuidPattern =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return !uuidPattern.test(value);
};

const isNotValidInteger = (value) => {
  return typeof value !== "number" || value < 0 || value % 1 !== 0;
};

const isValidPassword = (value) => {
  const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
  return passwordPattern.test(value);
};

module.exports = {
  isUndefined,
  isNotValidString,
  isNotValidUUID,
  isNotValidInteger,
  isValidPassword,
};
