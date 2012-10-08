loadc "some path to some library or something"
link

seg "fib" 1
  
  loadc 0 ui32
  cmp lte
  ifnotzero (1,1)
  loadc 1 ui32
  return
end
