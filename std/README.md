# Point Standard Library

Standard library modules are ordinary semantic Point files:

- `std.text`
- `std.json`
- `std.http`
- `std.time`
- `std.fs`
- `std.env`

User code imports them with `use std.<module>`.

## Modules

### std.text

- `concat text(left: Text, right: Text): Text`
- `text length(value: Text): Int`
- `text contains(value: Text, search: Text): Bool`
- `text split(value: Text, separator: Text): List<Text>`
- `text trim(value: Text): Text`

### std.json

- `parse json(value: Text): Text or Error`
- `stringify json(value: Text): Text`

### std.http

- `http get(url: Text): Text or Error`
- `http post(url: Text, body: Text): Text or Error`

### std.time

- `current time(): Text`
- `wait milliseconds(ms: Int): Void`
- `format time(value: Text): Text`

### std.fs

- `read file(path: Text): Text or Error`
- `write file(path: Text, contents: Text): Void or Error`

### std.env

- `get env var(name: Text): Maybe<Text>`
- `env with default(value: Maybe<Text>, default value: Text): Text`
