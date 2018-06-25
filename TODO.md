# TODO list

## Errors to validate

* Incorrect variable name in nested for loops

```
for srv in servers
  ...
  for serv in servers
    ...
      [series]
        entity = @{serv} // now this is considered as an error
  endfor
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