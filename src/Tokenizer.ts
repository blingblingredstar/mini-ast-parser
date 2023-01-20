import { isAlpha } from './utils';

export enum TokenType {
  Let = 'Let',
  Assign = 'Assign',
  Function = 'Function',
  Identifier = 'Identifier',
  LeftParen = 'LeftParen',
  RightParen = 'RightParen',
  LeftCurly = 'LeftCurly',
  RightCurly = 'RightCurly',
}

export type Token = {
  type: TokenType;
  value?: string;
  start: number;
  end: number;
  raw?: string;
};

const TOKENS_GENERATOR: Record<string, (...args: any[]) => Token> = {
  let(start: number) {
    return {
      type: TokenType.Let,
      value: 'let',
      start,
      end: start + 3,
    };
  },
  assign(start: number) {
    return {
      type: TokenType.Assign,
      value: '=',
      start,
      end: start + 1,
    };
  },
  function(start: number) {
    return {
      type: TokenType.Function,
      value: 'function',
      start,
      end: start + 8,
    };
  },
  leftParen(start: number) {
    return {
      type: TokenType.LeftParen,
      value: '(',
      start,
      end: start + 1,
    };
  },
  rightParen(start: number) {
    return {
      type: TokenType.RightParen,
      value: ')',
      start,
      end: start + 1,
    };
  },
  leftCurly(start: number) {
    return {
      type: TokenType.LeftCurly,
      value: '{',
      start,
      end: start + 1,
    };
  },
  rightCurly(start: number) {
    return {
      type: TokenType.RightCurly,
      value: '}',
      start,
      end: start + 1,
    };
  },
  identifier(start: number, value: string) {
    return {
      type: TokenType.Identifier,
      value,
      start,
      end: start + value.length,
    };
  },
};

type SingleCharTokens = '(' | ')' | '{' | '}' | '=';

const KNOWN_SINGLE_CHAR_TOKENS = new Map<
  SingleCharTokens,
  typeof TOKENS_GENERATOR[keyof typeof TOKENS_GENERATOR]
>([
  ['(', TOKENS_GENERATOR.leftParen],
  [')', TOKENS_GENERATOR.rightParen],
  ['{', TOKENS_GENERATOR.leftCurly],
  ['}', TOKENS_GENERATOR.rightCurly],
  ['=', TOKENS_GENERATOR.assign],
]);

const isSingleCharToken = (char: string): char is SingleCharTokens =>
  KNOWN_SINGLE_CHAR_TOKENS.has(char as SingleCharTokens);

export class Tokenizer {
  #tokens: Token[] = [];
  #currentIndex: number = 0;
  #source: string;
  constructor(input: string) {
    this.#source = input;
  }
  tokenize(): Token[] {
    while (this.#currentIndex < this.#source.length) {
      let currentChar = this.#source[this.#currentIndex];
      const startIndex = this.#currentIndex;

      // 1. handle space
      if (currentChar === ' ') {
        this.#currentIndex++;
        continue;
      }

      // 2. handle letters
      if (isAlpha(currentChar)) {
        let identifier = '';
        while (isAlpha(currentChar)) {
          identifier += currentChar;
          this.#currentIndex++;
          currentChar = this.#source[this.#currentIndex];
        }
        let token: Token;
        if (identifier in TOKENS_GENERATOR) {
          token = TOKENS_GENERATOR[identifier](startIndex);
        } else {
          token = TOKENS_GENERATOR['identifier'](startIndex, identifier);
        }
        this.#tokens.push(token);
        continue;
      }

      // 3. handle single char token
      if (isSingleCharToken(currentChar)) {
        const token = KNOWN_SINGLE_CHAR_TOKENS.get(currentChar)!(startIndex);
        this.#tokens.push(token);
        this.#currentIndex++;
        continue;
      }
    }
    return this.#tokens;
  }
}
