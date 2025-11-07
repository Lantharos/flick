Build a TypeScript interpreter for a simple programming language called Flick.

### Language Goals
- Syntax must support:
  >   - `group` (structs, data types with fields/initializers)
  - `blueprint` (interfaces/traits: method contracts)
  - `task` (function/method, can take named args)
  - `free` (mutable variable, let in typescript), `lock` (immutable variable, const)
  - `assume` / `maybe` / `otherwise` (if-else chains)
  - `each` (for), `march` (for-each/range)
  - `suppose` (pattern-match/switch)
  - `oopsie` (try), `attempt` (catch)
  - support inline comments (#)
  - allow `and` (concatenation), infix math, boolean logic, variable assignment (:=)
  - can query/assign struct fields: `health := health - amount`
  - allow arrays and maps: `lock names = ["Alice", "Bob"]`, `free config = {"mode": "production"}`
  - Input (`ask "when?"`)

### Interpreter Requirements
- Parse the example Flick program and evaluate it, printing output as indicated by the Flick code.
- Tasks must be definable and callable, including those with parameters and fields (methods).
- `group` and `blueprint` support data, field, and method semantics.
- Variables must support assignment, mutability, and scope.
- Control flow: handle Flick’s unique keywords for loops, conditionals, pattern matching.
- Comments must be ignored during parse.
- Math and logic: support addition, comparison ops, boolean values.
- Strings, numbers, lists, maps/objects as value types.
- Print statements concatenate args with `and`.

### Flick Example Code

```flick
group Player {
    free num health = 100
    free literal name

    task greet =>
        print "Hello, I am " and name
    end
}

blueprint Damageable {
    task takeDamage with num(amount)
}

do Damageable for Player =>
    task takeDamage with num(amount) =>
        health := health - amount
        print name and " took " and amount and " damage!"
    end
end

free Player player = Player "Vikki"
player.greet
player.takeDamage 15

free isActive = yes
lock names = ["Alice", "Bob", "Charlie"]
lock wow = ask "when?"

each name in names =>
    print name
    print "Meow"
end

march number from 1 to 5 =>
    print "Number: " and number
    print "It +50 is: " and number + 50
end

assume isActive =>
    print "It's active!"
maybe wow == "wow" => 
    isActive := yes
otherwise => 
    print "Not active :("
end

free config = {"mode":"production"}
select config =>
    when "mode" => suppose config["mode"] == "production" => print "Production mode enabled."
    when "debug" => print "Debug setting found"
end

# def: does something idk
# params: literal(sus) and num(meow)
task doSomething with literal(sus), num(meow) =>
    print "Hi " and sus and ", number is " and num
end

doSomething "Amogus", 10
```

### Implementation
- Write a TypeScript program that parses this language and runs its logic.
- Don’t “mock” features; implement real parsing and evaluation for every Flick feature shown.
- Everything else (web capabilities, plugins, etc.) can be skipped for now.