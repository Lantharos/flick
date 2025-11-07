Extend the Flick TypeScript interpreter to support a **plugin/capability system**. Plugins enable opt-in language features that are only active in files which declare them, using the syntax:

```flick
declare web
```
or
```flick
declare fs
```

### Requirements:
- At the **top of any Flick file**, `declare <pluginname>@<optional_argument>` must activate a feature set ("capabilities") and enable any extra syntax or built-in functions provided by that plugin.
- If a file *does not* declare a capability, using any plugin features or keywords should error at parse/eval.
- Plugins may add:
  >   - New built-ins (e.g., for timers, file IO, HTTP, etc.)
  - DSL syntax (e.g., for web routing: `route "/" => respond "Hello!" end`)
  - New types or effect handlers
- The interpreter should allow multiple plugins to be declared in one file.
- Each plugin registers its features and syntax with the parser/interpreter.


### Example: Web Routing Plugin (**Gazelle**)

```flick
declare web@5000 # optional port number

route "/" =>
  respond "Hello, world!"
end

route "/auth" -> AuthRoutes
```

- If `declare web` is present, “route” and “respond” DSL is supported.
- Route handlers are auto-exported/registered.
- Forwarding (`route "/auth" -> AuthRoutes`) mounts handlers from another Flick module.
- If no routes exist in the forwarding target, emit a warning (not an error). Must only forward to another web-capable file.


### Plugins You Should Support:
- `web` (Gazelle): provides routing, HTTP request/response handling, forwarding.
- `files`: file system (read/write files, check existence, dirs, etc.).
- `time`: timers, delays, timeouts, “sleep” functions.
- `random`: random number generation, shuffle, etc.

### Implementation Details:
- Plugins are registered in a central PluginManager in the interpreter.
- The parser consults active plugins to allow/enable extra keywords and features.
- Interpreter dispatches plugin effect handlers as needed—e.g., web plugin routes to HTTP server code, fs plugin to real file IO, mock plugin to test doubles, etc.
- If a feature is used but not activated via `declare`, emit a helpful error: “Feature X requires declare Y at top of file.”

### Core Design Philosophy:
- Plugins never fork the base language—they just add powers.
- All features are opt-in and scoped; nothing is global or magic.
- This keeps Flick secure and fast, as unused/undeclared features don't bloat runtime or open hidden authority.

### Example Flick code for web plugin:

```flick
declare web@5000

route "/" =>
    respond "Hello, I am Flick!"
end

route "/auth" -> AuthRoutes
```

### Example Flick code for time/fs:
```flick
declare time
declare files

print now
print read "welcome.txt"
sleep 1000
print "done waiting"
```

---
Implement this plugin capability system, in TypeScript, so new plugins (e.g., Gazelle for web) can be added easily and existing plugins can register custom syntax and effect handlers. When a file declares a plugin, activate its features; otherwise, raise a descriptive error.