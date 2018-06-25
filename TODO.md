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

* Spelling of parameters, especially `starttime`.

## Features

* Document formatting