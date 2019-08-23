/**
 * A helper function to determine whether a string is a valid email
 * @param {str} email as string
 * @return {bool} bool - if email is valid returns true, else, returns false
 */
const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  // !! converts a value into a bool
  // it is shorthand for return (<SOMETHING>) ? true : false;
  // which is the same as: return !!<SOMETHING>
  return !!email.match(regEx);
};

/**
 * A helper function to determine if a string is empty
 * @param {string} string
 * @return {bool} bool - if string is empty returns true, else, returns false
 */
const isEmpty = (string) => string.trim() === '';

exports.validateSignupData = (data) => {
  const errors = {};

  if (isEmpty(data.email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(data.email)) {
    errors.email = 'Must be a valid email address';
  }

  if (isEmpty(data.password)) errors.password = 'Must not be empty';
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = 'Passwords must match';
  if (isEmpty(data.handle)) errors.handle = 'Must not be empty';

  return {
    errors,
    valid: Object.keys(errors).length === 0 // returns a bool
  };
};

exports.validateLoginData = (data) => {
  const errors = {};

  if (isEmpty(data.email)) errors.email = 'Must not be empty';
  if (isEmpty(data.password)) errors.password = 'Must not be empty';

  return {
    errors,
    valid: Object.keys(errors).length === 0 // returns a bool
  };
};
