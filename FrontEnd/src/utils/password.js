const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*_-+=";
const ALL_CHARACTERS = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS;

const randomIndex = (length) => {
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return values[0] % length;
};

export const generatePassword = (length = 16) => {
  const characters = [
    LOWERCASE[randomIndex(LOWERCASE.length)],
    UPPERCASE[randomIndex(UPPERCASE.length)],
    DIGITS[randomIndex(DIGITS.length)],
    SYMBOLS[randomIndex(SYMBOLS.length)],
  ];

  while (characters.length < length) {
    characters.push(ALL_CHARACTERS[randomIndex(ALL_CHARACTERS.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }

  return characters.join("");
};
