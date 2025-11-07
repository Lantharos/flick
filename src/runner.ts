// Runner for Flick interpreter

import { readFileSync } from 'node:fs';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Interpreter } from './interpreter.js';

async function runFlick(filePath: string): Promise<void> {
  try {
    // Read the source code
    const sourceCode = readFileSync(filePath, 'utf-8');

    // Tokenize
    const lexer = new Lexer(sourceCode);
    const tokens = lexer.tokenize();

    // Parse
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Interpret
    const interpreter = new Interpreter();
    await interpreter.interpret(ast);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Get file path from command line arguments
const filePath = process.argv[2] || 'test.flick';
runFlick(filePath);

