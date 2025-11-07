// Built-in plugins for Flick

import { Plugin, PluginContext } from '../plugin.js';
import * as AST from '../ast.js';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';

// Web Plugin (Gazelle)
export const WebPlugin: Plugin = {
  name: 'web',

  onDeclare(args: any) {
    const port = args?.value || 3000;
    console.log(`[Gazelle] Web plugin declared on port ${port}`);
  },

  registerBuiltins(env: any, args: any) {
    // Can add helper functions here if needed
  },

  async execute(node: AST.ASTNode, interpreter: any, env: any): Promise<any> {
    if (node.type === 'RouteStatement') {
      // Routes are collected and handled in onFileComplete
      return null;
    }

    if (node.type === 'RespondStatement') {
      // This is called within a route handler context
      const content = await interpreter.evaluateExpression(node.content, env);
      return { __respond: true, content: interpreter.stringify(content) };
    }

    return null;
  },

  async onFileComplete(context: PluginContext) {
    const port = context.declaredPlugins.get('web')?.value || 3000;
    const routes = new Map<string, any>();

    // Collect all routes from the AST
    const collectRoutes = (node: any): void => {
      if (!node) return;

      if (node.type === 'RouteStatement') {
        routes.set(node.path, node);
      }

      if (node.body && Array.isArray(node.body)) {
        node.body.forEach(collectRoutes);
      }
      if (node.type === 'Program' && node.body) {
        node.body.forEach(collectRoutes);
      }
    };

    // Get program AST from context
    if (context.env?.__program) {
      collectRoutes(context.env.__program);
    }

    if (routes.size === 0) {
      console.log('[Gazelle] No routes defined, skipping server start');
      return;
    }

    console.log(`[Gazelle] Starting server on port ${port}...`);
    console.log(`[Gazelle] Registered routes:`);
    for (const path of routes.keys()) {
      console.log(`  - ${path}`);
    }

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const url = req.url || '/';
      const route = routes.get(url);

      if (!route) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      try {
        if (route.forward) {
          // Handle forwarding
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(`Forwarding to ${route.forward} (not fully implemented)`);
          return;
        }

        if (route.body) {
          // Execute route handler
          const interpreter = context.env.__interpreter;
          let responseContent = '';

          for (const statement of route.body) {
            const result = await interpreter.evaluateStatement(statement, context.env);
            if (result && result.__respond) {
              responseContent = result.content;
            }
          }

          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(responseContent || 'OK');
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error: ${error instanceof Error ? error.message : error}`);
      }
    });

    server.listen(port);
    console.log(`[Gazelle] Server running at http://localhost:${port}/`);
    console.log('[Gazelle] Press Ctrl+C to stop');
  }
};

// Files Plugin
export const FilesPlugin: Plugin = {
  name: 'files',

  registerBuiltins(env: any, args: any) {
    // read function
    env.vars.set('read', {
      value: (path: string) => {
        try {
          return readFileSync(path, 'utf-8');
        } catch (error) {
          throw new Error(`Failed to read file: ${path}`);
        }
      },
      mutable: false
    });

    // write function
    env.vars.set('write', {
      value: (path: string, content: string) => {
        try {
          writeFileSync(path, content, 'utf-8');
          return true;
        } catch (error) {
          throw new Error(`Failed to write file: ${path}`);
        }
      },
      mutable: false
    });

    // exists function
    env.vars.set('exists', {
      value: (path: string) => {
        return existsSync(path);
      },
      mutable: false
    });

    // listdir function
    env.vars.set('listdir', {
      value: (path: string) => {
        try {
          return readdirSync(path);
        } catch (error) {
          throw new Error(`Failed to list directory: ${path}`);
        }
      },
      mutable: false
    });
  }
};

// Time Plugin
export const TimePlugin: Plugin = {
  name: 'time',

  registerBuiltins(env: any, args: any) {
    // now - current timestamp
    env.vars.set('now', {
      value: () => Date.now(),
      mutable: false
    });

    // sleep function (returns a promise)
    env.vars.set('sleep', {
      value: (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
      },
      mutable: false
    });

    // timestamp function
    env.vars.set('timestamp', {
      value: () => new Date().toISOString(),
      mutable: false
    });
  }
};

// Random Plugin
export const RandomPlugin: Plugin = {
  name: 'random',

  registerBuiltins(env: any, args: any) {
    // random number between 0 and 1
    env.vars.set('random', {
      value: () => Math.random(),
      mutable: false
    });

    // randint - random integer in range
    env.vars.set('randint', {
      value: (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      mutable: false
    });

    // shuffle array
    env.vars.set('shuffle', {
      value: (arr: any[]) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      },
      mutable: false
    });

    // choice - pick random element from array
    env.vars.set('choice', {
      value: (arr: any[]) => {
        if (arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
      },
      mutable: false
    });
  }
};

