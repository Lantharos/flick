# Flick Window Plugin 🪟

**Modern, beautiful desktop GUIs with one keyword.**

The Window plugin brings powerful, cross-platform GUI capabilities to Flick. No more ugly Tkinter interfaces or complex setup - just clean syntax and beautiful, modern windows powered by Electron.

## Installation

The Window plugin is built-in to Flick. Just make sure you have Electron installed:

```bash
npm install electron --save-dev
```

## Quick Start

Create a file called `hello.fk`:

```flick
declare window

Window.open "My First Window", width=500, height=400

Window.heading "Hello, World! 👋"
Window.print "This is my first Flick GUI!"

Window.button "Click Me!", =>
    Window.alert "Hello from Flick! 🎉"
end
```

Run it:

```bash
flick hello.fk
```

That's it! A beautiful, modern window opens with your content.

## Core Methods

### Window Management

#### `Window.open(title, options)`
Opens a new window.

```flick
Window.open "My App", width=800, height=600
Window.open "Custom Window", width=1000, height=700, resizable=no, frame=yes
```

**Options:**
- `width`: Window width in pixels (default: 800)
- `height`: Window height in pixels (default: 600)
- `resizable`: Can the window be resized? (default: yes)
- `frame`: Show window frame/title bar? (default: yes)
- `backgroundColor`: Background color (default: "#ffffff")

#### `Window.close()`
Closes the window.

```flick
Window.close
```

#### `Window.clear()`
Clears all content from the window.

```flick
Window.clear
```

### Content Display

#### `Window.heading(text)`
Adds a large heading.

```flick
Window.heading "Welcome to My App!"
```

#### `Window.print(text, options)`
Adds text to the window.

```flick
Window.print "Regular text"
Window.print "Styled text", style={color: "#667eea", fontSize: "18px"}
Window.print "Custom class", className="success"
```

**Available classes:** `success`, `error`, `info`, `warning`

#### `Window.card(content)`
Adds a card container with HTML content.

```flick
Window.card "<h3>Card Title</h3><p>Card content goes here.</p>"
```

#### `Window.divider()`
Adds a horizontal divider line.

```flick
Window.divider
```

### Interactive Elements

#### `Window.button(label, callback)`
Adds a button with an optional click handler.

```flick
Window.button "Click Me!", =>
    Window.alert "Button clicked!"
end

Window.button "Say Hello", =>
    Window.print "Hello was clicked!"
end
```

#### `Window.alert(message)`
Shows an alert dialog.

```flick
Window.alert "This is an alert!"
```

#### `Window.prompt(label, defaultValue)`
Shows a prompt dialog and returns the user's input.

```flick
free name = Window.prompt "What's your name?", "Friend"
Window.print "Hello, " + name + "!"
```

### Form Inputs

#### `Window.input(options)`
Adds an input field and returns its ID for later retrieval.

```flick
free nameInput = Window.input label="Your Name", placeholder="Enter name..."
free emailInput = Window.input label="Email", type="email"
free passwordInput = Window.input label="Password", type="password"
```

**Options:**
- `label`: Label text above the input
- `placeholder`: Placeholder text
- `type`: Input type (text, email, password, number, etc.)

#### `Window.getInputValue(inputId)`
Retrieves the current value of an input field.

```flick
free nameInput = Window.input label="Name"
Window.button "Submit", =>
    free name = Window.getInputValue nameInput
    Window.alert "Hello, " + name + "!"
end
```

### Media

#### `Window.image(src, options)`
Displays an image.

```flick
Window.image "https://example.com/image.jpg"
Window.image "local-image.png", width=400, height=300
```

**Options:**
- `width`: Image width in pixels
- `height`: Image height in pixels

### Layout

#### `Window.grid(columns, items)`
Creates a grid layout.

```flick
Window.grid 3, ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6"]
Window.grid 2, ["Left", "Right"]
```

### Graphics (Canvas)

#### `Window.canvas(width, height)`
Creates a canvas for drawing shapes and returns a drawer object.

```flick
free canvas = Window.canvas 500, 400
canvas.rect 50, 50, 100, 80, color="#667eea"
canvas.circle 200, 100, 40, color="#764ba2"
canvas.line 50, 200, 300, 200, color="#333", width=2
canvas.text "Hello!", 100, 250, font="20px sans-serif"
```

#### Canvas Methods

**`rect(x, y, width, height, options)`**
Draws a rectangle.

```flick
canvas.rect 10, 10, 100, 50, color="#667eea"
canvas.rect 10, 10, 100, 50, color="#764ba2", stroke=yes, strokeWidth=2
```

**`circle(x, y, radius, options)`**
Draws a circle.

```flick
canvas.circle 150, 100, 50, color="#f093fb"
canvas.circle 150, 100, 50, fill=no, stroke=yes, strokeColor="#333"
```

**`line(x1, y1, x2, y2, options)`**
Draws a line.

```flick
canvas.line 0, 0, 200, 200, color="#333", width=3
```

**`text(text, x, y, options)`**
Draws text.

```flick
canvas.text "Hello Canvas!", 50, 50, color="#333", font="24px sans-serif"
```

## Complete Examples

### Simple Hello World

