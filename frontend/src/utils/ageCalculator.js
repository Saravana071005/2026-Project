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
 * @param {string|Date} dateString 
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
