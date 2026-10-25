import { WORD_LIST } from "./wordlist.ts";

export { WORD_LIST };

export interface GeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
  mode: "password" | "passphrase";
  passphraseWords: number;
  passphraseSeparator: string;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very Weak" | "Weak" | "Fair" | "Good" | "Strong";
  colorClass: string;
  bgClass: string;
  percentage: number;
  entropy: number;
}

export interface PasswordStats {
  uppercase: number;
  lowercase: number;
  digits: number;
  symbols: number;
  total: number;
}

const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SYMBOL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const PASSPHRASE_SYMBOL_CHARS = "!@#$%^&*?";

// Ambiguous characters commonly confused with each other
const AMBIGUOUS_CHARS = new Set(["i", "l", "1", "I", "o", "0", "O", "|", "`", "'", '"']);

function filterAmbiguous(charset: string): string {
  return charset
    .split("")
    .filter((char) => !AMBIGUOUS_CHARS.has(char))
    .join("");
}

/**
 * Generates a cryptographically secure random integer in range [0, max - 1].
 * Uses rejection sampling / uniform distribution to prevent modulo bias.
 */
export function getSecureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const range = 0x100000000; // 2^32
  const limit = range - (range % max);
  const buffer = new Uint32Array(1);

  let randomVal: number;
  do {
    globalThis.crypto.getRandomValues(buffer);
    randomVal = buffer[0];
  } while (randomVal >= limit);

  return randomVal % max;
}

/**
 * Fisher-Yates shuffle using cryptographically secure random numbers.
 */
function secureShuffle(array: string[]): string[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Digits a passphrase can inject (falls back to all digits if filtering leaves none). */
function getPassphraseDigitPool(excludeAmbiguous: boolean): string {
  const digits = excludeAmbiguous ? filterAmbiguous(NUMBER_CHARS) : NUMBER_CHARS;
  return digits.length > 0 ? digits : NUMBER_CHARS;
}

function getPassphraseSymbolPool(excludeAmbiguous: boolean): string {
  return excludeAmbiguous ? filterAmbiguous(PASSPHRASE_SYMBOL_CHARS) : PASSPHRASE_SYMBOL_CHARS;
}

/** The non-empty character sets a password is built from, after ambiguous filtering. */
function getPasswordCharSets(options: GeneratorOptions): string[] {
  const { includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous } = options;

  let upper = includeUppercase ? UPPERCASE_CHARS : "";
  let lower = includeLowercase ? LOWERCASE_CHARS : "";
  let numbers = includeNumbers ? NUMBER_CHARS : "";
  let symbols = includeSymbols ? SYMBOL_CHARS : "";

  if (excludeAmbiguous) {
    upper = filterAmbiguous(upper);
    lower = filterAmbiguous(lower);
    numbers = filterAmbiguous(numbers);
    symbols = filterAmbiguous(symbols);
  }

  const selectedSets: string[] = [];
  if (upper) selectedSets.push(upper);
  if (lower) selectedSets.push(lower);
  if (numbers) selectedSets.push(numbers);
  if (symbols) selectedSets.push(symbols);
  return selectedSets;
}

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  includeUppercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeAmbiguous?: boolean;
}

/**
 * Generates an enhanced xkcd-style passphrase from the word list,
 * supporting Title Case / uppercase, cryptographic number injection, and symbol injection.
 */
export function generatePassphrase(
  optionsOrCount: number | PassphraseOptions,
  legacySeparator: string = "-"
): string {
  let wordCount: number;
  let separator: string;
  let includeUppercase = true;
  let includeNumbers = false;
  let includeSymbols = false;
  let excludeAmbiguous = false;

  if (typeof optionsOrCount === "number") {
    wordCount = optionsOrCount;
    separator = legacySeparator;
  } else {
    wordCount = optionsOrCount.wordCount;
    separator = optionsOrCount.separator;
    includeUppercase = optionsOrCount.includeUppercase ?? true;
    includeNumbers = optionsOrCount.includeNumbers ?? false;
    includeSymbols = optionsOrCount.includeSymbols ?? false;
    excludeAmbiguous = optionsOrCount.excludeAmbiguous ?? false;
  }

  if (wordCount <= 0) return "";

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    let word = WORD_LIST[getSecureRandomInt(WORD_LIST.length)];
    if (includeUppercase) {
      word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    } else {
      word = word.toLowerCase();
    }
    words.push(word);
  }

  // Inject numbers if requested (e.g. Blue-Lion-Star42-Peak)
  if (includeNumbers && words.length > 0) {
    const targetIdx = getSecureRandomInt(words.length);
    const digitChars = getPassphraseDigitPool(excludeAmbiguous);
    const num = `${digitChars[getSecureRandomInt(digitChars.length)]}${digitChars[getSecureRandomInt(digitChars.length)]}`;
    words[targetIdx] = `${words[targetIdx]}${num}`;
  }

  // Inject symbols if requested (e.g. Blue!-Lion-Star42-Peak)
  if (includeSymbols && words.length > 0) {
    const symbolPool = getPassphraseSymbolPool(excludeAmbiguous);
    if (symbolPool.length > 0) {
      const sym = symbolPool[getSecureRandomInt(symbolPool.length)];
      // Choose an index different from target index if possible
      const symTargetIdx = words.length > 1 ? (getSecureRandomInt(words.length - 1) + 1) % words.length : 0;
      words[symTargetIdx] = `${words[symTargetIdx]}${sym}`;
    }
  }

  return words.join(separator);
}

