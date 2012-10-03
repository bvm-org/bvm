link "some path to some library or something"

seg "myFunction" 0 3 // declare exported function with 0 args that explicitly declares space for 3 local vars.
  seg "add" 2
    dup (1,0)
    dup (1,1)
    add
    return 1
  end
  push -1.34e-12
  push -0xa3
  enter (0x0,1)
  dup (0,0)
  store (2,1)
  return 0x0
end

seg "fib" 1
  ifzero (0,0) (0,1)
end

enter (0)
resolve "foo" "bar"
enter (1)
