// Window Plugin for Flick - Modern GUI with Electron
// Provides clean, fast, and modern desktop GUI capabilities

import { Plugin, PluginContext } from '../plugin.js';
import * as AST from '../ast.js';
import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

interface WindowConfig {
  title: string;
  width: number;
  height: number;
  resizable: boolean;
  frame: boolean;
  backgroundColor: string;
}

interface WindowElement {
  type: string;
  id: string;
  props: any;
}

class WindowManager {
  private process: ChildProcess | null = null;
  private tempDir: string;
  private htmlPath: string;
  private stateFilePath: string;
  private elements: WindowElement[] = [];
  private callbacks: Map<string, Function> = new Map();
  private nextId: number = 0;
  private isReady: boolean = false;
  private config: WindowConfig = {
    title: 'Flick Window',
    width: 800,
    height: 600,
    resizable: true,
    frame: true,
    backgroundColor: '#ffffff'
  };

  constructor() {
    this.tempDir = join(tmpdir(), `flick-window-${Date.now()}`);
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
    this.htmlPath = join(this.tempDir, 'window.html');
    this.stateFilePath = join(this.tempDir, 'state.json');
    
    // Initialize state file
    this.saveState();
  }

  private serializeStyle(style: any): string | undefined {
    if (!style || typeof style !== 'object') return undefined;

    const parts: string[] = [];
    for (const [key, value] of Object.entries(style)) {
      const cssKey = key.replace(/[A-Z]/g, match => '-' + match.toLowerCase());
      const cssValue = typeof value === 'number' ? `${value}px` : String(value);
      parts.push(`${cssKey}: ${cssValue}`);
    }

    return parts.join('; ');
  }

  open(title?: string, options: any = {}): void {
    if (this.process) {
      console.log('[Window] Window already open');
      return;
    }

    // Update config
    if (title) this.config.title = title;
    if (options.width) this.config.width = options.width;
    if (options.height) this.config.height = options.height;
    if (options.resizable !== undefined) this.config.resizable = options.resizable;
    if (options.frame !== undefined) this.config.frame = options.frame;
    if (options.backgroundColor) this.config.backgroundColor = options.backgroundColor;

    // Generate HTML
    this.generateHTML();

    // Create Electron main script
    this.createElectronMain();

    // Launch Electron
    this.launchElectron();
  }

  private generateHTML(): void {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: ${this.config.backgroundColor};
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .text-element {
            margin: 10px 0;
            font-size: 16px;
        }

        .heading {
            font-size: 28px;
            font-weight: 600;
            margin: 20px 0 10px 0;
            color: #1a1a1a;
        }

        .button {
            background: #0066cc;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 500;
            border-radius: 4px;
            cursor: pointer;
            margin: 8px 8px 8px 0;
        }

        .button:hover {
            background: #0052a3;
        }

        .button:active {
            background: #003d7a;
        }

        .input-group {
            margin: 15px 0;
        }

        .input-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #333;
            font-size: 14px;
        }

        .input-field {
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-family: inherit;
            box-sizing: border-box;
        }

        .input-field:focus {
            outline: none;
            border-color: #0066cc;
        }

        .image {
            max-width: 100%;
            height: auto;
            margin: 15px 0;
        }

        .canvas-container {
            margin: 15px 0;
        }

        canvas {
            display: block;
            border: 1px solid #ddd;
        }

        .grid-container {
            display: grid;
            gap: 15px;
            margin: 15px 0;
        }

        .grid-item {
            padding: 15px;
            background: #fafafa;
            border: 1px solid #ddd;
        }

        .card {
            background: #fafafa;
            padding: 15px;
            margin: 10px 0;
            border: 1px solid #ddd;
        }

