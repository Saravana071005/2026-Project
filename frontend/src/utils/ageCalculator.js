/**
 * Accurately calculate age from date of birth string (YYYY-MM-DD)
 * @param {string|Date} dob 
 * @returns {number|null}
 */
export function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : 0;
}

/**
 * Format date for friendly clinical display (e.g., Oct 25, 2026)
 * Respects locale (en, hi, ta) and avoids UTC date offset shifting
 * @param {string|Date} dateString 
 * @param {string} [locale='en']
 * @returns {string}
 */
export function formatDate(dateString, locale = 'en') {
  if (!dateString) return 'N/A';
  let date;
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
    const [year, month, day] = dateString.trim().split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateString);
  }
  if (isNaN(date.getTime())) return 'Invalid Date';

  const localeMap = {
    en: 'en-US',
    hi: 'hi-IN',
    ta: 'ta-IN',
  };
  const targetLocale = localeMap[locale] || 'en-US';

  return date.toLocaleDateString(targetLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
