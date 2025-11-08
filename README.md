# Flick Programming Language

A modern, expressive programming language with a focus on readability and developer experience. Flick features a unique syntax that eliminates parentheses for function calls, making code more natural to read.

## Features

✨ **Space-Separated Function Calls** - No parentheses needed  
🔌 **Plugin System** - Extensible with built-in plugins (web, files, time, random)  
🌐 **Web Server (Gazelle)** - Built-in HTTP server with routing and nested modules  
📦 **JavaScript/TypeScript Imports** - Use npm packages and Node.js modules seamlessly  
🎯 **Type Inference** - Smart type handling with automatic conversions  
🔄 **Modern Control Flow** - Intuitive syntax for loops and conditionals

## Installation

```bash
npm install -g runflick
```

## Usage

```bash
# Run a Flick file
flick run yourfile.fk
```

## Syntax Examples

### Variables
```flick
free name = "Alice"          # Mutable variable
lock maxUsers = 100          # Immutable constant
free count = num "42"        # Type conversion
```

### Functions (Tasks)
```flick
task greet with literal(name) =>
    print "Hello, " and name
end

greet "World"  # No parentheses!
```

### Conditionals
```flick
assume age >= 18 =>
    print "Adult"
maybe age >= 13 =>
    print "Teenager"
otherwise =>
    print "Child"
end
```

### Loops
```flick
# For-each loop
each item in items =>
    print item
end

# Range loop
march i from 1 to 10 =>
    print i
end
```

### Groups (Classes)
```flick
group Player {
    free num health = 100
    free literal name
    
    task takeDamage with num(amount) =>
        health := health - amount
        print name and " took damage!"
    end
}

free player = Player "Alice"
player/takeDamage 15 # You can also use dot notation! <player.takeDamage 15>
```

### Blueprints (Interfaces)
```flick
blueprint Drawable {
    task draw
}

do Drawable for Player =>
    task draw =>
        print "Drawing player: " and name
    end
end
```

### JavaScript/TypeScript Imports
```flick
import {readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

free content = readFileSync "package.json", "utf-8"
free data = JSON/parse content
print data/name

writeFileSync "output.txt", "Hello from Flick!"
```

### Web Server (Gazelle Plugin)
```flick
declare web@3000

route GET "/" =>
    respond "Welcome to Flick!"
end

route POST "/api/users" =>
    free user = body
    respond json={"id": 1, "name": user.name}, status=201
end

# Access request data
route GET "/search" =>
    print query/term
    print headers["user-agent"]
    respond json=query
end
```

### Nested Routing
```flick
# main.fk
declare web@8080
use AuthRoutes

route "/" =>
    respond "Home"
end

route "/auth" -> AuthRoutes
```

```flick
# AuthRoutes.fk
declare web@module

route "/login" =>
    respond json={"token": "abc123"}
end

route POST "/logout" =>
    respond json={"success": yes}
end
```

### Built-in Plugins

#### Files Plugin
```flick
declare files

free content = read "file.txt"
write "output.txt", "Hello"
assume exists "config.json" =>
    print "Config found!"
end
```

#### Time Plugin
```flick
declare time

free timestamp = now
print timestamp

sleep 1000  # Wait 1 second
print "Done waiting"
```

#### Random Plugin
```flick
declare random

free randNum = random
free dice = randint 1, 6
free shuffled = shuffle myArray
free pick = choice myArray
```

## File Extension

Flick files use the `.fk` extension.

## Keywords

**Control Flow:** `assume`, `maybe`, `otherwise`, `each`, `march`, `select`, `when`  
**Declarations:** `group`, `blueprint`, `task`, `free`, `lock`, `declare`, `use`, `import`  
**Statements:** `print`, `respond`, `route`, `do`, `for`, `with`, `in`, `from`, `to`  
**Booleans:** `yes`, `no`  
**Types:** `num`, `literal`  
**Operators:** `:= / =` (assignment), `and` (concatenation in print)

## Special Features

### Auto-calling Functions in Print
```flick
free x = random  # Automatically calls random() when printed
print x          # Prints a random number
```

### Empty Checks
Empty strings, empty arrays, and empty objects are falsy:
```flick
assume body =>  # True if body is not empty
    print "Has data"
end
```

### Request Handling (Web Plugin)
Available in route handlers:
- `req` - Full request object
- `body` - Parsed request body (JSON auto-parsed)
- `query` - Query parameters object
- `headers` - Request headers object

## Example: Complete Web API

```flick
declare web@3000
declare files

free database = JSON/parse (read "db.json")

route GET "/api/users" =>
    respond json=database.users
end

route POST "/api/users" =>
    free user = body
    free userId = database/users/length + 1
    # Add user to database...
    respond json={"id": userId, "name": user.name}, status=201
end

route GET "/api/users/:id" =>
    free userId = query/id
    respond json={"message": "User " + userId}
end
```

## License

ISC