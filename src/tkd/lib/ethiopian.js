// Ethiopian calendar and clock.
//
// Calendar: 13 months (12 x 30 days + Pagume of 5/6 days), counted from the Amete Mihret epoch.
// Clock: the day starts at 6:00 international time, so 09:00 is "3 o'clock in the morning".

// Day-number arithmetic from Dershowitz & Reingold, "Calendrical Calculations" (fixed = R.D. days).
const COPTIC_EPOCH = 103605;
const ETHIOPIC_EPOCH = 2796;

export const ET_MONTHS = ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'];

const isGregorianLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const fixedFromGregorian = (y, m, d) =>
  365 * (y - 1) + Math.floor((y - 1) / 4) - Math.floor((y - 1) / 100) + Math.floor((y - 1) / 400)
  + Math.floor((367 * m - 362) / 12) + (m <= 2 ? 0 : isGregorianLeap(y) ? -1 : -2) + d;

const fixedFromCoptic = (y, m, d) => COPTIC_EPOCH - 1 + 365 * (y - 1) + Math.floor(y / 4) + 30 * (m - 1) + d;

const copticFromFixed = (date) => {
  const year = Math.floor((4 * (date - COPTIC_EPOCH) + 1463) / 1461);
  const month = 1 + Math.floor((date - fixedFromCoptic(year, 1, 1)) / 30);
  const day = date + 1 - fixedFromCoptic(year, month, 1);
  return { year, month, day };
};

/** { year, month (1-13), day } for a Gregorian Y-M-D. */
export const toEthiopian = (year, month, day) =>
  copticFromFixed(fixedFromGregorian(year, month, day) + COPTIC_EPOCH - ETHIOPIC_EPOCH);

/** Ethiopian hour (1-12) for an international hour (0-23). 9 -> 3, 14 -> 8, 6 -> 12. */
export const ethiopianHour = (hour) => ((hour + 6) % 12) || 12;

/** Part of the day as people say it in Amharic, for an international hour. */
export const dayPartAm = (hour) => {
  if (hour >= 6 && hour < 12) return 'ጠዋት';
  if (hour >= 12 && hour < 18) return 'ከሰዓት';
  if (hour >= 18) return 'ማታ';
  return 'ሌሊት';
};
