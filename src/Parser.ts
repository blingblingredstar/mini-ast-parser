import { Token, TokenType } from './Tokenizer';

export enum NodeType {
  Program = 'Program',
  VariableDeclaration = 'VariableDeclaration',
  VariableDeclarator = 'VariableDeclarator',
  Identifier = 'Identifier',
  FunctionExpression = 'FunctionExpression',
  BlockStatement = 'BlockStatement',
}

export interface Node {
  type: string;
  start: number;
  end: number;
}

export interface Identifier extends Node {
  type: NodeType.Identifier;
  name: string;
}

export interface Expression extends Node {}

export interface Statement extends Node {}

export interface Program extends Node {
  type: NodeType.Program;
  body: Statement[];
}

export interface VariableDeclarator extends Node {
  type: NodeType.VariableDeclarator;
  id: Identifier;
  init: Expression;
}

type VariableDeclarationKind = 'var' | 'let' | 'const';

export interface VariableDeclaration extends Node {
  type: NodeType.VariableDeclaration;
  kind: VariableDeclarationKind;
  declarations: VariableDeclarator[];
}

export interface BlockStatement extends Node {
  type: NodeType.BlockStatement;
  body: Statement[];
}

export interface FunctionExpression extends Node {
  type: NodeType.FunctionExpression;
  id: Identifier | null;
  params: Expression[] | Identifier[];
  body: BlockStatement;
}

export class Parser {
  #tokens: Token[] = [];
  #currentIndex = 0;
  constructor(tokens: Token[]) {
    this.#tokens = [...tokens];
  }

  get #isEnd() {
    return this.#currentIndex >= this.#tokens.length;
  }

  get #currentToken(): Token {
    return this.#tokens[this.#currentIndex];
  }

  get #previousToken(): Token {
    return this.#tokens[this.#currentIndex - 1];
  }

  #checkCurrentTokenType(type: TokenType | TokenType[]): boolean {
    if (this.#isEnd) return false;
    const currentType = this.#currentToken.type;
    return Array.isArray(type)
      ? type.includes(currentType)
      : currentType === type;
  }

  #goNext(type: TokenType | TokenType[]): Token {
    const currentToken = this.#currentToken;
    const currentType = currentToken.type;
    if (Array.isArray(type) && !type.includes(currentType)) {
      throw new Error(`Expect ${type.join(',')}, but got ${currentType}`);
    }
    if (currentType !== type) {
      throw new Error(`Expect ${type}, but got ${currentType}`);
    }
    this.#currentIndex++;
    return currentToken;
  }

  #parseIdentifier(): Identifier {
    const token = this.#currentToken;
    const identifier: Identifier = {
      type: NodeType.Identifier,
      name: token.value!,
      start: token.start,
      end: token.end,
    };
    this.#goNext(TokenType.Identifier);
    return identifier;
  }

  #parseParam(): Identifier[] | Expression[] {
    this.#goNext(TokenType.LeftParen);
    const params: Identifier[] = [];
    while (!this.#checkCurrentTokenType(TokenType.RightParen)) {
      params.push(this.#parseIdentifier());
    }
    this.#goNext(TokenType.RightParen);
    return params;
  }

  #parseBlockStatement(): BlockStatement {
    const { start } = this.#currentToken;
    const blockStatement: BlockStatement = {
      type: NodeType.BlockStatement,
      body: [],
      start,
      end: Infinity,
    };
    this.#goNext(TokenType.LeftCurly);
    while (!this.#checkCurrentTokenType(TokenType.RightCurly)) {
      blockStatement.body.push(this.#parseStatement());
    }
    blockStatement.end = this.#currentToken.end;
    this.#goNext(TokenType.RightCurly);
    return blockStatement;
  }

  #parseFunctionExpression(): FunctionExpression {
    const { start } = this.#currentToken;
    this.#goNext(TokenType.Function);
    let id: Identifier | null = null;
    if (this.#checkCurrentTokenType(TokenType.Identifier)) {
      id = this.#parseIdentifier();
    }
    const params = this.#parseParam();
    const body = this.#parseBlockStatement();
    return {
      type: NodeType.FunctionExpression,
      id,
      params,
      body,
      start,
      end: body.end,
    };
  }

  #parseVariableDeclaration(): VariableDeclaration {
    const currentToken = this.#currentToken;
    const { start } = currentToken;
    const kind = this.#currentToken.value as VariableDeclarationKind;
    this.#goNext(TokenType.Let);
    const id = this.#parseIdentifier();
    this.#goNext(TokenType.Assign);
    const init = this.#parseFunctionExpression();
    const declarator: VariableDeclarator = {
      type: NodeType.VariableDeclarator,
      id,
      init,
      start,
      end: init ? init.end : id.end,
    };
    return {
      type: NodeType.VariableDeclaration,
      kind,
      declarations: [declarator],
      start,
      end: this.#previousToken.end,
    };
  }

  #parseStatement(): Statement {
    if (this.#checkCurrentTokenType(TokenType.Let)) {
      return this.#parseVariableDeclaration();
    }

    throw new Error('Unexpected token: ' + this.#currentToken.type);
  }

  #parseProgram(): Program {
    const program: Program = {
      type: NodeType.Program,
      body: [],
      start: 0,
      end: Infinity,
    };

    while (!this.#isEnd) {
      const node = this.#parseStatement();
      program.body.push(node);
      if (this.#isEnd) {
        program.end = node.end;
      }
    }

    return program;
  }

  parse(): Program {
    return this.#parseProgram();
  }
}
