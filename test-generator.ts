import assert from "node:assert";
import test from "node:test";
import {
  generatePassword,
  calculatePasswordStrength,
  calculateEntropy,
  generatePassphrase,
  WORD_LIST,
  type GeneratorOptions,
} from "./lib/generator.ts";

const AMBIGUOUS = ["i", "l", "1", "I", "o", "0", "O", "|", "`", "'", '"'];

const PASSWORD_ALL_SETS: GeneratorOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: false,
  mode: "password",
  passphraseWords: 4,
  passphraseSeparator: "-",
};

const PASSPHRASE_PLAIN: GeneratorOptions = {
  ...PASSWORD_ALL_SETS,
  mode: "passphrase",
  includeNumbers: false,
  includeSymbols: false,
};

test("Password generator length", () => {
  for (const len of [6, 12, 16, 24, 32, 64]) {
    const password = generatePassword({
      length: len,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
      mode: "password",
      passphraseWords: 4,
      passphraseSeparator: "-",
    });
    assert.strictEqual(password.length, len);
  }
});

test("Password generator respects character sets", () => {
  // Only numbers
  for (let i = 0; i < 20; i++) {
    const numOnly = generatePassword({
      length: 16,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
      excludeAmbiguous: false,
      mode: "password",
      passphraseWords: 4,
      passphraseSeparator: "-",
    });
    assert.match(numOnly, /^[0-9]+$/);
  }

  // Only lowercase
  for (let i = 0; i < 20; i++) {
    const lowerOnly = generatePassword({
      length: 16,
      includeUppercase: false,
      includeLowercase: true,
      includeNumbers: false,
      includeSymbols: false,
      excludeAmbiguous: false,
      mode: "password",
      passphraseWords: 4,
      passphraseSeparator: "-",
    });
    assert.match(lowerOnly, /^[a-z]+$/);
  }

  // Only uppercase
  for (let i = 0; i < 20; i++) {
    const upperOnly = generatePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: false,
      includeNumbers: false,
      includeSymbols: false,
      excludeAmbiguous: false,
      mode: "password",
      passphraseWords: 4,
      passphraseSeparator: "-",
    });
    assert.match(upperOnly, /^[A-Z]+$/);
  }
});

test("Password generator excludes ambiguous characters when requested", () => {
  const ambiguousChars = ["i", "l", "1", "I", "o", "0", "O", "|", "`", "'", '"'];
  for (let i = 0; i < 50; i++) {
    const password = generatePassword({
      length: 32,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: true,
      mode: "password",
      passphraseWords: 4,
      passphraseSeparator: "-",
    });
    for (const amb of ambiguousChars) {
      assert.strictEqual(
        password.includes(amb),
        false,
        `Password should not include ambiguous character: ${amb}`
      );
    }
  }
});