    .divider {
      height: 1px;
      background: #ddd;
      margin: 20px 0;
    }

        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
        }

        .button:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }

        .input-group {
            margin: 15px 0;
        }

        .input-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #555;
            font-size: 14px;
        }

        .input-field {
            width: 100%;
            padding: 12px 16px;
            font-size: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            transition: all 0.3s ease;
            font-family: inherit;
        }

        .input-field:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .image {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 15px 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .canvas-container {
            margin: 15px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        canvas {
            display: block;
            border-radius: 8px;
        }

        .grid-container {
            display: grid;
            gap: 15px;
            margin: 15px 0;
        }

        .grid-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }

        .card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            border: 1px solid #e9ecef;
        }

        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #ddd, transparent);
            margin: 20px 0;
        }

        .success {
            color: #10b981;
            font-weight: 500;
        }

        .error {
            color: #ef4444;
            font-weight: 500;
        }

        .info {
            color: #3b82f6;
            font-weight: 500;
        }

        .warning {
            color: #f59e0b;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container" id="root"></div>
    <script>
        const { ipcRenderer } = require('electron');

        // Listen for render commands
        ipcRenderer.on('render', (event, elements) => {
            const root = document.getElementById('root');
            root.innerHTML = '';
            
            elements.forEach(elem => {
                const el = createElement(elem);
                if (el) root.appendChild(el);
            });
        });

    function createElement(elem) {
      switch (elem.type) {
        case 'text':
            const text = document.createElement('div');
            text.className = 'text-element ' + (elem.props.className || '');
            text.textContent = elem.props.content;
                    if (elem.props.style) {
                        text.style.cssText = elem.props.style;
                    }
            return text;

        case 'heading':
          const heading = document.createElement('h1');
          heading.className = 'heading ' + (elem.props.className || '');
          heading.textContent = elem.props.content;
                  if (elem.props.style) {
                      heading.style.cssText = elem.props.style;
                  }
          return heading;

        case 'button':
          const button = document.createElement('button');
          button.className = 'button ' + (elem.props.className || '');
          button.id = elem.id;
          button.textContent = elem.props.label;
                  if (elem.props.style) {
                      button.style.cssText = elem.props.style;
                  }
          button.onclick = () => {
            ipcRenderer.send('button-click', elem.id);
          };
          return button;

                case 'input':
                    const inputGroup = document.createElement('div');
                    inputGroup.className = 'input-group';
                    
                    if (elem.props.label) {
                        const label = document.createElement('label');
                        label.className = 'input-label';
                        label.textContent = elem.props.label;
                        inputGroup.appendChild(label);
                    }
                    
                    const input = document.createElement('input');
                    input.className = 'input-field';
                    input.type = elem.props.type || 'text';
                    input.placeholder = elem.props.placeholder || '';
                    input.id = elem.id;
                    inputGroup.appendChild(input);
                    
                    return inputGroup;

                case 'image':
                    const img = document.createElement('img');
                    img.className = 'image';
                    img.src = elem.props.src;
                    if (elem.props.width) img.style.width = elem.props.width + 'px';
                    if (elem.props.height) img.style.height = elem.props.height + 'px';
                    return img;

                case 'canvas':
                    const canvasContainer = document.createElement('div');
                    canvasContainer.className = 'canvas-container';
                    const canvas = document.createElement('canvas');
                    canvas.id = elem.id;
                    canvas.width = elem.props.width || 400;
                    canvas.height = elem.props.height || 300;
                    canvasContainer.appendChild(canvas);
                    
                    // Draw shapes if provided
                    if (elem.props.shapes) {
                        setTimeout(() => {
                            const ctx = canvas.getContext('2d');
                            elem.props.shapes.forEach(shape => {
                                drawShape(ctx, shape);
                            });
                        }, 10);
                    }
                    
                    return canvasContainer;

                case 'grid':
                    const grid = document.createElement('div');
                    grid.className = 'grid-container';
                    grid.style.gridTemplateColumns = \`repeat(\${elem.props.columns || 2}, 1fr)\`;
                    
                    elem.props.items.forEach(item => {
                        const gridItem = document.createElement('div');
                        gridItem.className = 'grid-item';
                        gridItem.textContent = item;
                        grid.appendChild(gridItem);
                    });
                    
                    return grid;

                case 'card':
                  const card = document.createElement('div');
                  card.className = 'card ' + (elem.props.className || '');
                  card.innerHTML = elem.props.content;
                  if (elem.props.style) {
                      card.style.cssText = elem.props.style;
                  }
                  return card;

                case 'divider':
                    const divider = document.createElement('div');
                    divider.className = 'divider';
                    return divider;

                default:
                    return null;
            }
        }

        function drawShape(ctx, shape) {
            ctx.fillStyle = shape.color || '#667eea';
            ctx.strokeStyle = shape.strokeColor || '#667eea';
            ctx.lineWidth = shape.strokeWidth || 1;

            switch (shape.type) {
                case 'rect':
                    if (shape.fill !== false) {
                        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                    }
                    if (shape.stroke) {
                        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                    }
                    break;

                case 'circle':
                    ctx.beginPath();
                    ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
                    if (shape.fill !== false) {
                        ctx.fill();
                    }
                    if (shape.stroke) {
                        ctx.stroke();
                    }
                    break;

                case 'line':
                    ctx.beginPath();
                    ctx.moveTo(shape.x1, shape.y1);
                    ctx.lineTo(shape.x2, shape.y2);
                    ctx.stroke();
                    break;

                case 'text':
                    ctx.font = shape.font || '16px sans-serif';
                    ctx.fillText(shape.text, shape.x, shape.y);
                    break;
            }
        }

        // Listen for alert requests
        ipcRenderer.on('alert', (event, message) => {
            alert(message);
        });

        // Get input value
        ipcRenderer.on('get-input-value', (event, inputId) => {
            const input = document.getElementById(inputId);
            const value = input ? input.value : null;
            ipcRenderer.send('input-value-response', value);
        });
    </script>
</body>
</html>`;

    writeFileSync(this.htmlPath, html);
  }

  private createElectronMain(): void {
    const mainScript = `const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const stateFilePath = '${this.stateFilePath.replace(/\\/g, '\\\\')}';
const callbackDir = '${this.tempDir.replace(/\\/g, '\\\\')}';
let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: ${this.config.width},
        height: ${this.config.height},
        resizable: ${this.config.resizable},
        frame: ${this.config.frame},
        backgroundColor: '${this.config.backgroundColor}',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('${this.htmlPath.replace(/\\/g, '\\\\')}');

    // Poll for state changes
    let lastState = null;
    setInterval(() => {
        try {
            const stateContent = fs.readFileSync(stateFilePath, 'utf-8');
            if (stateContent !== lastState) {
                lastState = stateContent;
                const state = JSON.parse(stateContent);
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('render', state.elements);
                }
            }
        } catch (error) {
            // Ignore read errors
        }
    }, 100);
    
    // Poll for alert requests
    setInterval(() => {
        const alertFile = path.join(callbackDir, 'alert-request.txt');
        if (fs.existsSync(alertFile)) {
            try {
                const message = fs.readFileSync(alertFile, 'utf-8');
                fs.unlinkSync(alertFile);
                if (mainWindow && !mainWindow.isDestroyed()) {
                    dialog.showMessageBoxSync(mainWindow, {
                        type: 'info',
                        message: message,
                        buttons: ['OK']
                    });
                }
            } catch (error) {}
        }
    }, 100);
    
    // Poll for input value requests
    setInterval(() => {
        const inputFile = path.join(callbackDir, 'input-request.json');
        if (fs.existsSync(inputFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
                fs.unlinkSync(inputFile);
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('get-input-value', data.inputId);
                }
            } catch (error) {}
        }
    }, 100);

    mainWindow.on('closed', () => {
        mainWindow = null;
        // Kill the parent process too
        if (process.send) {
            process.send({ type: 'window-closed' });
        }
        setTimeout(() => process.exit(0), 100);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle button clicks from renderer
ipcMain.on('button-click', (event, id) => {
    const callbackFile = path.join(callbackDir, 'callback-' + id + '.txt');
    fs.writeFileSync(callbackFile, Date.now().toString());
});

// Handle input value requests
ipcMain.on('input-value-response', (event, value) => {
    const inputFile = path.join(callbackDir, 'input-response.txt');
    fs.writeFileSync(inputFile, value || '');
});
`;

    const mainScriptPath = join(this.tempDir, 'main.js');
    writeFileSync(mainScriptPath, mainScript);
  }

  private launchElectron(): void {
    const mainScriptPath = join(this.tempDir, 'main.js');
    
    // Try to use npx electron, or electron if installed globally
    this.process = spawn('npx', ['electron', mainScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      shell: true
    });

    if (this.process.stderr) {
      this.process.stderr.on('data', (data) => {
        // Suppress common Electron warnings
        const str = data.toString();
        if (!str.includes('Electron Security Warning') && 
            !str.includes('deprecation') &&
            !str.includes('ExtensionLoadWarning')) {
          // Silent - only log actual errors
        }
      });
    }

    if (this.process.stdout) {
      this.process.stdout.on('data', (data) => {
        // Silent
      });
    }

    // Handle messages from Electron
    this.process.on('message', (msg: any) => {
      if (msg.type === 'button-click') {
        const callback = this.callbacks.get(msg.id);
        if (callback) {
          callback();
        }
      } else if (msg.type === 'input-value-response') {
        (this as any).lastInputValue = msg.value;
      } else if (msg.type === 'window-closed') {
        console.log('[Window] Window closed by user');
        process.exit(0);
      }
    });

    this.process.on('exit', () => {
      this.process = null;
      process.exit(0);
    });

    console.log('[Window] Opening window...');
    
    // Mark as ready immediately since Electron will handle the polling
    setTimeout(() => {
      this.isReady = true;
      // Do an initial render to trigger state save
      this.saveState();
    }, 100);
  }

  private sendToElectron(msg: any): void {
    if (this.process && this.process.send && this.process.connected) {
      try {
        this.process.send(msg);
      } catch (error) {
        console.error('[Window] Failed to send message to Electron:', error);
      }
    } else {
      console.warn('[Window] Cannot send message - process not ready');
    }
  }

  print(content: string, options: any = {}): void {
    console.log('[Window] Adding text:', content.substring(0, 50));
    const id = `text-${this.nextId++}`;
    const serializedStyle = this.serializeStyle(options.style);
    this.elements.push({
      type: 'text',
      id,
      props: { 
        content, 
        className: options.className || '',
        style: serializedStyle
      }
    });
    this.render();
  }

  heading(content: string, options: any = {}): void {
    console.log('[Window] Adding heading:', content);
    const id = `heading-${this.nextId++}`;
    const serializedStyle = this.serializeStyle(options.style);
    this.elements.push({
      type: 'heading',
      id,
      props: {
        content,
        className: options.className || '',
        style: serializedStyle
      }
    });
    this.render();
  }

  button(label: string, onClickOrOptions?: any, maybeOptions?: any): void {
    const id = `button-${this.nextId++}`;
    let onClick: Function | undefined;
    let options: any = {};

    if (typeof onClickOrOptions === 'function') {
      onClick = onClickOrOptions as Function;
      if (maybeOptions && typeof maybeOptions === 'object') {
        options = maybeOptions;
      }
    } else if (onClickOrOptions && typeof onClickOrOptions === 'object') {
      options = onClickOrOptions;
    }

    console.log(`[Window] Adding button: ${label} with id: ${id}, has callback: ${!!onClick}`);
    if (onClick) {
      this.callbacks.set(id, onClick);
      // Start polling for this button's callback file
      this.pollForCallback(id, onClick);
    }
    const serializedStyle = this.serializeStyle(options.style);
    this.elements.push({
      type: 'button',
      id,
      props: {
        label,
        className: options.className || '',
        style: serializedStyle
      }
    });
    this.render();
  }

  private pollForCallback(id: string, callback: Function): void {
    const callbackFilePath = join(this.tempDir, `callback-${id}.txt`);
    console.log(`[Window] Starting to poll for callback file: ${callbackFilePath}`);
    const { existsSync, unlinkSync } = require('fs');
    
    let isExecuting = false; // Prevent duplicate execution
    
    const checkFile = () => {
      if (isExecuting) {
        setTimeout(checkFile, 200);
        return;
      }
      
      if (existsSync(callbackFilePath)) {
        isExecuting = true;
        try {
          console.log(`[Window] Callback file found for ${id}, executing callback`);
          unlinkSync(callbackFilePath); // Delete it immediately
          
          // Execute the callback - it returns a promise
          const result = callback();
          if (result && typeof result.then === 'function') {
            result.then(() => {
              console.log(`[Window] Async callback completed for ${id}`);
              isExecuting = false;
            }).catch((error: any) => {
              console.error(`[Window] Error in async callback:`, error);
              isExecuting = false;
            });
          } else {
            console.log(`[Window] Sync callback completed for ${id}`);
            isExecuting = false;
          }
        } catch (error) {
          console.error(`[Window] Error executing callback:`, error);
          isExecuting = false;
        }
      }
      
      // Keep polling if process is still alive
      if (this.process && !this.process.killed) {
        setTimeout(checkFile, 200);
      }
    };
    
    // Start polling after window is ready
    setTimeout(checkFile, 2000);
  }

  input(options: any = {}): string {
    const id = `input-${this.nextId++}`;
    this.elements.push({
      type: 'input',
      id,
      props: {
        label: options.label || '',
        type: options.type || 'text',
        placeholder: options.placeholder || ''
      }
    });
    this.render();
    return id; // Return ID for later retrieval
  }

  async getInputValue(inputId: string): Promise<string> {
    const requestFilePath = join(this.tempDir, 'input-request.json');
    const responseFilePath = join(this.tempDir, 'input-response.txt');
    
    // Clean up any old response
    if (existsSync(responseFilePath)) {
      unlinkSync(responseFilePath);
    }
    
    // Write request
    writeFileSync(requestFilePath, JSON.stringify({ inputId }));
    
    // Wait for response
    return new Promise((resolve) => {
      const checkValue = () => {
        if (existsSync(responseFilePath)) {
          try {
            const value = readFileSync(responseFilePath, 'utf-8');
            unlinkSync(responseFilePath);
            resolve(value || '');
          } catch (error) {
            setTimeout(checkValue, 50);
          }
        } else {
          setTimeout(checkValue, 50);
        }
      };
      
      setTimeout(checkValue, 100);
    });
  }

  image(src: string, options: any = {}): void {
    const id = `image-${this.nextId++}`;
    this.elements.push({
      type: 'image',
      id,
      props: { 
        src,
        width: options.width,
        height: options.height
      }
    });
    this.render();
  }

  canvas(width: number = 400, height: number = 300): CanvasDrawer {
    const id = `canvas-${this.nextId++}`;
    const drawer = new CanvasDrawer(id, width, height);
    
    // Add element
    this.elements.push({
      type: 'canvas',
      id,
      props: {
        width,
        height,
        shapes: drawer.shapes
      }
    });
    
    return drawer;
  }

  grid(columns: number, items: any[]): void {
    const id = `grid-${this.nextId++}`;
    this.elements.push({
      type: 'grid',
      id,
      props: { columns, items }
    });
    this.render();
  }

  card(content: string, options: any = {}): void {
    const id = `card-${this.nextId++}`;
    const serializedStyle = this.serializeStyle(options.style);
    this.elements.push({
      type: 'card',
      id,
      props: {
        content,
        className: options.className || '',
        style: serializedStyle
      }
    });
    this.render();
  }

  divider(): void {
    const id = `divider-${this.nextId++}`;
    this.elements.push({
      type: 'divider',
      id,
      props: {}
    });
    this.render();
  }

  alert(message: string): void {
    const alertFilePath = join(this.tempDir, 'alert-request.txt');
    writeFileSync(alertFilePath, message);
    // Small delay to ensure it's shown
    const start = Date.now();
    while (Date.now() - start < 100) {} // Busy wait briefly
  }

  clear(): void {
    this.elements = [];
    this.render();
  }

  close(): void {
    this.sendToElectron({ type: 'close' });
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  render(): void {
    // Wait for window to be ready before rendering
    const doRender = () => {
      if (!this.isReady) {
        setTimeout(doRender, 100);
        return;
      }
      
      this.saveState();
    };
    
    doRender();
  }

  private saveState(): void {
    const state = {
      elements: this.elements,
      callbacks: Array.from(this.callbacks.keys())
    };
    
    try {
      writeFileSync(this.stateFilePath, JSON.stringify(state), 'utf-8');
      console.log(`[Window] Saved state with ${this.elements.length} elements`);
    } catch (error) {
      console.error('[Window] Failed to save state:', error);
    }
  }
}

class CanvasDrawer {
  shapes: any[] = [];
  
  constructor(
    public id: string,
    public width: number,
    public height: number
  ) {}

  rect(x: number, y: number, width: number, height: number, options: any = {}): CanvasDrawer {
    this.shapes.push({
      type: 'rect',
      x, y, width, height,
      color: options.color || '#667eea',
      fill: options.fill !== false,
      stroke: options.stroke || false,
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth
    });
    return this;
  }

  circle(x: number, y: number, radius: number, options: any = {}): CanvasDrawer {
    this.shapes.push({
      type: 'circle',
      x, y, radius,
      color: options.color || '#667eea',
      fill: options.fill !== false,
      stroke: options.stroke || false,
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth
    });
    return this;
  }

  line(x1: number, y1: number, x2: number, y2: number, options: any = {}): CanvasDrawer {
    this.shapes.push({
      type: 'line',
      x1, y1, x2, y2,
      strokeColor: options.color || '#667eea',
      strokeWidth: options.width || 2
    });
    return this;
  }

  text(text: string, x: number, y: number, options: any = {}): CanvasDrawer {
    this.shapes.push({
      type: 'text',
      text, x, y,
      color: options.color || '#333',
      font: options.font || '16px sans-serif'
    });
    return this;
  }
}

export const WindowPlugin: Plugin = {
  name: 'window',

  onDeclare(args: any) {
    console.log('[Window] Window plugin declared');
  },

  registerBuiltins(env: any, args: any) {
    const windowManager = new WindowManager();

    const Window = {
      open: (title?: string, options?: any) => {
        windowManager.open(title, options || {});
        // Wait for window to be fully ready before continuing
        return new Promise(resolve => setTimeout(resolve, 1500));
      },

      print: (content: string, options?: any) => {
        windowManager.print(content, options || {});
      },

      heading: (content: string, options?: any) => {
        windowManager.heading(content, options || {});
      },

      button: (label: string, onClick?: Function) => {
        windowManager.button(label, onClick);
      },

      input: (options?: any) => {
        return windowManager.input(options || {});
      },

      getInputValue: async (inputId: string) => {
        return await windowManager.getInputValue(inputId);
      },

      image: (src: string, options?: any) => {
        windowManager.image(src, options || {});
      },

      canvas: (width?: number, height?: number) => {
        const drawer = windowManager.canvas(width, height);
        // Auto-render after a short delay to allow chaining
        setTimeout(() => windowManager.render(), 50);
        return drawer;
      },

      grid: (columns: number, items: any[]) => {
        windowManager.grid(columns, items);
      },

      card: (content: string, options?: any) => {
        windowManager.card(content, options || {});
      },

      divider: () => {
        windowManager.divider();
      },

      alert: (message: string) => {
        windowManager.alert(message);
      },

      clear: () => {
        windowManager.clear();
      },

      close: () => {
        windowManager.close();
      }
    };

    env.vars.set('Window', { value: Window, mutable: false });
  }
};
