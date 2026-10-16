// Mirrors the server's password rules so problems show before submitting.
export const passwordProblem = (value) => {
  if (value.length < 10) return 'Use at least 10 characters.';
  if (new TextEncoder().encode(value).length > 72) return 'Use at most 72 characters.';
  if (value.toLowerCase() === value || value.toUpperCase() === value || !/\d/.test(value)) {
    return 'Mix upper- and lower-case letters and include a number.';
  }
  return null;
};