test("Passphrase generator supports uppercase, numbers, and symbols", () => {
  // 1. Word count & separator
  const basic = generatePassphrase({
    wordCount: 4,
    separator: "-",
    includeUppercase: false,
    includeNumbers: false,
    includeSymbols: false,
  });
  const parts = basic.split("-");
  assert.strictEqual(parts.length, 4);
  assert.match(basic, /^[a-z]+(-[a-z]+){3}$/);

  // 2. Capitalize words (Title Case)
  const titled = generatePassphrase({
    wordCount: 3,
    separator: ".",
    includeUppercase: true,
    includeNumbers: false,
    includeSymbols: false,
  });
  assert.match(titled, /^[A-Z][a-z]+(\.[A-Z][a-z]+){2}$/);

  // 3. Include numbers
  for (let i = 0; i < 10; i++) {
    const withNumbers = generatePassphrase({
      wordCount: 4,
      separator: "-",
      includeUppercase: true,
      includeNumbers: true,
      includeSymbols: false,
    });
    assert.match(withNumbers, /[0-9]/, "Passphrase must contain digits when includeNumbers is true");
  }

  // 4. Include symbols
  for (let i = 0; i < 10; i++) {
    const withSymbols = generatePassphrase({
      wordCount: 4,
      separator: "-",
      includeUppercase: true,
      includeNumbers: false,
      includeSymbols: true,
    });
    assert.match(withSymbols, /[!@#$%^&*?]/, "Passphrase must contain symbols when includeSymbols is true");
  }

  // 5. High-security combined (Title case + numbers + symbols + symbol separator)
  const fullSec = generatePassword({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: false,
    mode: "passphrase",
    passphraseWords: 5,
    passphraseSeparator: "#",
  });
  assert.match(fullSec, /[A-Z]/, "Has uppercase");
  assert.match(fullSec, /[a-z]/, "Has lowercase");
  assert.match(fullSec, /[0-9]/, "Has numbers");
  assert.match(fullSec, /[#]/, "Has custom symbol separator");
});

test("Word list is a single list of 565 unique words", () => {
  assert.strictEqual(WORD_LIST.length, 565);
  assert.strictEqual(new Set(WORD_LIST).size, WORD_LIST.length, "No duplicate words");
});

test("Entropy of a 4-word passphrase is about 36.6 bits", () => {
  const entropy = calculateEntropy(PASSPHRASE_PLAIN);
  assert.ok(Math.abs(entropy - 36.6) < 0.05, `Expected ≈ 36.6 bits, got ${entropy}`);
  assert.strictEqual(calculatePasswordStrength(entropy).label, "Very Weak");

  // Separator and Title Case add 0 bits
  assert.strictEqual(
    calculateEntropy({ ...PASSPHRASE_PLAIN, passphraseSeparator: "#", includeUppercase: false }),
    entropy
  );
});

test("Passphrase entropy adds bits for numbers and symbols", () => {
  const words = 4;
  const base = words * Math.log2(WORD_LIST.length);
  const withNumbers = calculateEntropy({ ...PASSPHRASE_PLAIN, includeNumbers: true });
  assert.ok(Math.abs(withNumbers - (base + Math.log2(words) + 2 * Math.log2(10))) < 1e-9);

  const withSymbols = calculateEntropy({ ...PASSPHRASE_PLAIN, includeSymbols: true });
  assert.ok(Math.abs(withSymbols - (base + Math.log2(9) + Math.log2(words))) < 1e-9);
});

test("16-char password with all four sets is Good or Strong", () => {
  const entropy = calculateEntropy(PASSWORD_ALL_SETS);
  // 16 × log2(26 + 26 + 10 + 26) = 16 × log2(88) ≈ 103.4 bits
  assert.ok(Math.abs(entropy - 16 * Math.log2(88)) < 1e-9);
  const { label } = calculatePasswordStrength(entropy);
  assert.ok(label === "Good" || label === "Strong", `Got ${label}`);
});

test("Password entropy uses the pool after ambiguous filtering", () => {
  const entropy = calculateEntropy({ ...PASSWORD_ALL_SETS, excludeAmbiguous: true });
  // 24 upper + 23 lower + 8 digits + 25 symbols = 80
  assert.ok(Math.abs(entropy - 16 * Math.log2(80)) < 1e-9);
});

test("Strength bands match the entropy thresholds", () => {
  const cases: [number, number, string][] = [
    [0, 0, "Very Weak"],
    [39.9, 0, "Very Weak"],
    [40, 1, "Weak"],
    [59.9, 1, "Weak"],
    [60, 2, "Fair"],
    [80, 3, "Good"],
    [100, 4, "Strong"],
  ];
  for (const [entropy, score, label] of cases) {
    const strength = calculatePasswordStrength(entropy);
    assert.strictEqual(strength.score, score, `score for ${entropy} bits`);
    assert.strictEqual(strength.label, label, `label for ${entropy} bits`);
  }
});

test("Ambiguous characters never appear when excludeAmbiguous is on", () => {
  for (let i = 0; i < 200; i++) {
    const password = generatePassword({ ...PASSWORD_ALL_SETS, length: 64, excludeAmbiguous: true });
    for (const amb of AMBIGUOUS) {
      assert.ok(!password.includes(amb), `Found ambiguous character ${amb} in ${password}`);
    }
  }
});

test("Each selected character set appears at least once", () => {
  const sets: { key: keyof GeneratorOptions; pattern: RegExp }[] = [
    { key: "includeUppercase", pattern: /[A-Z]/ },
    { key: "includeLowercase", pattern: /[a-z]/ },
    { key: "includeNumbers", pattern: /[0-9]/ },
    { key: "includeSymbols", pattern: /[^A-Za-z0-9]/ },
  ];
  // Every non-empty combination of the four sets, at the minimum length of 6
  for (let mask = 1; mask < 16; mask++) {
    const options: GeneratorOptions = { ...PASSWORD_ALL_SETS, length: 6 };
    sets.forEach((set, bit) => {
      (options[set.key] as boolean) = Boolean(mask & (1 << bit));
    });
    for (let i = 0; i < 50; i++) {
      const password = generatePassword(options);
      sets.forEach((set, bit) => {
        if (mask & (1 << bit)) {
          assert.match(password, set.pattern, `mask ${mask}: missing ${set.key} in ${password}`);
        }
      });
    }
  }
});
