# Table of Contents

- [Introduction](#introduction)
- [Design Rationale](#design-rationale)
	- [The Java Virtual Machine](#the-java-virtual-machine)
	- [PostScript](#postscript)
	- [Burroughs Large Systems](#burroughs-large-systems)
- [Installation and Read-Eval-Print-Loop (REPL)](#installation-and-read-eval-print-loop-repl)
- [The Architecture of the BVM](#the-architecture-of-the-bvm)
	- [Supported Types](#supported-types)
	- [File formats](#file-formats)
	- [Execution Model](#execution-model)
		- [Literal Arrays](#literal-arrays)
		- [Literal Dictionaries](#literal-dictionaries)
		- [Code Segments](#code-segments)
		- [The Dictionary Stack](#the-dictionary-stack)
		- [Lexical Addresses](#lexical-addresses)
		- [Call with Continuation (CALLCC)](#call-with-continuation-callcc)
		- [Errors](#errors)
		- [Assembly Labels](#assembly-labels)
- [BVM Opcode Reference](#bvm-opcode-reference)
	- [Operand Stack Manipulation](#operand-stack-manipulation)

# Introduction

The BVM is a stack-based virtual machine, offering a simple and
comparatively high-level instruction set. The design does not make any
assumptions about the paradigm of the language being compiled to the
BVM, but it does include first-class support for some types of lexical
addressing, closure capture and automatic tail-calls. These features
aim to decrease the gap between modern languages and the BVM, without
pigeon-holing the BVM to any particular programming paradigm.

Whilst an exhaustive literature review was not possible prior to
designing the BVM, substantial investigation into the design of
various CPUs and VMs (or software-CPUs) was undertaken. These included
the world's (suspected) two most popular VMs (PostScript and the JVM)
along with rather more obscure (and rather interesting) past CPU
architectures.

Ultimately, design depends on research, individual thought, and mostly
judgement. Not all "neat" features can be successfully combined
together. Every language has the odd wart (some rather uglier than
others!) and beauty is always in the eye of the beholder. However
whilst the cyclical reinvention of ideas in computing seems on the
whole inescapable, I believe there has been a genuine attempt to learn
from the copious prior art.

Whilst hopefully not limiting the scope of application of the BVM, the
original motivation for the BVM is to enable developers to **not**
write in JavaScript for the browser. The hypothesis is that many
developers, if given the choice, would prefer not to use
JavaScript. There are however some important caveats. For example,
there are many very good JavaScript libraries that are extremely
popular and provide functionality specific to the
browser-environment. These should not be shunned or precluded. Thus
some aspects of the design of the BVM make it easy for functions to be
exported, whether they be written in "native"-JavaScript or compiled
to the BVM. Thus one can think of the BVM as attempting to provide a
common-language-runtime and also providing a means of dynamic-linking
which is language agnostic and provides a
foreign-function-interface. This is in contrast to other efforts such
as Emscripten which is more focused on translating entire code-bases
to JavaScript and for example does not, at the time of writing,
address linking to preexisting JavaScript libraries.

The current example implementation is written in JavaScript and is
available to run both in web-browsers and under NodeJS. This
implementation is currently a little over 5k lines-of-code, including
comments and whitespace, and minimises to just 60kB (including
assembly parser). Whilst lines-of-code is by no means a convincing
metric, hopefully it suggests that the design is not particularly
complex, and that implementations of the BVM in other languages should
be possible without excessive engineering effort. There is also
substantial potential for optimisations.

Ultimately, I hope to see the BVM implemented directly within web
browsers, thus offering the greatest performance possible and a much
richer and more inclusive programming environment within the browser.


# Design Rationale

The nice thing about designing a virtual machine is that you get to
design a CPU without any hardware limitations. This means options are
open to you which would never have been considered (or were seldom
considered) for hardware designs. For example, where do operands come
from and how are they indicated? Most of the time in hardware they
come from CPU registers, which are explicitly indicated in the
instruction stream. In a VM, they could just come from any arbitrary
memory location and the instruction stream include addresses
instead. Equally, they could be implicitly taken from an operand
stack.

Not only is it worth examining existing VM designs, it is worth
examining hardware CPU designs and features. Before the domination of
Arm, x86 and MIPS architectures, there were a vast wealth of
innovative hardware architectures which are well worth studying. Some
CPUs were designed specifically to enable the cheap compilation of
certain languages. For example, the Burroughs Large Systems were
specifically designed to support ALGOL 60, a programming language
which many people at the time said could never be compiled and
executed on computers. ALGOL 60 was the first language implementing
nested function definitions with lexical scope and closure capture
(features which were then borrowed by Scheme and many other mainstream
languages). Burroughs built in specific features to the hardware to
make compilation easier. The Burroughs Large Systems had, for example,
hardware support for tracking lexical scopes and allowing symbolic
addressing of locations in parent scopes, whilst supporting a
continuous operand-and-control-flow stack and without the compiler
needing to attempt to calculate explicit stack-relative addresses to
access parent lexical scopes.

Another interesting feature is the use of *register windows*. These
are widely used in RISC architectures, particularly SPARC, and perhaps
most elegantly in the AMD 29k CPU. A register window exposes just a
subset of the total available registers to each function, and this
subset changes (and is restored) every time you enter (and exit) a
function. This allows for the abstraction of register names: they
become local to each function scope. In SPARC designs, the window is
fixed size:

> The Sun Microsystems SPARC architecture provides simultaneous
  visibility into four sets of eight registers each. Three sets of
  eight registers each are "windowed". Eight registers (i0 through i7)
  form the input registers to the current procedure level. Eight
  registers (L0 through L7) are local to the current procedure level,
  and eight registers (o0 through o7) are the outputs from the current
  procedure level to the next level called. When a procedure is
  called, the register window shifts by sixteen registers, hiding the
  old input registers and old local registers and making the old
  output registers the new input registers. The common registers (old
  output registers and new input registers) are used for parameter
  passing. Finally, eight registers (g0 through g7) are globally
  visible to all procedure levels.

Of course eventually, with enough sub-calls, you could exhaust all the
registers on the CPU, and at that point values have to be manually
spilled out to RAM. The window is essentially an atomic unit in a
stack containing the stack-allocated values of the current
call-chain. The AMD 29k CPU had an elegant modification of this design
in that the register window is not of fixed size. Thus functions
declared how many registers they needed and this ensured better use of
the precious resource that are hardware registers.

It is worth noting that the MIPS design team examined this design and
concluded that register windows were an unnecessarily complex feature
and that fewer registers but smarter compilers (which made better
decisions about the use of registers) were the way forwards. Received
opinion is that this is true, though it's difficult to find conclusive
studies given that there are no two CPUs with the same architecture
that differ only in the provision of register windows.

It is obviously also worth studying VM designs themselves. Some of
these are fairly general in nature, whilst others are carefully
designed to match with expected use cases. The JVM, for example,
accommodates Java very well, whilst accommodating less
statically-rigid languages far less well. PostScript contains several
features and many operators specifically designed for the layout of
data on a page. Parrot contains more operators than could ever be
considered reasonable by man or beast. There are however more general
design choices of each that can inform future designs of VMs.


One of the first steps when deciding on a VM design is to decide
whether it's going to register-based, whether the operators are going
to have explicit locations of operands indicated (which could just be
memory addresses), or whether it's going to be stack-based and thus
operands are implicitly taken from the head of the stack.

When measured by use, most VMs are stack based. This is due to the
overwhelming influence of both the JVM, and PostScript which exists in
pretty much every serious printer made. But even if you disregard the
popularity of these VMs, there seem to be relatively few
register-based VMs. There are several reasons for this:

1. The only reason hardware-CPUs have registers is as a means of
identifying locations which are valid holders of operands. With a
software CPU, you don't have this restriction: the operands can come
from anywhere.

2. Hardware CPUs have a limited number of registers. Hardware CPU
registers are special high-performance locations. In a modern CPU, a
*register* is actually an abstracted location as each register will
exist many times over at most stages within the CPU's pipeline
(assuming it's a pipelined design). With a software CPU, as you're not
implementing a chip, you don't have this limitation. It then seems
perverse to inflict the issues of register-spilling and management
onto any compiler targeting your architecture when there's no
hardware-based reason to have a limited number of registers. Having an
unbounded number of registers in a VM would complicate the instruction
set format as the format to indicate which registers are operands
would become a little involved. Some register-based VMs such as Parrot
make the argument that they can simply map their virtual registers to
hardware registers. This is true, but complicates implementations of
the VM on different architectures with different numbers and types of
hardware registers. Furthermore, given the evidence of the speed of
well optimised stack-based VMs such as the JVM, it would seem a
register-based VM is not a necessary precondition for a
well-performing VM.

3. Stack-based instruction sets tend to have better code density. This
is definitely true if you just count *instructions per object-file
byte* as all instructions take operands implicitly from the stack(s),
thus operands are not indicated in the instruction stream. However,
stack machines do have to include instructions for manipulating the
stack to make sure the operands are in the correct order on the stack
for upcoming instructions. Good compilers can minimise the use of
these instructions though you will never eliminate them
entirely. However, even with a modest sprinkling of such instructions,
this is fewer bytes lost to manipulating the stack than bytes lost
with register-based CPUs where every single instruction explicitly
indicates its operands. In a world of mobile devices where bandwidth
can often be limited and data transfer billed, this seems a worthwhile
concern.

If we thus decide that stack-based designs are at least more elegant
and possibly offer a few advantages (whilst requiring optimisation
efforts to achieve good performance) there are then many further
issues to consider:

* How many stacks should be used? Some designs separate out the
  call-stack (i.e. tracking the dynamic control-flow) from operand
  stacks. Some designs separate out even more: for example PostScript
  actually has five stacks in use - operand, control-flow, dictionary,
  graphics-state stack, and clipping path stack - though obviously the
  last two are very specific to the use of PostScript to construct the
  layout of data on a page.

* Should the operand stack (and maybe others) be continuous, or
  distinct: i.e. should all function calls permit modification of the
  same stack, or should each function call result in an entirely
  separate stack which merely has a pointer to its parent stack? The
  continuous design is what people are most used to from e.g. C's use
  of the stack, but it adds cost to closure capture when the
  environment of the closure can include stack-based variables and
  thus sections of the stack then have to be copied out and saved for
  use by the closure, should it be later invoked. This can get rather
  complex if the saved environment includes the contents of parent
  lexical scopes which are then modified elsewhere and perhaps even
  shared between different closures. For example, in the pseudo code

        var k, x, y, z;
        x = function () {
            var j = ...something...;
            y = function () { ...some use of j... };
            z = function () { ...some use of j... };
            return j;
        };
        k = x();
        foo(y);
        bar(k);
        return z;

  if the initial creation of `j` is done on the stack and the stack is
  continuous, then the stack will be popped and `j` will be lost by
  the time the call to `x()` returns. `k` would then point to a
  location beyond the top of the stack. The potential subsequent
  invocations of `y` and `z` will be problematic unless steps are
  taken to ensure `j` is moved to the heap somewhere and all
  references to it are updated. Furthermore, whilst the variables `y`
  and `z` are in the parent scope, the values assigned to them
  (i.e. the two functions created by `x()`) can also not be created on
  the stack as they too would be popped once `x()` returns.
  
  Alternatively, if each activation frame is an entirely separate
  stack with merely a pointer to previous stack (thus representing the
  dynamic control-flow path) then the stack that is created by the
  invocation of `x()` and containing `j` need not be destroyed when
  execution returns from `x()`. The values assigned to `y` and `z` are
  then closures that contain not only their operators, but also
  pointers to the various activation-frames (or stacks) that are
  lexically in-scope at the time of declaration of the closure.
  
  This however does start to suggest a design focusing more towards
  lexical scoping rather than dynamic scoping. I believe this is
  justified though as in a lexically-scoped language, implementing a
  dynamically-scoped language is fairly straight-forward (there are a
  number of approaches, but one is simply to have a dictionary which
  maps variable names to their current value). The opposite however is
  more involved: implementing a lexically-scoped language within a
  dynamically scoped one requires keeping many dictionaries mapping
  variable names to values, preserving some and creating new which
  inherit from old whenever you enter or exit a function. In my
  estimation, the majority of popular programming languages today are
  lexically scoped. Thus a VM which directly supports lexically-scoped
  languages and offers built-in support for closure capture is
  advantageous. Furthermore, the provision of these features should
  not make it more difficult for the VM to be targeted by
  dynamically-scoped languages nor for languages which do not support
  first-class functions (and so have no need for closure capture).

* Types. Types always merit much discussion and debate. An instruction
  set is a language just like any other and so what types it supports
  and how those types influence semantics are important questions to
  ask. Some VMs have multiple operators for the same functionality,
  just on different types of operands. For example, the JVM has
  `iadd`, `ladd`, `dadd` and `fadd` to perform addition of integers,
  longs, doubles and floats. Other architectures track the types of
  values on the stack or in registers implicitly and then overload
  opcodes so that a single `add` operator will perform the appropriate
  action dependent on the types of the operands it finds.
  
  Some CPUs have opcodes to perform sophisticated matrix operations
  which you could argue suggests they support a data type of a
  matrix. Similarly, some modern CPUs have opcodes to explicitly
  search strings. Other designs support more abstract data types
  directly, such as arrays and dictionaries. The more you think about
  a VM as being little different from just another programming
  language, the more it ceases to seem odd that a VM should support
  richer data-structures such as collections.
  
  However, the greater the sophistication of the types supported, the
  more carefully you need to design and manage memory use and opcodes
  for manipulating these data types. For example, if you support some
  kind of a dictionary in a stack machine, is a dictionary just a
  plain value, or is it a pointer to a dictionary? If the latter, do
  you need distinct opcodes to clone the dictionary rather just copy
  the point to it? Is the raw memory in which the dictionary is stored
  accessibly directly through some sort of heap, or is the memory of
  the dictionary and the heap distinct? Can you have both - i.e. if
  you start with a pointer to a dictionary, can you *load* that
  pointer in some way and then have the plain value in the operand
  stack? What advantages would that give you?

## The Java Virtual Machine

The JVM is a stack-based VM. It mainly uses 1 byte per opcode in its
instruction stream which is taken from its class-file format. The
class-file format contains other elements such as a constant-look-up
table which allows constants (for example strings) to be removed from
the instruction stream in order facilitate reuse and other
optimisations. Some instructions do have further operands taken from
the instruction stream. These tend to point to the fact that the JVM
was designed with little more than the needs of the Java language in
mind. So for example, because Java does closed-world compilation, all
method invocation can be resolved at compile-time. This means that
there is never a need to try and look up a method based on the name on
the top of the stack: as all method names are known at compile-time,
they are held in the class-file constant table, and then all method
invocation opcodes take from the instruction-stream indices into the
class-file constant table to identify the method name. Only the
*receiver* of the method invocation (i.e. the object) is dynamic and
thus taken from the stack. Another example is that there's no direct
heap access at all: everything's couched in terms of objects.

The JVM supports multiple threads. Each thread has its own stack of
frames. A frame contains the state of a method invocation. Java has
*primitive* values (such as numbers, booleans) which are held directly
in stack frames. Reference values (including arrays and objects) are
always created and held in the heap, and pointed to from stack
frames. Whilst stacks are continuous, there is no way to access the
contents of a parent stack frame. Because methods are attached to
objects and objects are always held in the heap, the closure capture
issues outlined above are first reduced and then eliminated by
permitting only access to constants in parent lexical scopes from
within a new closure. Method signatures are known at compile-time and
so method invocation removes the correct number of arguments from the
current stack frame and supplies them to the new stack frame. There
are explicit `return` instructions to return values to the calling
stack. As mentioned above, JVM byte-code does not embrace overloaded
opcodes: just as there are many different forms of `add` there are
also different forms of `return` depending on the type of the value
being returned. It strikes me that this is a little odd given that the
method signature which is known at compile-time and used to determine
the number of arguments to a method (and verify their type) would also
indicate the type of the returned value, thus a single `return`
instruction would suffice. However, it's possible this asymmetry is
both intentional and necessary and I'm missing something.

## PostScript

PostScript is an extremely elegant stack-based design. The instruction
stream is just text: there is no binary instruction stream, though
there is support for compression of the instruction stream. It is
interesting to consider whether there is any benefit these days to a
VM supporting a custom binary-format given how widely supported *gzip*
compression, especially of text, has become. The language supports
arrays (both packed (read-only) and unpacked) and dictionaries. A
string in the instruction stream that is not recognised as an opcode
is used as a key to index a stack of dictionaries. If a value is found
and that value is a user-declared function then the function is
run. Thus there is no real distinction between opcodes and
user-defined functions. There is even a form of `eval` where a string
can be reinterpreted as a stream of opcodes.

PostScript supports some rather high-level operators such as mapping
over elements of arrays and explicit `for`-loop support. PostScript is
a dynamically-scoped language and has contiguous stacks: when you call
a function, that function can perform any manipulation it likes of all
the stacks: there is no facility to indicate exactly how many operands
a function should take, and there is also no explicit `return`
operator: control flow returns to the calling function when there are
no more opcodes in the current function. Because of this contiguous
operand stack, the call stack must be a separate stack to avoid
functions coming across and manipulating function-call on the operand
stack.

There are also no explicit branching (in the sense of `jump`)
opcodes. Opcodes such as `if`, `loop` etc are supported explicitly and
take functions as arguments.

## Burroughs Large Systems

As mentioned previously, Burroughs Large Systems were computers with
an architecture specifically designed for the execution of ALGOL
60. They had a contiguous operand-and-control-flow stacks and a novel
form of lexical addressing. This allowed expressions such as "the
second item in the stack of my lexical grand-parent".

When a function was invoked, as normal, the stack would record the
previous stack frame marker along with the address of the next
instruction once the callee has returned. The function to call would
be indicated by a pointer which would be an offset within the
stack-frame in which the function was declared. This allows the parent
lexical scope to be established (i.e. the parent lexical scope is the
scope in which the function is declared). From the stack frame marker
of the parent lexical scope, you can find the function that led to
that stack frame being created and thus the lexical scope of that
function declaration, and so forth. In fact, these machines supported
a hardware-based array of 32 elements which were explicitly set on
function invocation and return to point to all the parent lexical
scopes. Thus you could then very cheaply access your parent scopes:
element 0 in this array would point to the scope of the root, 1 to its
child, and so on up to the current lexical scope, *N*.

Thus the Burroughs Large Systems support not only a stack which tracks
the dynamic control flow, but also permits function declaration on the
stack which can then be used to establish the lexical scopes of each
function upon invocation.

The Burroughs Large Systems were 51-bit architectures. Each value on
the stack could be up to 48-bits, and had a 3-bit tag indicating the
operand's type. Opcodes were then allowed to be overloaded based on
the types of values found on the stack. There were also explicit
operators to facilitate call-by-value and call-by-reference, both of
which were supported by ALGOL 60. The stack itself was held in RAM,
not on the CPU in any sort of CPU-local hardware stack, apart from the
top two values of the stack which were two registers within the CPU
itself.


# Installation and Read-Eval-Print-Loop (REPL)

The JavaScript implementation comes with a REPL that works both in
web-browsers and in NodeJS.

To download:

    $ git clone https://github.com/five-eleven/bvm.git
    $ cd bvm
    bvm$ npm install

Then, to start the REPL under NodeJS:

    bvm$ node -e "require('./bvm').repl();"
    bvm>

To prepare the REPL for a browser:

    bvm$ npm run-script browserify

Then point your web browser at the `bvm/browser/index.html` file.


# The Architecture of the BVM

The BVM is a stack-based virtual machine. There are function-distinct
call-and-operand stacks, and a separate dictionary stack which is used
for both error handling and to export functions. By making the
function call-and-operand stacks distinct, the closure capture is
trivially supported. Whilst the VM is currently single-threaded, there
is no requirement for real threads to be precluded, and the VM has
built-in support for call-with-continuation which can be used both for
error-handling (i.e. `try-catch`) and also to build a micro-kernel /
scheduler which could implement green-threads.

## Supported Types

The BVM has built-in support for the following types:

* Numbers. Currently these are required to be 64-bit floats. This will
  almost certainly be revised to support 32-bit integers (and possibly
  64-bit integers too).

* Booleans.

* Arrays. Arrays are dynamically sized and are a reference type:
  multiple values can point to the same array.

* Strings.

* Dictionaries, where the keys must be strings. This restriction may
  be relaxed in the future. Dictionaries are of dynamic size and are a
  reference type like Arrays.

* Code Segments. These contain both opcodes and an understanding of
  the lexical scope in which they were declared. Throughout this
  document, the terms "code segment" and "function" are frequently
  used interchangeably.

* Lexical Addresses. These can be literals (i.e. constants) in the
  instruction stream, or they can be constructed dynamically. They
  represent an offset into a lexical context in scope at the time of
  the current function declaration. Once a lexical address enters the
  operand stack, it is *fixed* which ensures that it is stable:
  i.e. the lexical address itself can be passed to different functions
  declared in different scopes and the lexical address will continue
  to point at the same offset in the very same stack.

* Stacks. A stack is seldom witnessed as a value on the operand stack.
  It appears though when some form of call-with-continuation
  (`CALLCC`) occurs and thus then represents a suspension of
  execution. A stack contains the current state of a segment
  invocation and along with pointers to the relevant code segment (and
  internal offset: i.e. instruction pointer), the calling stack
  (i.e. dynamic call chain), and the stack of its lexical parent scope
  (this is the same lexical scope information that is held by the
  stack's code segment itself).

* Various singleton types such as `undefined` and `mark`. `undefined`
  is a bottom value. `mark` is used to act as a marker on the operand
  stack and is used both implicitly and explicitly by various opcodes.

## File formats

The object file format is a JSON array, with no encoding of opcodes at
all: they exist as literal strings. This is chosen because of its
widespread support in browsers and the ease of compression: standard
compression techniques are expected to lead to file sizes as small
efficient binary object file formats. The non-binary format is also in
the spirit of the open web and should also lead to a very low curve to
creating tool chains and debugging infrastructure. The only downside
is that it is likely the entire object file will need to be downloaded
before decompression and execution can begin. If in practise this
becomes an issue, this can be revisited.

The assembly format is plain text, with whitespace-separated
tokens. The assembly format permits comments. The parser currently
enforces some constraints (such as correct pairing of literal array,
dictionary and segment declarations) which are not strictly necessary
though in practise it is not anticipated these restrictions will cause
any difficulties for users of the assembler. The assembly format
however does support some very useful shorthands and is less
syntactically noisy than writing the JSON object file format
directly. As mentioned above, the example implementation in
JavaScript, including the assembler, minimises to 60kB. Given this, it
might actually be preferable to ship the bundle including the
assembler to browsers and then treat the assembly itself as the object
format. It remains to be seen which is more convenient or
attractive. The arguments made previously about compression are just
as valid when applied to the assembly format.

All examples given in this document are given in the assembly
format. The documentation of the opcodes however gives both assembly
and object file format representations.

## Execution Model

Execution is relatively standard for a stack machine: an opcode is
fetched from the current instruction pointer. The instruction pointer
is incremented. The fetched opcode is interpreted. As usual with stack
machines, operation in Reverse Polish Notation form: thus in general,
you first set up the operands on the stack, and then you call the
operator. The operators, or opcodes, often expect to find further
values on the top of the stack. These values will be removed from the
stack, and often the result of the opcode will be pushed onto the
stack when the operator completes.

The only exception to this general strategy is the `PUSH` opcode,
which causes the following element from the current segment's
instruction stream to be placed onto the operand stack. In all other
cases, arguments to opcodes come from the operand stack, not the
instruction stream.

Note that all opcodes are case sensitive and all the built-in opcodes
are in UPPERCASE. So, to add together the numbers 3 and 5, we can
write:

    bvm> PUSH 3 PUSH 5 ADD
    {"type": "stack",
     "lsl": 0,
     "ip": {"type": "ip",
            "segment": {"type": "segment",
                        "instructions": ["PUSH!", 3, "PUSH!", 5, "ADD!"]},
            "index": 5},
     "contents": [8]}'

The default action of the REPL is to display the result of the
supplied instructions or, if there is no explicit result, to display
the final state of the stack. To explicitly return a result, we use
the `RETURN` opcode, which requires an argument on the stack telling
it how many subsequent elements from the stack to return to the
calling function (or in the case of the *root* function of the REPL,
how many elements to display back to us). The simplest thing is to
return everything on the stack, which means we must push a number
which is the current height of the stack. There's an operator for
that: `COUNT`.

So we get much more readable results if we do:

    bvm> PUSH 3 PUSH 5 ADD COUNT RETURN
    [8]

> Because every function can return a variable number of results,
> results will always be displayed in an array, even though in this
> case, we've only returned a single result. The left-hand-end of the
> array is always the *bottom* of the stack (also the *first item in
> the stack*, or the *item at index 0 in the stack*). The
> right-hand-end of the array is always the *top* of the stack (thus
> also the *last item in the stack*, etc). Note that because the
> current BVM implementation is written in JavaScript, the results
> returned and displayed by the REPL are JSON-formatted data objects
> and thus differ in format from the input of BVM assembly. For
> example, BVM assembly requires whitespace separators, whereas JSON
> tends to remove whitespace where other separators must be used, for
> example `,` and `:` in arrays and objects. Because JSON can't cope
> with cycles in data structures, quite often when trying to display a
> stack (which often contain cyclical pointers), JSON will fail and
> you'll get a `Error: TypeError: Converting circular structure to
> JSON` error. This does not mean there's anything wrong with your BVM
> program, just that the result of the program can not be successfully
> converted to JSON.

If we do:

    bvm> PUSH 13 PUSH 3 PUSH 5 ADD COUNT RETURN
    [13, 8]

we see that the `ADD` only affects the uppermost two elements of the
stack and the `13` is left alone. `COUNT` will then find there are two
elements on the stack and so will push the number `2`. `RETURN` will
then find that `2` and will then grab the next two elements from the
stack and return them to us.

In the BVM, when multiple values are moved around, for example by the
`RETURN` opcode (and others introduced in due course), order is always
preserved. So at item at the top of the stack becomes the item at the
top of the new stack to which it's been moved.

There is an **implicit default operator**. This is overloaded and will
be explained part by part. When an opcode is encountered which is not
a built-in opcode, this default operator is invoked. *If the opcode
encountered is a number, the number will be pushed onto the operand
stack.* Thus we can rewrite the above as:

    bvm> 13 3 5 ADD COUNT RETURN
    [13, 8]

That's rather a lot shorter.

There is no difference between a string and an opcode. In the above
examples, `ADD` is just a string that is recognised as the name of an
opcode. If we wish to push the string "ADD" onto the stack rather than
invoke the function associated with that string, then we must
explicitly use `PUSH`:

    bvm> 13 3 5 PUSH ADD COUNT RETURN
    [13, 3, 5, "ADD"]

You only need to use quotes in the program text when a string has
spaces in it:

    bvm> 13 3 5 PUSH "ADD this" COUNT RETURN
    [13, 3, 5, "ADD this"]

### Literal Arrays

A literal array can be created by using the `[` and `]` opcodes. Note
that these are an assembly shorthand for `ARRAY_START` and `ARRAY_END`
opcodes. The `ARRAY_START` opcode simply places a marker on the
stack. Execution then continues as normal (further opcodes are
directly evaluated as normal) until the `ARRAY_END` opcode is
encountered. This searches back down through the stack until it finds
the mark, and then takes all the contents between and uses it to
populate a fresh array, finally placing that array back onto the
stack.

    bvm> [ ] COUNT RETURN
    [[]]
    bvm> [ 1 16 3 ] COUNT RETURN
    [[1, 16, 3]]
    bvm> [ PUSH 1 PUSH 16 PUSH 3 ] COUNT RETURN
    [[1, 16, 3]]
    bvm> [ PUSH 1 PUSH 16 PUSH 3 ADD ADD ] COUNT RETURN
    [[20]]
    bvm> [ 1 16 3 ADD ADD [ PUSH hello ] ] COUNT RETURN
    [[20, ["hello"]]]

The full array API including dynamic array creation is covered later.

### Literal Dictionaries

A literal dictionary can be created by using the `<` and `>`
opcodes. As with arrays, these are assembly shorthands for the opcodes
`DICT_START` and `DICT_END`. As with arrays, the `START` simply places
a marker onto the stack, execution continues as normal until the
`DICT_END` opcode is encountered.

When `DICT_END` is encountered, it is required that there are an even
number of elements on the stack between the starting marking and the
top of the stack indicating pairs of keys and values. All keys must be
strings.

    bvm> < PUSH hello 5 PUSH goodbye 17 > COUNT RETURN
    [{"hello": 5, "goodbye": 17}]
    bvm> < PUSH hello 5 DEC PUSH goodbye 17 3 ADD > COUNT RETURN
    [{"hello": 4, "goodbye": 20}]
    bvm> < PUSH hello 5 DEC PUSH goodbye 17 3 ADD PUSH foo [ 1 3 5 ] > COUNT RETURN
    [{"hello": 4, "goodbye": 20, "foo": [1, 3, 5]}]

The full dictionary API including dynamic dictionary creation is
covered later.

### Code Segments

A code segment can be created by using the `{` and `}` opcodes. Once
again, these are assembly shorthands for `SEG_START` and
`SEG_END`. Note that between a `SEG_START` and a `SEG_END`, *no
evaluation takes place*: evaluation is said to be in *deferred mode*,
to borrow terminology from PostScript. There are then several ways to
invoke a segment on the top of the stack, the most obvious of which is
the `EXEC` opcode.

    bvm> { 3 5 ADD } COUNT RETURN
    [{"type": "segment",
      "ls": {"type": "stack",
             "lsl": 0,
             "ip": {"type": "ip",
                    "segment": {"type": "segment",
                                "instructions": ["SEG_START!", 3, 5, "ADD", "SEG_END!", "COUNT!", "RETURN!"]},
                    "index": 7},
             "contents": []},
      "instructions": [3, 5, "ADD"]}]

Note here the final line which shows the instructions within the newly
created segment: it shows the literal contents between the `{` and `}`
opcodes, demonstrating that evaluation of the segment has not yet
taken place.

    bvm> { 3 5 ADD } EXEC COUNT RETURN
    []

Here, whilst we now caused the created segment to be evaluated, that
segment returned no results. Whilst there would have been an 8 sitting
on its stack before control returned to the enclosing code, there
needs to be an explicit `RETURN` opcode if you wish to pass any values
back to the caller.

    bvm> { 3 5 ADD COUNT RETURN } EXEC COUNT RETURN
    [8]
    bvm> { 17 3 5 ADD COUNT RETURN } EXEC COUNT RETURN
    [17, 8]
    bvm> PUSH hello { 17 3 5 ADD COUNT RETURN } EXEC COUNT RETURN
    ["hello", 17, 8]
    bvm> PUSH hello { 17 3 5 ADD COUNT RETURN } EXEC 2 RETURN
    [17, 8]

The BVM can automatically detect tail calls. If, at the point of
invocation of a code segment it is found that there are no further
instructions in the current code segment, then a tail call is
performed. This then means that you can delegate to a callee which
values are returned to your own caller (the following example makes
sense if you consider that the REPL itself is the caller to the
outer-most code, and thus that code is delegating via a tail-call to
the declared code segment which and how many values are returned to
the REPL):

    bvm> { 17 3 5 ADD COUNT RETURN } EXEC
    [17, 8]

If you deliberately want to avoid any values being returned, you can
use `0 RETURN` as you'd expect (though this is obviously no longer a
tail-call).

    bvm> { 17 3 5 ADD COUNT RETURN } EXEC 0 RETURN
    []

Segments must use `RETURN` to pass values back to their caller because
of the fact that operand stacks are distinct: each function invocation
gets a fresh empty stack. In order to pass values into a function, the
calling function simply leaves the values on its own stack, and the
callee may access them using the `RETURN`-symmetric `TAKE`
opcode. Just like with `RETURN`, `TAKE` requires a numeric argument on
the current stack to indicate how many values to remove from the
calling stack. Note that values are removed and not simply copied.

    bvm> 3 5 PUSH "hello" { 3 TAKE } EXEC COUNT RETURN
    []
    bvm> 3 5 PUSH "hello" { 3 TAKE COUNT RETURN } EXEC COUNT RETURN
    [3, 5, "hello"]
    bvm> 3 5 PUSH "hello" { 3 TAKE COUNT RETURN } EXEC // tail call
    [3, 5, "hello"]
    bvm> 3 5 PUSH "hello" { 2 TAKE COUNT RETURN } EXEC COUNT RETURN
    [3, 5, "hello"]
    bvm> 3 5 PUSH "hello" { 2 TAKE COUNT RETURN } EXEC
    [5, "hello"]

There is also a `TAKE_COUNT` to allow you to dynamically determine the
maximum number of values you may take (or in other words, this pushes
to the current stack the height of the stack of the caller).

    bvm> 3 5 PUSH "hello" { TAKE_COUNT TAKE COUNT RETURN } EXEC
    [3, 5, "hello"]
    bvm> 3 5 PUSH "hello" { TAKE_COUNT TAKE POP ADD COUNT RETURN } EXEC
    [8]

> The stack that you remove values from by the use of `TAKE` is
> referred to as the *take-stack*. This is normally the stack of your
> caller, but not always. This gets more interesting much later on
> with the discussion of call-with-continuation.

Segments are first-class values, so for example, you can return them
from other segments:

    bvm> { { 6 8 ADD 1 RETURN } 1 RETURN } EXEC EXEC
    [14]
    bvm> 6 8 { 3 5 { 2 TAKE ADD 1 RETURN } 1 RETURN } EXEC EXEC
    [14]

This last one demonstrates that `TAKE` operates on the dynamic calling
stack, and not on the lexical scope.

### The Dictionary Stack

The dictionary stack is a built-in stack of dictionaries. Unlike the
operand stack, the dictionary stack is continuous: every function gets
to see the same dictionary stack and all can manipulate it as they see
fit. The dictionary stack can be used for anything, but it is expected
to be used for the following:

* Exporting functions and creating name-spaces. As functions are
  first-class values, they can be stored as values in dictionaries
  against the function names as keys. You could then create a new
  dictionary containing all of your library's exported functions, and
  then store that dictionary in the dictionary stack under the
  library's name.

* Error handling. Upon encountering an error, the BVM looks in the
  dictionary stack searching for a value stored against the error name
  as a key. If it finds it and if the value is a code segment, the
  segment is invoked. This is the reason why the dictionary stack is a
  stack and not just a single dictionary: it is expected that
  higher-level languages convert `try-catch` blocks into:
    1. Create a new dictionary
    2. Populate it with keys and values representing the error names
      and `catch`-blocks.
    3. Push this dictionary to the top of the dictionary stack.
    4. Run the code inside the `try-catch` block.
    5. In all cases, whether errored or not, pop the dictionary stack
      after the code inside the `try-catch` block has run.

The dictionary stack also plays a role in the **implicit default
operator**. If the opcode encountered is a string, the string is used
as a key to search the dictionary stack. If a value is found and that
value is a code segment, the code segment is invoked. If a value is
found and the value is not a code segment, the value is just pushed
onto the stack.

Whilst the complete dictionary stack API is covered later, for the
moment we shall look at the opcodes `LOAD` and `STORE`. These are
overloaded operators and shall be covered in full detail
later.

* `LOAD` expects to find an address at the top of the operand
stack. If that address is a string then the string is used as a key to
search through the dictionary stack looking for a value. The first
value that is found is pushed onto the stack. If no value is found,
then `UNDEF` is pushed onto the stack.

* `STORE` expects to find a value at the top of the operand stack
and an address beneath it. If that address is a string, then the value
is stored in the uppermost dictionary on the dictionary stack under
the address.

Some examples:

    bvm> PUSH hello 5 STORE COUNT RETURN
    []
    bvm> PUSH hello 5 STORE PUSH hello LOAD COUNT RETURN
    [5]
    bvm> PUSH hello 5 STORE PUSH foo 17 STORE PUSH foo LOAD COUNT RETURN
    [17]
    bvm> PUSH hello 5 STORE PUSH foo 17 STORE PUSH bar LOAD COUNT RETURN
    ["undef"]

If we now make use of the implicit default operator, we can make these
examples smaller:

    bvm> PUSH hello 5 STORE hello COUNT RETURN
    [5]
    bvm> PUSH hello 5 STORE PUSH foo 17 STORE foo COUNT RETURN
    [17]
    bvm> PUSH hello 5 STORE PUSH foo 17 STORE bar COUNT RETURN
    ["undef"]

    bvm> PUSH eight { 8 1 RETURN } STORE eight COUNT RETURN
    [8]
    bvm> PUSH eight { 8 1 RETURN } STORE eight // tail call
    [8]
    bvm> PUSH my_add { 2 TAKE ADD 1 RETURN } STORE 3 7 my_add
    [10]

It should now be clear there is no difference between invoking a
function stored in the dictionary stack and any other opcode. If you
do have a function stored in the dictionary stack, sometimes you might
want to load it explicitly rather than the default loading and
invoking:

    bvm> PUSH eight { 8 1 RETURN } STORE PUSH eight LOAD COUNT RETURN
    [{"type": "segment",
      "ls": {"type": "stack",
             "lsl": 0,
             "ip": {"type": "ip",
                    "segment": {"type": "segment",
                                "instructions": ["PUSH!", "eight", "SEG_START!", 8, 1, "RETURN", "SEG_END!",
                                                 "STORE!", "PUSH!", "eight", "LOAD!", "COUNT!", "RETURN!"]},
                    "index": 13},
             "contents": []},
      "instructions": [8, 1, "RETURN"]}]

Once we have that code segment back on the stack, we can `EXEC` it as
usual:

    bvm> PUSH eight { 8 1 RETURN } STORE PUSH eight LOAD EXEC COUNT RETURN
    [8]
    bvm> PUSH my_add { 2 TAKE ADD 1 RETURN } STORE 6 7 PUSH my_add LOAD EXEC
    [13]

And to reinforce the idea that there's really no difference between
opcodes and user-defined code segments, we can even load opcodes onto
the stack:

    bvm> 6 7 PUSH ADD LOAD EXEC COUNT RETURN
    [13]

Though you don't get to actually look inside the implementation of
opcodes unlike with user-defined code segments:

    bvm> PUSH ADD LOAD COUNT RETURN
    ["ADD!"]

This reveals then the trade-off between allowing more than just strings
as keys in dictionaries: if, for example numbers were allowed as keys,
then due to the implicit default operator, all literal numbers in the
source text would have to be explicitly `PUSH`ed onto the stack as by
default they would be used as keys to index the dictionary stack.

The rest of the dictionary stack API (including actually adding and
removing dictionaries from this stack) will be covered later.

### Lexical Addresses

The BVM allows code segments to explicitly index any lexical
scope. The syntax for this is `(A, B)` where `A` is the *lexical scope
level*, and `B` is the *stack index* within that level. The *lexical
scope level* is 0 for the root scope, 1 for all children of the root,
and so on. The *stack index* 0 refers to the first item at the
*bottom* of the relevant stack.

The **implicit default operator** also plays a role with lexical
addresses: if an opcode is encountered which is a lexical address and
the value pointed to by the lexical address is a code segment, then
that code segment is invoked. If the opcode encountered is a lexical
address which points at a value other than a code segment, the value
is simply pushed onto the stack. Note that the location pointed to by
the lexical address is not modified, and where the value found is a
reference value (i.e. an array, dictionary, segment or stack), the
value is shared: i.e. a new reference to the same actual value is
pushed to the stack rather than an cloning of the underlying reference
value going on. These are the same semantics as with an unknown
string as an opcode and indexing into the dictionary stack.

    bvm> 5 (0, 0) COUNT RETURN
    [5, 5]
    bvm> 5 7 (0, 0) COUNT RETURN
    [5, 7, 5]
    bvm> 5 7 (0, 1) COUNT RETURN
    [5, 7, 7]
    bvm> 13 { 12 (0, 0) COUNT RETURN } EXEC COUNT RETURN
    [13, 12, 13]
    bvm> 13 { 12 (1, 0) COUNT RETURN } EXEC // tail call
    [12, 12]

`EXEC` removes the segment itself from the stack, whereas lexical
addresses leave the original value in tact, which can be very useful
for example for recursive functions.

    bvm> 13 { 12 (1, 0) COUNT RETURN } (0, 1) (0, 0) COUNT RETURN
    [13, {"type": "segment", /* rest elided */ }, 12, 12, 13]

There are two shorthands that the assembler permits with regards to
lexical addresses. The first is to omit the *lexical scope level*
entirely, thus the syntax is then just `(B)`. This implies the current
lexical scope. The following are equivalent:

    bvm> 13 { 17 (1, 0) (0, 0) (1, 1) COUNT RETURN } (0, 1)
    [17, 17, 13, 17]
    bvm> 13 { 17 (0) (0, 0) (1) COUNT RETURN } (1)
    [17, 17, 13, 17]

The second is to use negative numbers as the *lexical scope level*. -1
indicates your parent, -2 is your grandparent, and so on. In both
cases, the assembler rewrites these to the first form, but it's an
easy transformation to do. It's important to remember though that 0 is
always the root lexical scope - if you want to indicate the current
scope simply, omit the *lexical scope level* entirely. Thus the
following are again equivalent:

    bvm> 13 { 17 (1, 0) (0, 0) (1, 1) COUNT RETURN } (0, 1)
    [17, 17, 13, 17]
    bvm> 13 { 17 (0) (0, 0) (1) COUNT RETURN } (1)
    [17, 17, 13, 17]
    bvm> 13 { 17 (0) (-1, 0) (1) COUNT RETURN } (1)
    [17, 17, 13, 17]

Lexical addresses, as you would expect, are referenced based on the
scope of the declaration of the function, not the scope in which the
function is eventually evaluated. For example, note the following
returns `3` and not `1` - the innermost code segment is returned as a
value all the way to the root segment where it is finally
evaluated. But its parent lexical scope is the scope in which that
function was declared - i.e. the scope which first pushes `3` to its
stack.

    bvm> 1 { 2 { 3 { (-1, 0) 1 RETURN } 1 RETURN } EXEC } EXEC EXEC
    [3]

Just like with strings and the dictionary stack, lexical addresses can
be explicitly `PUSH`ed onto the operand stack to avoid the implicit
default operator. Once there, they can act as addresses for the `LOAD`
and `STORE` opcodes: `LOAD` just takes an address off the operand
stack and pushes back on the value found at that address, whilst
`STORE` expects to find a value at the top of the stack, and an
address next. When the addresses are strings, `LOAD` and `STORE`
manipulate the dictionary stacks, but when the addresses found are
lexical addresses they modify the relevant stacks. Again, note how
lexical address when used both through `LOAD` and through the implicit
default operator do *not* remove the referenced values.

    bvm> 17 PUSH hello 3 (0) PUSH (2) LOAD ADD COUNT RETURN
    [17, "hello", 3, 20]

Note how it's legal to store into positions of the stack that don't
yet have values in them!

    bvm> { PUSH (-1, 1) 2 STORE PUSH (-1, 2) 16 STORE } EXEC ADD COUNT RETURN
    ["undef", 18]

Lexical addresses need not be literals: they can be constructed
dynamically by the `LEXICAL_ADDRESS` operator, which expects to find
two numbers on the top of the stack: the top number should be the
*stack index*, and the next number should be the *lexical scope
level*. The following are equivalent:

    bvm> 1 { 2 { 3 { (-1, 0) 1 RETURN } 1 RETURN } EXEC } EXEC EXEC
    [3]
    bvm> 1 { 2 { 3 { (2, 0) 1 RETURN } 1 RETURN } EXEC } EXEC EXEC
    [3]
    bvm> 1 { 2 { 3 { 2 0 LEXICAL_ADDRESS LOAD 1 RETURN } 1 RETURN } EXEC } EXEC EXEC
    [3]

However, note that if you are using the `LEXICAL_ADDRESS` opcode:

1. You **must** provide both numeric operands
2. Both operands must not be negative (thus neither shorthand forms are available)
3. The lexical address constructed is then simply placed on the
  operand stack: it does not at that point go through the implicit
  default operator as it's not being seen as an opcode. You can then
  use `LOAD` and `EXEC` to then perform the deferencing and invocation
  of a code segment, for example.

Again, the following are equivalent:

    bvm> { PUSH goodbye 1 RETURN } EXEC
    ["goodbye"]
    bvm> { PUSH goodbye 1 RETURN } (0)
    ["goodbye"]
    bvm> { PUSH goodbye 1 RETURN } 0 0 LEXICAL_ADDRESS LOAD EXEC
    ["goodbye"]

Once a lexical address enters the operand stack, it is fixed to the
lexical scope determined at that point. This means these addresses can
be used as stable pointers and used to pass by reference. This is
demonstrated in the following by passing a lexical address from one
function to another and showing how it still loads the value
determined relative to the scope in which it is created:

    bvm> { 17 PUSH (0) 1 RETURN } EXEC { 24 1 TAKE LOAD PUSH (0) LOAD 2 RETURN } EXEC
    [17, 24]

If the lexical address was not fixed when it entered the stack, but
reinterpreted at the point of use then the above would return `[24,
24]`, not `[17, 24]`.

### Call with Continuation (CALLCC)

The BVM supports Call-with-Continuation as an opcode. This is a
relatively unusual choice, but is extremely useful in practise for
building more powerful control-flow structures, for example
co-routines.

The `CALLCC` opcode expects to find a code segment on the top of the
stack. It then invokes that code segment, and pushes the old operand
stack on the top of the old operand stack, which as usual is
accessible via `TAKE` within the new code segment. There is
deliberately no dynamic call chain set up, so when the new code
segment returns, control does **not** return to the old segment. For
example:

    bvm> 1 3 { 3 TAKE POP ADD COUNT RETURN } CALLCC PUSH hello DEC
    [4]

Note that none of the instructions to the right of the `CALLCC` get
evaluated in the above example. Also note that if the `CALLCC` were
replaced with an `EXEC` the `3 TAKE` would be illegal as there are
only two values that can be taken at that point: it's the `CALLCC`
that makes the old operand stack itself available as the uppermost
element on the *take-stack*.

But you can choose to `EXEC` the old operand stack itself. At that
point, control returns to the old operand stack and its code segment,
but now its own *take-stack* is set to the operand stack of the code
segment invoked by `CALLCC` itself.

    bvm> 3 { 4 1 TAKE EXEC } CALLCC 1 TAKE ADD COUNT RETURN
    [7]

The `CALLCC` invokes the preceding code segment. That segment pushes
`4` to its stack, followed by the old (and suspended or interrupted)
operand stack, which it then invokes. This returns control to after
the `CALLCC`. In the outer (root) code segment, we can now do the `1
TAKE` which pulls through the `4` which we pushed earlier to the
operand stack of the inner code segment, we then continue and do the
`ADD` as normal.

Note that when you invoke a stack, the dynamic call chain is set so
that control returns after the stack's code segment completes.

    bvm> 3 { 4 1 TAKE EXEC 2 ADD COUNT RETURN } CALLCC 1 TAKE ADD COUNT RETURN
    [9]

I.e. the right-most `RETURN` actually passes control back to the inner
code segment immediately after the `EXEC`, along with the `7` which
then appears on the operand stack of the inner code segment, to which
we then add `2`.

Even more exciting is that you can construct loops this way. (`LOG`
takes the top value off the stack and prints it out on the console.)

    bvm> { 1 TAKE DUPLICATE EXEC } CALLCC PUSH "Hello World" LOG 1 TAKE DUPLICATE EXEC
    "Hello World"
    "Hello World"
    "Hello World"
    ...

Here, in the inner code segment, we take the old operand stack and
duplicate it, which will ensure that when control returns to the outer
code segment, the outer code segment can then take *itself*, which it
then duplicates (thus maintaining this invariant) before invoking
itself and thus infinitely looping.

### Errors

As discussed above, for user errors, it is expected that the
dictionary stack can be used to set up the relevant error-handling
functions for a `try-catch` block. For errors which occur due to
mistakes in the code the BVM is running, the same mechanism is used,
but with the addition of an implicit suspension of the errored operand
stack via `CALLCC`.

For example, if you try to add together a number and a string, an
*invalid operand* error will be raised. This causes nothing more than
a search through the dictionary stack with the key `"ERROR INVALID
OPERAND"`, and if a code segment is found, it is invoked.

    bvm> 5 PUSH hello ADD
    Error: Unhandled error in "ADD": ERROR INVALID OPERAND
    bvm> PUSH "ERROR INVALID OPERAND" { PUSH here 1 RETURN } STORE 5 PUSH hello ADD
    ["here"]

So the usual method of storing a code segment in the dictionary stack
under the name of the error will cause that code segment to be invoked
when the error is raised. When the error handler is invoked, the
*take-stack* will contain (from the top down) the old operand stack,
then the opcode name (a string), then the error name itself (a string)
and then any further details provided by the opcode as to the
specifics of the error. In the case of *invalid operand*, the operands
themselves (one or more of which will be invalid in some way) are
supplied.

    bvm> PUSH "ERROR INVALID OPERAND" { TAKE_COUNT TAKE COUNT RETURN } STORE 5 PUSH hello ADD
    [5,
     "hello",
     "ERROR INVALID OPERAND",
     "ADD",
     {"type": "stack", /* rest elided */ }]

Now you are obviously free to take whatever action you wish, but it's
worth remembering that you can always invoke that old operand stack if
you want to, in order to pass control back to the errored code
segment, to continue after the faulty opcode. This is exactly the same
as with `CALLCC`. The *take-stack* is set up in exactly the same way
too.

    bvm> PUSH "ERROR INVALID OPERAND" { 14 1 TAKE EXEC } STORE 5 PUSH hello ADD 1 TAKE 6 ADD 1 RETURN
    [20]

### Assembly Labels

Some opcodes (notably `JUMP` and `JUMP_IF`) expect to find a number on
the operand stack which represents the offset within the current code
segment to set the instruction pointer to. Code segments are really
just wrapped arrays, where every token is an individual element within
the array. Indices start at 0 and are relative to the code segment. No
form of `JUMP` allows you to set the instruction pointer to an index
within a different code segment.

Thus a simple infinite loop might look like:

    bvm> PUSH "Hello World" LOG 0 JUMP
    "Hello World"
    "Hello World"
    "Hello World"
    ...

And to demonstrate that indices are local to the current code segment:

    bvm> 5 7 ADD LOG { PUSH "Hello World" LOG 0 JUMP } EXEC
    12
    "Hello World"
    "Hello World"
    "Hello World"
    ...

> It's important to remember (if slightly obvious when you think about
> it) that these indices are of the *code segment* and have nothing to
> do with the operand stack.

The object file JSON always requires these indices to be numbers, but
the assembly format supports labels which makes using opcodes such as
`JUMP` much easier and more robust. There are two forms: `>foo<`
declares the location or target of the label `foo`. This declaration
is not an opcode and has no *width* itself: it simply marks `foo` as
being the index within the code segment of the opcode immediately
following the declaration. `<foo>` is a use of the label: it is
replaced with the index. Note that labels can be used before they're
declared, and they are scoped to code segments (thus the same label
name in different code segments is perfectly legal).

The following pairs of examples demonstrate the translation the
assembler performs:

    bvm> >here< PUSH "Hello World" LOG <here> JUMP
    "Hello World"
    "Hello World"
    "Hello World"
    ...
    bvm> PUSH "Hello World" LOG 0 JUMP
    "Hello World"
    "Hello World"
    "Hello World"
    ...

    bvm> <a> JUMP >b< 6 <c> JUMP >c< ADD COUNT RETURN >a< 4 <b> JUMP
    [10]
    bvm> 8 JUMP 6 5 JUMP ADD COUNT RETURN 4 2 JUMP
    [10]

    bvm> { 17 <a> JUMP >b< COUNT RETURN >a< 62 <b> JUMP } EXEC { <a> JUMP >b< ADD COUNT RETURN >a< 2 TAKE <b> JUMP } EXEC
    [79]
    bvm> { 17 5 JUMP COUNT RETURN 62 3 JUMP } EXEC { 5 JUMP ADD COUNT RETURN 2 TAKE 2 JUMP } EXEC
    [79]


# BVM Opcode Reference

## Operand Stack Manipulation

* `PUSH`  
    *Before*:  
    *After*: `a]`  
    *where* `a` is the literal element in the code segment immediately following the `PUSH`.  
    *Errors*: Will error if `PUSH` is the last opcode in a code segment.  
    > Explicitly pushes an item onto the stack.

* `POP`  
    *Before*: `a]`  
    *After*: `]`  
    *Errors*: Will error if there are no items on the operand stack.  
    > Removes and discards the top item from the current operand stack.

* `EXCHANGE`  
    *Before*: `b, a]`  
    *After*: `a, b]`  
    *Errors*: Will error if there are fewer than two items on the operand stack.  
    > Swaps the order of the top two items on the current operand stack.

* `COUNT`  
    *Before*: <code>[a<sub>0</sub>, ..., a<sub>n</sub>]</code>  
    *After*: <code>[a<sub>0</sub>, ..., a<sub>n</sub>, n]</code>  
    *Errors*: None.  
    > Pushes onto the current operand stack an integer being the
    > number of items (or height) of the current operand stack
    > immediately prior to the evaluation of the `COUNT` opcode.

* `CLEAR`  
    *Before*:  
    *After*: `[]`  
    *Errors*: None.  
    > Removes all items from the current operand stack.

* `DUPLICATE`  
    *Before*: `a]`  
    *After*: `a, a]`  
    *Errors*: Will error if there are no items on the operand stack.  
    > Duplicates the item on the top of the current operand stack. If
    > the item found is a reference type (i.e. an array, dictionary,
    > code segment or stack) then it is the pointer to that item that
    > is duplicated, not the item itself.

* `INDEX`  
    *Before*: <code>[a<sub>0</sub>, ..., a<sub>i</sub>, ..., a<sub>n</sub>, i]</code>  
    *After*: <code>[a<sub>0</sub>, ..., a<sub>i</sub>, ..., a<sub>n</sub>, a<sub>i</sub>]</code>  
    *where* `i` is a non-negative integer.  
    *Errors*: Will error if `i` is not a non-negative integer, or if
     `i` is greater than or equal to the number of items on the
     current operand stack.  
    > Pushes onto the current operand stack a duplicate of the `i`th
    > element of the stack, which is 0-indexed, with the first and
    > bottom element of the stack being item 0. As with `DUPLICATE`,
    > reference types are shared, not cloned themselves.

* `COPY`  
    *Before*: <code>a<sub>0</sub>, a<sub>1</sub>, ..., a<sub>n - 1</sub>, n]</code>  
    *After*: <code>a<sub>0</sub>, a<sub>1</sub>, ..., a<sub>n - 1</sub>, a<sub>0</sub>, a<sub>1</sub>, ..., a<sub>n - 1</sub>]</code>  
    *where* `n` is a non-negative integer.  
    *Errors*: Will error if there are fewer than `n + 1` items on the
     current operand stack, or if `n` is not a non-negative integer.
    > Duplicates the top `n` items of the current operand stack. As
    > with `DUPLICATE`, reference types are shared, not cloned
    > themselves.

* `ROLL`  
    *Before*: <code>a<sub>n-1</sub>, ..., a<sub>0</sub>, n, j]</code>  
    *After*: <code>a<sub>(j-1) mod n</sub>, ..., a<sub>0</sub>, a<sub>n-1</sub>, ..., a<sub>j mod n</sub>]</code>  
    *where* `n` is a non-negative integer, and `j` is an integer.  
    *Errors*: Will error if there are fewer than `n + 2` items on the
     current operand stack, or if `n` is not a non-negative integer,
     or if `j` is not an integer.  
    > After removing the `n` and `j` parameters from the current
    > operand stack, rolls (or rotates or circular-shifts) the top `n`
    > items on the current operand stack by `j` steps. Positive `j`
    > indicates *upwards* motion (i.e. items are popped off the top of
    > the stack and placed further down, so items below move up),
    > whilst negative `j` indicates *downwards* motion (i.e. items
    > from lower down are removed and pushed onto the top of the
    > stack, so items at the top of the stack move down).

* `CLONE`  
    *Before*: `a]`  
    *After*: `a, a]`  
    *Errors*: Will error if no items on the current operand stack.  
    > Clones the item on the top of the stack. If the item is a
    > reference type (i.e. an array, dictionary, code segment or
    > stack), the value itself is cloned, thus the two pointers will
    > point a distinct values. This is in contrast to `DUPLICATE`
    > which will result in two pointers pointing at the same
    > object. If the value is not a reference type, then there is no
    > difference between `CLONE` and `DUPLICATE`.

* `UNDEF`  
    *Before*:  
    *After*:  `undef]`  
    *Errors*: None.  
    > Pushes the singleton value `undef`, which represents bottom, and
    > is distinct from `false`, onto the current operand stack.

## Logic

Note that `TRUE` and `FALSE` are opcodes, and so in the JSON object
form, should appear as strings just like all other opcodes, and not as
the JSON values `true` and `false`.

* `TRUE`  
    *Before*:  
    *After*: `true]`  
    *Errors*: None.  
    > Pushes the boolean value `true` onto the current operand stack.

* `FALSE`  
    *Before*:  
    *After*: `false]`  
    *Errors*: None.  
    > Pushes the boolean value `false` (which is distinct from
    > `undef`) onto the current operand stack.

* `NOT`  
    *Before*: `a]`  
    *After*: `b]`  
    *where* `a` is a boolean and `b` is the logical inversion of `a`.  
    *Errors*: Will error if there are no items on the current operand
     stack or if the type of `a` is not a boolean. Note you may not
     use `NOT` as a means to cast from a number or other value which
     some languages may consider as *falsey* or *truthy* to a boolean.  
    > Performs logical negation.

* `AND`  
    *Before*: `b, a]`  
    *After*: `c]`  
    *where* `a` and `b` are booleans, and `c` is the boolean being the
     logical conjunction of `a` and `b`.  
    *Errors*: Will error if fewer than 2 items are on the current
     operand stack or if either of them are not booleans.  
    > Performs logical conjunction.

* `OR`  
    *Before*: `b, a]`  
    *After*: `c]`  
    *where* `a` and `b` are booleans, and `c` is the boolean being the
     logical disjunction of `a` and `b`.  
    *Errors*: Will error if fewer than 2 items are on the current
     operand stack or if either of them are not booleans.  
    > Performs logical disjunction.

* `XOR`  
    *Before*: `b, a]`  
    *After*: `c]`  
    *where* `a` and `b` are booleans, and `c` is the boolean being the
     logical exclusive disjunction of `a` and `b`.  
    *Errors*: Will error if fewer than 2 items are on the current
     operand stack or if either of them are not booleans.  
    > Performs logical exclusive disjunction.
