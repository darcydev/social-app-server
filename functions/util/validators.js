/**
 * A helper function to determine whether a string is a valid email according to a regex pattern
 * @param {str} email as string
 * @return {boolean} whether an email is valid or not
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
 * @return {boolean} whether a string is empty or not
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
