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
comments and white-space, and minimises to just 60kB (including
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

To download, either just:

    $ npm install bvm
    $ cd bvm

Or:

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
error-handling (i.e. try-catch) and also to build a micro-kernel /
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
  the lexical scope in which they were declared.

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
operator.

The only exception to this general strategy is the `PUSH` opcode,
which causes the following element from the current segment's
instruction stream to be placed onto the operand stack.

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

Because every function can return a variable number of results,
results will always be displayed in an array, even though in this
case, we've only returned a single result. Note that because the
current BVM implementation is written in JavaScript, the results
returned and displayed by the REPL are JSON-formatted data objects and
thus differ in format from the input of BVM assembly. For example, BVM
assembly requires whitespace separators, whereas JSON tends to remove
whitespace where other separators must be used, for example `,` and
`:` in arrays and objects.

If we do:

    bvm> PUSH 13 PUSH 3 PUSH 5 ADD COUNT RETURN
    [13, 8]

We see that the `ADD` only affects the uppermost two elements of the
stack and the `13` is left alone. `COUNT` will then find there are two
elements on the stack and so will push the number `2`. `RETURN` will
then find that `2` and will then grab the next two elements from the
stack and return them to us.

There is an implicit default operator. This is overloaded and will be
explained part by part. When an opcode is encountered which is not a
built-in opcode, this default operator is invoked. *If the opcode
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
values are returned to your own caller:

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

Segments are first-class values, so for example, you can return them
from other segments:

    bvm> { { 6 8 ADD 1 RETURN } 1 RETURN } EXEC EXEC
    [14]
    bvm> 6 8 { 3 5 { 2 TAKE ADD 1 RETURN } 1 RETURN } EXEC EXEC
    [14]

This last one demonstrates that `TAKE` operates on the dynamic calling
stack, and not on the lexical scope.
