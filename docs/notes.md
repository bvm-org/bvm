Code Design
===========

Byte code reflects lexical structure and is in Polish notation form
(evaluation architecture is stack based).

Code file contains:

1. Header (details tbd): may indicate foreign dependencies, for
   example.
2. Declaration of space for file-level "global" variables
3. One or more procedures:
   - A procedure is just (a particular form of?) a Segment Descriptor
      (SD).
   - Segments are lexically scoped.
   - Segments can be used for code blocks rather than just
      procedures/functions/methods.
   - A Segment Descriptor (SD):
      * MAY define a name for the segment if it's an exported
         segment;
      * MUST define number of arguments to the segment;
      * MUST define the maximum number of local vars required by the
         segment;
      * MUST define the lexical scope level (LSL) of the segment;
      * The code of the segment follows the above four entries;
      * TBD: MUST contain the length of the segment - would make
         parsing the code file much faster?
   - A segment ends when an MSCW is encountered. TBD: what the
      content of the MSCW is!
   - It is legal to encounter "sub" (i.e. at a greater LSL) SDs
      anywhere within a segment body.

"Loading" a file is no different to just running a segment: the file
is considered to be a segment though it's very likely that other than
the declaration of variables and segments, no further operators will
be permitted at the global level (this is likely essential to be able
to load circularly-referential code files (see Header).

Thus essentially, loading a code file is just to map the file into
memory, and set the IP to be the start of the file and go from there.

The evaluation of a SD is to push onto the task's stack a Segment
Control Word (SCW). This merely contains a pointer back to the SD (and
possibly the offset from the SD to the actual segment code). The LSL
of the SD and SCW is inferable from the Lexical Scope Pointer (LSP)
used to address the SCW during ENTER (or similar) invocation (unless
it's stuffed).


Design of a Task
================

A task consists of an Operand Stack (normally just refered to as "the
stack"), a set of Lexical Scope Pointers (LSPs), and an Instruction
Pointer (IP).

Stack based variables are referenced by an offset from an LSP. The
current Lexical Scope Level (LSL) is refered to as 0, the parent scope
is 1, and so on. Offsets from the indicated LSL are indicated by
numbers, and so an address is a tuple. For example (0,0) refers to the
first variable on the stack declared by the current segment, whilst
(1,3) refers to the third variable on the stack in the parent scope of
the current segment.

Mark Stack Control Words (MSCW) indicate the start of each activation
frame. It is illegal for a variable to be referenced by an offset from
an LSP that passes an MSCW. The purpose of the MSCW is to indicate
both the lexical scope boundaries and the dynamic control flow on the
stack. The lexical scope boundaries must be indicated so that when a
segment is exited, the LSPs can be restored to their previous values
by following the chain of MSCWs. The dynamic control flow must be
indicated so that the stack can be unwound suitably on segment
exit. The LSL is also indicated to ensure the correct LSPs are (re)set
on segment exit. In a nutshell, the MSCW is there to save state on
segment entry so it can be successfully restored on exit.

Due to the use of LSPs and the fact that every stack variable is
referenced as an offset from the activation frame corresponding to the
segment that declared the variable, it is in fact not necessary to
consider the stack as a single contiguous stack. Instead, it is valid
to consider each activation frame as a separate stack. This makes
manipulations of stacks conceptually much easier when it comes to
closure capture and features such as "call-with-continuation".


Segment Entry and Exit
======================

When an ENTER instruction is encountered, the top of the stack is
expected to be an IRW (maybe stuffed) which eventually leads to a
SCW. The SCW in turn points to an SD, which defines amongst other
things, the number of arguments required. This IRW will be destroyed
by the ENTER instruction.

A new MSCW is added to the stack, containing:

1. A pointer to the current MSCW. This allows the current activation
   frame to be found once the segment-to-be-invoked returns;
2. A pointer to the MSCW in the parent lexical scope. This allows the
   LSPs to be reconstructed should a further ENTER instruction be
   encountered that would then alter the LSPs.
3. The LSL. This ensures that if a further ENTER instruction is
   encounted and control then returns, the correct LSPs are reset.

Above the MSCW, a Return Control Word (RCW) is inserted. This contains
a pointer to the next instruction from the current segment.

Finally, Indirect Reference Words (IRWs) are added to the stack equal
in number to the number of arguments the segment requires. These N
IRWs refer to the top N entries on the stack preceeding the new
activation frame (i.e. the newly added MSCW which will actually exist
at the same location as the old IRW which pointed to the SCW
indicating the segment to be entered).

Could do some sort of variable arity mech whereby the SD doesn't
indicate a fixed number and instead an operand to ENTER sets the
arity. You could then provide a very specific LSP specifically to
provide the frame for the args. Indeed, that LSP could be the general
mech so that (0,0) refers to the first arg to the current segment and
scope-local tmps are at (1,N).

The problem with this is that it means you have to explicitly
duplicate everything if you're just passing through to another
segment.


Closure Capture
===============

Note that the following does all capture by reference. For by-value
the RTS of the guest language will need to do some degree of copying.

Consider:

    var w, p1, p2, p4;
    p1 = function (g) {
        var x, y, p3;
        p3 = function () {
            var z;
            z = f(x,y,g);
        };
        p2 = p3;
    };
    p4 = function () {
        ...
    };
    p1(w);
    p4();
    p2();

The assignment of p2 = p3 requires that p2, which is defined in the
same scope as p1, captures the closure of p3, including the
environment defining x, y and g.

To do this, we must ensure that as the activation frame from the p1
invocation is unwound, it is not destroyed: p2 still references that
activation frame (it'll be its LSP(1)), as in the body of p2 we have
references to x, y and g which are defined in the parent scope,
i.e. the activation frame of p1. So when p4 is invoked, it must not
overwrite any of the details on the stack that p2 is dependent on.

Because of the use of LSPs, and scope-relative addressing on the
stack, as noted earlier, it is not necessary for a task's stack to be
thought of as a single contiguous stack. Instead, each activation
frame can be thought of as a single unit of memory. So, the assignment
p2 = p3 can be achieved by simply marking all the scopes between the
current scope (inclusive) and the scope in which p2 is declared
(exclusive) as not being eligable for deallocation upon stack
unwinding. Any new method invocations must be achieved on fresh
memory. The value on the stack of p2 might at first glance seem to be
a SCW, but that's not true: an SCW points at an SD and is in effect
just an IP. We need to store both an IP/SD but also a pointer to the
stack that forms the environment.

So, the assignment p2 = p3 writes into p2 a stuffed IRW which points
at some SCW which is at the top of the saved stack (or somewhere
near): for example the RCW in the activation frame at the top of the
saved stack - none of the RCWs in there will ever be used again as the
dynamic chain has already been unwound.

With code loaded out of a file, the SCW is already in the correct
place in the stack: it's lexically scoped so you then take IRWs to the
SCW and when it gets invoked, you set up the LSPs based on the MSCW
lexical scope pointer chain from the SCW that you find. The segment
itself gets a new stack, which is exactly as you'd expect. Vars which
already exist and are in parent scopes may or may not have existing
values.

Closure invocation is thankfully exactly the same: to invoke a
captured closure, we should have assigned a stuffed IRW to p2 (in the
above) which points into the saved stack at the SCW. Then from that
SCW we find the relevant MSCW (this will be possible directly from the
(stuffed) IRW as the scope-offset addressing will reveal exactly where
the MSCW will be) and pointer chasing on its lexical parent MSCWs will
allow us to set up the LSPs correctly as per normal for ENTER.

An issue with rewriting the RCWs is that it means you can't share that
stack amongst multiple captured closures. So we should probably just
create new SCWs. This is interesting as it suggests that space for an
SCW has to be reserved in the current activation frame for any
subfunction/closure regardless of whether it gets assigned to any var
in this frame or some parent frame.

One problem is that all IRWs from the "saved"-stack to below the split
will have to be rewritten to stuffed IRWs. That may not be too hard in
practise though it might be costly. Maybe could be avoided with some
sort of pointer swivel or default stack upon re-invocation?

Definitely going to have to some modelling to try and make sure this
can't go wrong.


Extension to call-with-continuation
===================================

For call/CC we need to save the entire stack/suspend the current
function and invoke a function passing the
saved-stack/suspended-function as an argument.

This appears to be merely a combined saving of the current closure,
invocation of a new subfunction with the argument set to be the IRW to
the newly created SCW.

It looks like the new subfunction will need to be invoked in an
entirely new stack as if the subfunction does not invoke the
continuation you'll not want to return back into that stack - the RCW
chain must be broken - though not entirely necessarily - the haskell
version has the implicit invocation of the continuation with the
result of the subfunction, for example.

- TODO: look up how scheme does this.


Instruction Set
===============

- **Push Name (PUSHN)**  
  push onto the stack the address couplet in the instruction
  (i.e. build an IRW)

- **Push Value (PUSHV)**  
  push onto the stack the value at the address couplet in the
  instruction (functionally equivalent to PUSHN followed by LOADV

- **Load (LOAD)**  
  top of stack must be an IRW, SIRW or heap pointer. Replace the top
  of stack with the contents found by dereferencing the operand.

- **Load Value (LOADV)**  
  top of stack must be an IRW, SIRW or heap pointer. Replace the top
  of stack with the contents found by dereferencing the operand. If
  the top of the stack is still an IRW, SIRW or heap pointer,
  repeat. I.e. this is the transitive closure of LOAD, stopping when
  the value is not any form of pointer or reference.

- **Duplicate (DUP)**  
  Duplicate the top item on the stack. TBD: should this instruction
  indicate a number too, of items to duplicate?

- **Push (PUSH)**  
  Push a literal value supplied following the instruction onto the
  stack.

- **Pop (POP)**  
  Pop and discard from the stack. TBD: should this instruction
  indicate a number too, of items to pop?

- **Store (STORE)**  
  Top of stack is the content to store, item below that is the address
  (IRW, SIRW or heap pointer) to store it at.

- **Enter (ENTER)**  
  Top of stack is an IRW or SIRW that points at a SCW of the segment
  to enter. The segment's own SD indicates the arity of the
  segment. That number of items must exist in the current activation
  frame following the IRW at the top. Those items are provided as the
  arguments to the segment to be entered and are lost from the current
  activation frame. After the segment returns, the number of items the
  segment returned will be at the top of the stack of the caller.

- **Return (RETURN)**  
  Contains an integer of the number of items to return from the stack
  to the stack of the parent activation frame. Exits the current
  segment and restores control to the calling segment.

- **Link (LINK)**  
  Followed by a string indicating the name of the library to attempt
  to link to. That library, if it can be found and is a code file,
  will be parsed; its top-level segments will add SCW's to the current
  stack, and various dictionaries will be added to to enable
  resolution of exported segments. TBD: This may not actually be an
  instruction: it's worth noting that the JVM has no such instruction
  and that 'import's are dealt with by the class loader.

- **Resolve (RESOLVE)**  
  Followed by two strings indicating the library name and segment name
  within to resolve. If they can be found then place an IRW pointing
  to the relevant SCW on the stack.

TODO
----
  Rework Link and Resolve. Firstly in light of the constant-pool in
  the Java Class File format which looks to be a better design which
  would substantially reduce expensive duplication, but also in light
  of the fact this mechanism would only allow external segments, and
  not constants to be referenced. The latter can be worked around as
  you could always have an external segment that just returns an IRW
  to a var, but still, the inconsistency is troubling. Also, the only
  way that this work-around can work is if you can have file-global
  vars, which you currently can't do. So that needs fixing.

  It then appears that segments having names is daft except in the
  special case of the segment being file-global. So that probably
  means those names should be dealt with in a different way.


Misc. Notes to Tidy up properly later
=====================================

- Pizza can be eaten several different ways: http://imgur.com/a/9fJLP

- Segment entry will provide IRWs pointing at the args to the segment

- The actual args will not be popped as part of segment entry/exit

- "Load" will follow IRWs to an actual value.

- Need to figure out if we want Load to be provided with an address as
part of the instruction, or to construct the address on the stack;
Burroughs does "name call" to build an IRW on the stack from the
instruction (this is essentially just "push this stack-address"), and
does "value call" to duplicate an actual value with the address
provided from the instruction ("dereference"). It then has "load"
which will dereference an address on the stack.

- It's not actually clear (yet) why these are needed - what ops can
you actually do on stack-addresses other than load? Curiously, "store"
has both stack-address and value on the stack and uses them. There
seems to be no form in which the stack address is provided by the
instruction. Note that this is in common with the JVM, though of
course there we're actually talking about the heap, not the stack.

- It's also not clear yet whether we would want to allow a dereference
of a ptr to a ptr to a ... to ever yield the intermediate ptr. My
impression is that the burroughs doesn't allow this to be yielded - it
does full ptr chasing, but I might be wrong on this. Certainly it does
the full chase when trying to find a PCW/SCW.

- I can appreciate the need for ptr arith on heap ptrs, but I'm less
sure about stack ptrs... Ultimately I suppose there's no sense in
distinguishing between the two. I suspect that ultimately we're just
going to need a general pair of "&" and "->" operators.

- Things to remember about the JVM: it's call-by-value unless the
value is a ptr to the heap. So this is why method invocation clears
the calling stack of the args: if they're ptrs to the heap then you've
just got to dup them from higher up in the stack and then you can
still do call-by-ref via the stack. If they're primitives then as it's
call-by-name you lose the args but you get the result returned.

- Also, JVM has various forms of type checking built in so you
can't(?)  violate the type sigs.

- For the fib example, need to work out returning values and the tail
calls...
