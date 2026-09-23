/** Computes age in whole years from a DD-MM-YYYY or DD/MM/YYYY date of birth. */
export function getAgeFromDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) {
    return null;
  }

  const normalized = String(dateOfBirth).trim();
  const parts = normalized.includes("-") ? normalized.split("-") : normalized.split("/");

  if (parts.length !== 3) {
    return null;
  }

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  let year = Number(parts[2]);

  if (year < 100) {
    year += year > 30 ? 1900 : 2000;
  }

  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}
