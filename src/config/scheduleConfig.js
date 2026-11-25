// Static rules that are not stored in the backend. Packages and the weekly timetable
// come from the API (seeded from the official price card and registration form).

// Registering yourself (without a parent/guardian) requires this age.
export const ADULT_AGE = 18;
// Little Kids Karate takes children from age 3; allow a little headroom below that.
export const MIN_MEMBER_AGE = 2;
