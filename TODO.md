# TODO list

## Errors to validate

* Incomplete `for` loop:

```
for srv in servers
// no matching endfor
```

* Unknown variable in loop

```
for srv in servers
    entity = ${server}
endfor
```

* Non-existent series when referred by alias: value('s1')

```
[series]
  alias = s1

[series]
  value = value('s2') * 2
```

* Spelling of parameters, especially `starttime`.

## Features

* Document formatting
* Syntax highlighting