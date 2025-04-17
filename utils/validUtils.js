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

const isValidURL = (value) => {
  const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w- ;,./?%&=]*)?$/;
  return urlPattern.test(value);
};

const isValidDate = (value) => {
  const date = new Date(value);
  return !isNaN(date.getTime());
};

module.exports = {
  isUndefined,
  isNotValidString,
  isNotValidUUID,
  isNotValidInteger,
  isValidPassword,
  isValidURL,
  isValidDate,
};