```flick
declare window

Window.open "Hello!", width=400, height=300

Window.heading "Hello, Flick! 👋"
Window.print "This is a simple window."

Window.button "Click Me", =>
    Window.alert "You clicked it! 🎉"
end
```

### Form with Inputs

```flick
declare window

Window.open "Registration Form", width=500, height=600

Window.heading "Sign Up"

free nameInput = Window.input label="Full Name", placeholder="John Doe"
free emailInput = Window.input label="Email", type="email", placeholder="john@example.com"
free passwordInput = Window.input label="Password", type="password"

Window.button "Register", =>
    free name = Window.getInputValue nameInput
    free email = Window.getInputValue emailInput
    free password = Window.getInputValue passwordInput
    
    if name == "" or email == "" or password == ""
        Window.alert "Please fill in all fields!"
    otherwise
        Window.alert "Welcome, " + name + "! Registration complete."
    end
end
```

### Canvas Graphics

```flick
declare window

Window.open "Graphics Demo", width=600, height=500

Window.heading "Canvas Drawing"

free canvas = Window.canvas 500, 400

// Draw a house
canvas.rect 150, 200, 200, 150, color="#8B4513"
canvas.rect 200, 250, 50, 100, color="#654321"
canvas.circle 215, 295, 5, color="#FFD700"

// Roof
canvas.line 150, 200, 250, 120, color="#DC143C", width=8
canvas.line 250, 120, 350, 200, color="#DC143C", width=8

// Sun
canvas.circle 450, 80, 40, color="#FFD700"

// Ground
canvas.rect 0, 350, 500, 50, color="#228B22"

Window.print "A simple house drawn with canvas!"
```

### Interactive App

```flick
declare window

task showGreeting
    free name = Window.prompt "What's your name?", "Friend"
    free age = Window.prompt "How old are you?", "25"
    
    Window.clear
    Window.heading "Hello, " + name + "! 👋"
    Window.card "<h3>Your Profile</h3><p>Name: " + name + "</p><p>Age: " + age + "</p>"
    
    Window.button "Reset", =>
        showGreeting
    end
end

Window.open "Interactive Demo", width=500, height=400
showGreeting
```

## Design Philosophy

The Window plugin follows these principles:

1. **Zero Setup**: Just `declare window` and go
2. **Beautiful by Default**: Modern gradients, clean fonts, smooth animations
3. **Simple API**: Intuitive method names, sensible defaults
4. **Powerful**: Full canvas drawing, forms, layouts, and interactivity
5. **Cross-Platform**: Works on Windows, macOS, and Linux via Electron

## Styling

All elements use modern, beautiful styles out of the box:

- **Buttons**: Gradient backgrounds, hover effects, smooth shadows
- **Inputs**: Clean borders, focus states, proper spacing
- **Cards**: Subtle shadows, rounded corners
- **Typography**: System fonts for native feel
- **Colors**: Carefully chosen palette (purples, gradients)

You can customize with inline styles or CSS classes.

## Tips & Tricks

### Chaining Canvas Calls

Canvas methods return the drawer object, so you can chain them:

```flick
Window.canvas(400, 300)
    .rect(10, 10, 50, 50, color="#667eea")
    .circle(100, 35, 25, color="#764ba2")
    .text("Chained!", 150, 35)
```

### Dynamic Updates

Call methods again to add more content:

```flick
Window.heading "Counter"
free count = 0

task increment
    count = count + 1
    Window.clear
    Window.heading "Count: " + str(count)
    Window.button "Add 1", => increment end
end

increment
```

### Responsive Layouts

Use grid layouts for responsive designs:

```flick
Window.grid 3, ["Card 1", "Card 2", "Card 3"]  // 3 columns on wide screens
```

## Comparison to Tkinter

| Feature | Flick Window | Tkinter |
|---------|--------------|---------|
| Setup | `declare window` | Import, create root, configure |
| Styling | Beautiful by default | Plain, requires custom styling |
| Buttons | `Window.button "Click", => ... end` | `Button(root, text=..., command=...)` |
| Modern UI | ✅ Gradients, shadows, animations | ❌ 1990s look |
| Learning Curve | Minutes | Hours |
| Cross-platform | ✅ Electron | ⚠️ Varies by OS |

## Performance

The Window plugin uses Electron, which provides:

- **Fast rendering** via Chromium engine
- **Native feel** across all platforms
- **GPU acceleration** for smooth animations
- **Minimal memory** footprint for simple apps

## Troubleshooting

**Window doesn't open:**
- Make sure Electron is installed: `npm install electron --save-dev`
- Check that you're running the script with `flick yourfile.fk`

**Slow to open:**
- First launch may take a few seconds as Electron initializes
- Subsequent operations are instant

**Window closes immediately:**
- Make sure your script doesn't end immediately after opening
- Add interactive elements or use `Window.prompt` to keep it open

## Future Enhancements

Coming soon:
- Menu bars and context menus
- Drag & drop file support
- System tray integration
- Multiple windows
- Web view embeds
- Custom CSS themes
- Animation API

## Contributing

Found a bug or want a feature? Open an issue on the Flick repository!

---

**Built with ❤️ for the Flick programming language.**

*Making desktop GUIs beautiful, simple, and fast.*
