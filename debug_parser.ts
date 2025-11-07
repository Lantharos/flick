import { readFileSync } from 'node:fs';
import { Lexer } from './src/lexer';
import { Parser } from './src/parser';
import { PluginManager } from './src/plugin';

const code = `group Player {
    free literal name

    task greet =>
        print "Hello"
    end

    task takeDamage with num(amount) =>
        print "Took damage"
    end
}

free Player p = Player "Vikki"
p/greet
p/takeDamage 25
print "Test complete!"
`;

const lexer = new Lexer(code);
const tokens = lexer.tokenize();

console.log('Tokens:');
tokens.forEach((t, i) => {
    console.log(`${i}: ${t.type} = "${t.value}"`);
});

const pluginManager = new PluginManager();
const parser = new Parser(tokens, pluginManager);

try {
    const ast = parser.parse();
    console.log('\nAST:');
    console.log(JSON.stringify(ast, null, 2));
} catch (error) {
    console.error('Parse error:', error);
}

