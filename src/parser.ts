// Parser for Flick language

import { Token, TokenType } from './lexer.js';
import * as AST from './ast.js';
import { PluginManager } from './plugin.js';

export class Parser {
  private tokens: Token[];
  private position: number = 0;
  private pluginManager: PluginManager;

  constructor(tokens: Token[], pluginManager: PluginManager) {
    // Filter out newline tokens for easier parsing
    this.tokens = tokens.filter(t => t.type !== TokenType.NEWLINE);
    this.pluginManager = pluginManager;
  }

  private peek(offset: number = 0): Token {
    const pos = this.position + offset;
    return pos < this.tokens.length ? this.tokens[pos] : this.tokens[this.tokens.length - 1];
  }

  private advance(): Token {
    return this.tokens[this.position++];
  }

  private expect(type: TokenType): Token {
    const token = this.peek();
    if (token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type} at line ${token.line}, column ${token.column}`);
    }
    return this.advance();
  }

  private match(...types: TokenType[]): boolean {
    return types.includes(this.peek().type);
  }

  public parse(): AST.ProgramNode {
    const body: AST.ASTNode[] = [];

    // Parse declare statements first (must be at top of file)
    while (this.match(TokenType.DECLARE)) {
      body.push(this.parseDeclareStatement());
    }

    while (!this.match(TokenType.EOF)) {
      body.push(this.parseTopLevelStatement());
    }

    return { type: 'Program', body };
  }

  private parseTopLevelStatement(): AST.ASTNode {
    // Check for plugin-specific statements
    if (this.match(TokenType.ROUTE)) {
      if (!this.pluginManager.isDeclared('web')) {
        throw new Error(`Feature 'route' requires declare web at top of file`);
      }
      return this.parseRouteStatement();
    }

    if (this.match(TokenType.GROUP)) {
      return this.parseGroupDeclaration();
    }
    if (this.match(TokenType.BLUEPRINT)) {
      return this.parseBlueprintDeclaration();
    }
    if (this.match(TokenType.DO)) {
      return this.parseDoImplementation();
    }
    if (this.match(TokenType.TASK)) {
      return this.parseTaskDeclaration();
    }
    if (this.match(TokenType.FREE, TokenType.LOCK)) {
      return this.parseVariableDeclaration();
    }
    return this.parseStatement();
  }

  private parseDeclareStatement(): AST.DeclareStatementNode {
    this.expect(TokenType.DECLARE);
    const plugin = this.expect(TokenType.IDENTIFIER).value;

    let argument: AST.ASTNode | undefined;
    if (this.match(TokenType.AT)) {
      this.advance();
      // Parse the argument (could be number, string, or identifier)
      if (this.match(TokenType.NUMBER)) {
        const value = parseFloat(this.advance().value);
        argument = { type: 'Literal', value, raw: String(value) };
      } else if (this.match(TokenType.STRING)) {
        const value = this.advance().value;
        argument = { type: 'Literal', value, raw: value };
      } else if (this.match(TokenType.IDENTIFIER)) {
        const name = this.advance().value;
        argument = { type: 'Identifier', name };
      }
    }

    // Register with plugin manager
    this.pluginManager.declarePlugin(plugin, argument);

    return { type: 'DeclareStatement', plugin, argument };
  }

  private parseRouteStatement(): AST.RouteStatementNode {
    this.expect(TokenType.ROUTE);
    const path = this.expect(TokenType.STRING).value;

    // Check for forwarding syntax: route "/auth" -> AuthRoutes
    if (this.match(TokenType.MINUS) && this.peek(1).type === TokenType.GREATER_THAN) {
      this.advance(); // consume -
      this.advance(); // consume >
      const forward = this.expect(TokenType.IDENTIFIER).value;
      return { type: 'RouteStatement', path, forward };
    }

    this.expect(TokenType.ARROW);

    const body: AST.ASTNode[] = [];
    while (!this.match(TokenType.END)) {
      body.push(this.parseStatement());
    }

    this.expect(TokenType.END);

    return { type: 'RouteStatement', path, body };
  }

  private parseGroupDeclaration(): AST.GroupDeclarationNode {
    this.expect(TokenType.GROUP);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.LBRACE);

    const fields: AST.VariableDeclarationNode[] = [];
    const methods: AST.TaskDeclarationNode[] = [];

    while (!this.match(TokenType.RBRACE)) {
      if (this.match(TokenType.TASK)) {
        methods.push(this.parseTaskDeclaration());
      } else if (this.match(TokenType.FREE, TokenType.LOCK)) {
        fields.push(this.parseVariableDeclaration());
      } else {
        throw new Error(`Unexpected token in group: ${this.peek().value}`);
      }
    }

    this.expect(TokenType.RBRACE);

    return { type: 'GroupDeclaration', name, fields, methods };
  }

  private parseBlueprintDeclaration(): AST.BlueprintDeclarationNode {
    this.expect(TokenType.BLUEPRINT);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.LBRACE);

    const methods: AST.TaskSignatureNode[] = [];

    while (!this.match(TokenType.RBRACE)) {
      this.expect(TokenType.TASK);
      const methodName = this.expect(TokenType.IDENTIFIER).value;
      const parameters: AST.ParameterNode[] = [];

      if (this.match(TokenType.WITH)) {
        this.advance();
        parameters.push(...this.parseParameters());
      }

      methods.push({ name: methodName, parameters });
    }

    this.expect(TokenType.RBRACE);

    return { type: 'BlueprintDeclaration', name, methods };
  }

  private parseDoImplementation(): AST.DoImplementationNode {
    this.expect(TokenType.DO);
    const blueprintName = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.FOR);
    const groupName = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.ARROW);

    const methods: AST.TaskDeclarationNode[] = [];

    while (!this.match(TokenType.END)) {
      methods.push(this.parseTaskDeclaration());
    }

    this.expect(TokenType.END);

    return { type: 'DoImplementation', blueprintName, groupName, methods };
  }

  private parseTaskDeclaration(): AST.TaskDeclarationNode {
    this.expect(TokenType.TASK);
    const name = this.expect(TokenType.IDENTIFIER).value;

    const parameters: AST.ParameterNode[] = [];
    if (this.match(TokenType.WITH)) {
      this.advance();
      parameters.push(...this.parseParameters());
    }

    this.expect(TokenType.ARROW);

    const body: AST.ASTNode[] = [];
    while (!this.match(TokenType.END)) {
      body.push(this.parseStatement());
    }

    this.expect(TokenType.END);

    return { type: 'TaskDeclaration', name, parameters, body };
  }

  private parseParameters(): AST.ParameterNode[] {
    const parameters: AST.ParameterNode[] = [];

    do {
      if (this.match(TokenType.COMMA)) {
        this.advance();
      }

      // Accept num, literal, or identifier as type
      let paramType: string;
      if (this.match(TokenType.NUM, TokenType.LITERAL, TokenType.IDENTIFIER)) {
        paramType = this.advance().value;
      } else {
        throw new Error(`Expected type name at line ${this.peek().line}`);
      }

      this.expect(TokenType.LPAREN);
      const name = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.RPAREN);

      parameters.push({ name, paramType });
    } while (this.match(TokenType.COMMA));

    return parameters;
  }

  private parseVariableDeclaration(): AST.VariableDeclarationNode {
    const mutable = this.match(TokenType.FREE);
    this.advance(); // consume FREE or LOCK

    let varType: string | undefined;
    let name: string;

    // Check if there's a type annotation (could be num, literal, or identifier)
    const firstToken = this.peek();
    const secondToken = this.peek(1);

    if (
      (this.match(TokenType.NUM, TokenType.LITERAL, TokenType.IDENTIFIER)) &&
      (secondToken.type === TokenType.IDENTIFIER)
    ) {
      varType = this.advance().value;
      name = this.advance().value;
    } else {
      name = this.expect(TokenType.IDENTIFIER).value;
    }

    let initializer: AST.ASTNode | undefined;
    if (this.match(TokenType.ASSIGN)) {
      this.advance();
      initializer = this.parseExpression();
    } else if (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      // Allow '=' for initialization
      if (this.peek().value === '=') {
        this.advance();
        initializer = this.parseExpression();
      }
    }

    return { type: 'VariableDeclaration', name, mutable, varType, initializer };
  }

  private parseStatement(): AST.ASTNode {
    if (this.match(TokenType.RESPOND)) {
      if (!this.pluginManager.isDeclared('web')) {
        throw new Error(`Feature 'respond' requires declare web at top of file`);
      }
      return this.parseRespondStatement();
    }

    if (this.match(TokenType.PRINT)) {
      return this.parsePrintStatement();
    }
    if (this.match(TokenType.ASSUME)) {
      return this.parseIfStatement();
    }
    if (this.match(TokenType.EACH)) {
      return this.parseEachLoop();
    }
    if (this.match(TokenType.MARCH)) {
      return this.parseMarchLoop();
    }
    if (this.match(TokenType.SELECT)) {
      return this.parseSelectStatement();
    }
    if (this.match(TokenType.FREE, TokenType.LOCK)) {
      return this.parseVariableDeclaration();
    }

    // Check for assignment or expression statement
    const expr = this.parseExpression();

    // Check if this is an assignment
    if (this.match(TokenType.ASSIGN)) {
      this.advance();
      const value = this.parseExpression();
      return { type: 'Assignment', target: expr, value };
    }

    return { type: 'ExpressionStatement', expression: expr };
  }

  private parseRespondStatement(): AST.RespondStatementNode {
    this.expect(TokenType.RESPOND);
    const content = this.parseExpression();
    return { type: 'RespondStatement', content };
  }

  private parsePrintStatement(): AST.PrintStatementNode {
    this.expect(TokenType.PRINT);

    const expressions: AST.ASTNode[] = [];
    expressions.push(this.parseExpression());

    while (this.match(TokenType.AND)) {
      this.advance();
      expressions.push(this.parseExpression());
    }

    return { type: 'PrintStatement', expressions };
  }

  private parseIfStatement(): AST.IfStatementNode {
    const conditions: Array<{ condition: AST.ASTNode | null; body: AST.ASTNode[] }> = [];

    // assume
    this.expect(TokenType.ASSUME);
    const assumeCondition = this.parseExpression();
    this.expect(TokenType.ARROW);

    const assumeBody: AST.ASTNode[] = [];
    while (!this.match(TokenType.MAYBE, TokenType.OTHERWISE, TokenType.END)) {
      assumeBody.push(this.parseStatement());
    }
    conditions.push({ condition: assumeCondition, body: assumeBody });

    // maybe (elif)
    while (this.match(TokenType.MAYBE)) {
      this.advance();
      const maybeCondition = this.parseExpression();
      this.expect(TokenType.ARROW);

      const maybeBody: AST.ASTNode[] = [];
      while (!this.match(TokenType.MAYBE, TokenType.OTHERWISE, TokenType.END)) {
        maybeBody.push(this.parseStatement());
      }
      conditions.push({ condition: maybeCondition, body: maybeBody });
    }

    // otherwise (else)
    if (this.match(TokenType.OTHERWISE)) {
      this.advance();
      this.expect(TokenType.ARROW);

      const otherwiseBody: AST.ASTNode[] = [];
      while (!this.match(TokenType.END)) {
        otherwiseBody.push(this.parseStatement());
      }
      conditions.push({ condition: null, body: otherwiseBody });
    }

    this.expect(TokenType.END);

    return { type: 'IfStatement', conditions };
  }

  private parseEachLoop(): AST.EachLoopNode {
    this.expect(TokenType.EACH);
    const variable = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.IN);
    const iterable = this.parseExpression();
    this.expect(TokenType.ARROW);

    const body: AST.ASTNode[] = [];
    while (!this.match(TokenType.END)) {
      body.push(this.parseStatement());
    }

    this.expect(TokenType.END);

    return { type: 'EachLoop', variable, iterable, body };
  }

  private parseMarchLoop(): AST.MarchLoopNode {
    this.expect(TokenType.MARCH);
    const variable = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.FROM);
    const start = this.parseExpression();
    this.expect(TokenType.TO);
    const end = this.parseExpression();
    this.expect(TokenType.ARROW);

    const body: AST.ASTNode[] = [];
    while (!this.match(TokenType.END)) {
      body.push(this.parseStatement());
    }

    this.expect(TokenType.END);

    return { type: 'MarchLoop', variable, start, end, body };
  }

  private parseSelectStatement(): AST.SelectStatementNode {
    this.expect(TokenType.SELECT);
    const expression = this.parseExpression();
    this.expect(TokenType.ARROW);

    const cases: Array<{ key: string; conditions: AST.ASTNode[]; body: AST.ASTNode[] }> = [];

    while (this.match(TokenType.WHEN)) {
      this.advance();
      const key = this.expect(TokenType.STRING).value;
      this.expect(TokenType.ARROW);

      const conditions: AST.ASTNode[] = [];
      const body: AST.ASTNode[] = [];

      // Check if there's a suppose statement
      if (this.match(TokenType.SUPPOSE)) {
        this.advance();
        const condition = this.parseExpression();
        this.expect(TokenType.ARROW);
        conditions.push(condition);
      }

      // Parse body until next when or end
      while (!this.match(TokenType.WHEN, TokenType.END)) {
        body.push(this.parseStatement());
      }

      cases.push({ key, conditions, body });
    }

    this.expect(TokenType.END);

    return { type: 'SelectStatement', expression, cases };
  }

  private parseExpression(): AST.ASTNode {
    return this.parseLogicalExpression();
  }

  private parseLogicalExpression(): AST.ASTNode {
    let left = this.parseComparisonExpression();

    while (this.match(TokenType.AND) && this.peek(-1).type !== TokenType.PRINT) {
      // Skip AND if it's part of print statement
      break;
    }

    return left;
  }

  private parseComparisonExpression(): AST.ASTNode {
    let left = this.parseAdditiveExpression();

    while (this.match(
      TokenType.EQUALS,
      TokenType.NOT_EQUALS,
      TokenType.LESS_THAN,
      TokenType.GREATER_THAN,
      TokenType.LESS_EQUAL,
      TokenType.GREATER_EQUAL
    )) {
      const operator = this.advance().value;
      const right = this.parseAdditiveExpression();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseAdditiveExpression(): AST.ASTNode {
    let left = this.parseMultiplicativeExpression();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.advance().value;
      const right = this.parseMultiplicativeExpression();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseMultiplicativeExpression(): AST.ASTNode {
    let left = this.parseUnaryExpression();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
      const operator = this.advance().value;
      const right = this.parseUnaryExpression();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseUnaryExpression(): AST.ASTNode {
    if (this.match(TokenType.MINUS)) {
      const operator = this.advance().value;
      const operand = this.parseUnaryExpression();
      return { type: 'UnaryExpression', operator, operand };
    }

    return this.parsePostfixExpression();
  }

  private parsePostfixExpression(): AST.ASTNode {
    let expr = this.parsePrimaryExpression();

    while (true) {
      if (this.match(TokenType.DOT)) {
        this.advance();
        const property = this.expect(TokenType.IDENTIFIER).value;
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: { type: 'Identifier', name: property },
          computed: false,
        };
      } else if (this.match(TokenType.LBRACKET)) {
        this.advance();
        const property = this.parseExpression();
        this.expect(TokenType.RBRACKET);
        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          computed: true,
        };
      } else if (
        this.match(TokenType.LPAREN) ||
        (this.match(TokenType.STRING, TokenType.NUMBER, TokenType.IDENTIFIER) &&
          (expr.type === 'Identifier' || expr.type === 'MemberExpression'))
      ) {
        // Function call
        const args: AST.ASTNode[] = [];

        if (this.match(TokenType.LPAREN)) {
          this.advance();
          while (!this.match(TokenType.RPAREN)) {
            args.push(this.parseExpression());
            if (this.match(TokenType.COMMA)) {
              this.advance();
            }
          }
          this.expect(TokenType.RPAREN);
        } else {
          // Space-separated arguments (without parentheses)
          // Keep parsing while we see valid argument tokens
          while (
            (this.match(TokenType.STRING, TokenType.NUMBER, TokenType.IDENTIFIER)) &&
            !this.match(TokenType.ARROW, TokenType.ASSIGN, TokenType.EOF, TokenType.END,
                       TokenType.NEWLINE, TokenType.MAYBE, TokenType.OTHERWISE)
          ) {
            args.push(this.parsePrimaryExpression());
            if (this.match(TokenType.COMMA)) {
              this.advance();
            }
            // Stop if next token is not an argument-like token
            if (!this.match(TokenType.STRING, TokenType.NUMBER, TokenType.IDENTIFIER, TokenType.COMMA)) {
              break;
            }
          }
        }

        expr = { type: 'CallExpression', callee: expr, args };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimaryExpression(): AST.ASTNode {
    // String
    if (this.match(TokenType.STRING)) {
      const value = this.advance().value;
      return { type: 'Literal', value, raw: value };
    }

    // Number
    if (this.match(TokenType.NUMBER)) {
      const raw = this.advance().value;
      const value = parseFloat(raw);
      return { type: 'Literal', value, raw };
    }

    // Boolean
    if (this.match(TokenType.YES)) {
      this.advance();
      return { type: 'Literal', value: true, raw: 'yes' };
    }

    if (this.match(TokenType.NO)) {
      this.advance();
      return { type: 'Literal', value: false, raw: 'no' };
    }

    // Ask expression
    if (this.match(TokenType.ASK)) {
      this.advance();
      const prompt = this.parseExpression();
      return { type: 'AskExpression', prompt };
    }

    // Array literal
    if (this.match(TokenType.LBRACKET)) {
      this.advance();
      const elements: AST.ASTNode[] = [];

      while (!this.match(TokenType.RBRACKET)) {
        elements.push(this.parseExpression());
        if (this.match(TokenType.COMMA)) {
          this.advance();
        }
      }

      this.expect(TokenType.RBRACKET);
      return { type: 'ArrayLiteral', elements };
    }

    // Object literal
    if (this.match(TokenType.LBRACE)) {
      this.advance();
      const properties: Array<{ key: string; value: AST.ASTNode }> = [];

      while (!this.match(TokenType.RBRACE)) {
        const key = this.expect(TokenType.STRING).value;
        this.expect(TokenType.COLON);
        const value = this.parseExpression();
        properties.push({ key, value });

        if (this.match(TokenType.COMMA)) {
          this.advance();
        }
      }

      this.expect(TokenType.RBRACE);
      return { type: 'ObjectLiteral', properties };
    }

    // Parenthesized expression
    if (this.match(TokenType.LPAREN)) {
      this.advance();
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return expr;
    }

    // Identifier (including type names like 'Player')
    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.advance().value;
      return { type: 'Identifier', name };
    }

    throw new Error(`Unexpected token: ${this.peek().value} at line ${this.peek().line}`);
  }
}

