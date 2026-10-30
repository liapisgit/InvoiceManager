export const PHONE_PREFIX = "30";
export const PHONE_LOCAL_LENGTH = 10;

// Keeps only digits and caps the local part (without the 30 prefix)
export const sanitizeLocalPhone = (value) =>
  String(value ?? "").replace(/\D/g, "").slice(0, PHONE_LOCAL_LENGTH);

// "306971234567" -> "6971234567"
export const toLocalPhone = (phone) => {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.startsWith(PHONE_PREFIX) && digits.length > PHONE_LOCAL_LENGTH
    ? digits.slice(PHONE_PREFIX.length)
    : digits;
};

// "6971234567" -> "306971234567", empty -> null
export const toFullPhone = (localPhone) => {
  const digits = sanitizeLocalPhone(localPhone);
  return digits ? `${PHONE_PREFIX}${digits}` : null;
};

export const isLocalPhoneValid = (localPhone) => {
  const digits = sanitizeLocalPhone(localPhone);
  return !digits || digits.length === PHONE_LOCAL_LENGTH;
};