export function generatePassword(options: GeneratorOptions): string {
  if (options.mode === "passphrase") {
    return generatePassphrase({
      wordCount: options.passphraseWords,
      separator: options.passphraseSeparator,
      includeUppercase: options.includeUppercase,
      includeNumbers: options.includeNumbers,
      includeSymbols: options.includeSymbols,
      excludeAmbiguous: options.excludeAmbiguous,
    });
  }

  const { length } = options;
  const selectedSets = getPasswordCharSets(options);

  // If no character set is selected, return empty
  if (selectedSets.length === 0 || length <= 0) {
    return "";
  }

  const passwordChars: string[] = [];
  const fullPool = selectedSets.join("");

  // Guarantee at least one character from each selected set if length allows
  for (const set of selectedSets) {
    if (passwordChars.length < length) {
      const idx = getSecureRandomInt(set.length);
      passwordChars.push(set[idx]);
    }
  }

  // Fill the remainder from the combined pool
  while (passwordChars.length < length) {
    const idx = getSecureRandomInt(fullPool.length);
    passwordChars.push(fullPool[idx]);
  }

  // Cryptographically shuffle the characters so guaranteed set positions aren't predictable
  return secureShuffle(passwordChars).join("");
}

/**
 * Entropy in bits, based on how the password is generated (not on how the output looks).
 * Separator and Title Case add 0 bits because they are fixed, known settings.
 */
export function calculateEntropy(options: GeneratorOptions): number {
  if (options.mode === "passphrase") {
    const words = options.passphraseWords;
    if (words <= 0) return 0;

    let entropy = words * Math.log2(WORD_LIST.length);
    if (options.includeNumbers) {
      // Which word gets the digits, plus two random digits
      entropy += Math.log2(words) + 2 * Math.log2(getPassphraseDigitPool(options.excludeAmbiguous).length);
    }
    if (options.includeSymbols) {
      const symbolPoolSize = getPassphraseSymbolPool(options.excludeAmbiguous).length;
      if (symbolPoolSize > 0) {
        // Which symbol, plus which word gets it
        entropy += Math.log2(symbolPoolSize) + Math.log2(words);
      }
    }
    return entropy;
  }

  const poolSize = getPasswordCharSets(options).join("").length;
  if (poolSize === 0 || options.length <= 0) return 0;
  return options.length * Math.log2(poolSize);
}

export function getPasswordStats(password: string): PasswordStats {
  let uppercase = 0, lowercase = 0, digits = 0, symbols = 0;
  for (const char of password) {
    if (/[A-Z]/.test(char)) uppercase++;
    else if (/[a-z]/.test(char)) lowercase++;
    else if (/[0-9]/.test(char)) digits++;
    else symbols++;
  }
  return { uppercase, lowercase, digits, symbols, total: password.length };
}

export function calculatePasswordStrength(entropy: number): PasswordStrength {
  if (!(entropy > 0)) {
    return {
      score: 0,
      label: "Very Weak",
      colorClass: "text-zinc-400 dark:text-zinc-500",
      bgClass: "bg-zinc-300 dark:bg-zinc-700",
      percentage: 0,
      entropy: 0,
    };
  }

  if (entropy < 40) {
    return {
      score: 0,
      label: "Very Weak",
      colorClass: "text-rose-500 dark:text-rose-400",
      bgClass: "bg-rose-500",
      percentage: 20,
      entropy,
    };
  }
  if (entropy < 60) {
    return {
      score: 1,
      label: "Weak",
      colorClass: "text-amber-500 dark:text-amber-400",
      bgClass: "bg-amber-500",
      percentage: 40,
      entropy,
    };
  }
  if (entropy < 80) {
    return {
      score: 2,
      label: "Fair",
      colorClass: "text-yellow-500 dark:text-yellow-400",
      bgClass: "bg-yellow-500",
      percentage: 65,
      entropy,
    };
  }
  if (entropy < 100) {
    return {
      score: 3,
      label: "Good",
      colorClass: "text-sky-500 dark:text-sky-400",
      bgClass: "bg-sky-500",
      percentage: 85,
      entropy,
    };
  }
  return {
    score: 4,
    label: "Strong",
    colorClass: "text-emerald-500 dark:text-emerald-400",
    bgClass: "bg-emerald-500",
    percentage: 100,
    entropy,
  };
}
