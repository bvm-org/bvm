# The BVM

The BVM is a stack-based virtual machine, offering a simple and
comparatively high-level instruction set. The design does not make an
assumptions about the type of language being compiled to BVM, but it
does include first-class support for some types of lexical addressing
and closure capture. These features aim to decrease the gap between
modern languages and the BVM, without pigeon-holing the BVM to any
particular type or style of language.

Whilst an exhaustive literature review was not possible before
designing the BVM, substantial investigation into the designs of
virtual machines (or software-CPUs) was undertaken. These included the
world's (suspected) two most popular virtual machines (PostScript and
the JVM) along with rather more obscure past architectures.

The current example implementation is written in JavaScript and is
available to run both in web-browsers and under NodeJS. This
implementation is currently a little over 5k lines of code, including
comments and white-space. Whilst by no means a convincing metric, this
suggests that the design is not especially complex, and that
implementations in other languages should be possible without
excessive engineering effort. There is also substantial potential for
optimisations.


# Design Rationale

The nice thing about designing a virtual machine is that you get to
design a CPU without any horrible hardware limitations. This means
options are open to you which would never have been considered (or
were seldom considered) for hardware designs. For example, where do
operands come from and how are they indicated? Most of the time in
hardware they come from CPU registers, which are explicitly indicated
in the instruction stream. In a VM, they could just come from memory
and the instruction stream include memory references instead. Equally,
they could be implicitly taken from an operand stack.

Not only is it worth examining VM designs, it is worth examining
hardware CPU designs and features. Before the domination of MIPS, Arm
and x86 architectures, there were a vast wealth of innovative hardware
architectures which are well worth studying. Some CPUs were designed
specifically to enable the cheap compilation of certain languages. For
example, the Burroughs Large Systems were specifically designed to
support ALGOL 60, a programming language which many people at the time
said could never be compiled and executed on computers. ALGOL 60 was
the first language implementing nested function definitions with
lexical scope and closure capture. Burroughs built in specific
features to the hardware to make compilation easier. The Burroughs
Large Systems had, for example, hardware support for tracking lexical
scopes and allowing symbolic addressing of locations in parent scopes,
whilst supporting a contiguous operand-and-control-flow stack and
without the compiler needing to attempt to calculate explicit
stack-relative addresses to access parent lexical scopes.

Another interesting feature is the use of *register windows*. These
are widely used in RISC architectures, particularly SPARC, and perhaps
most elegantly in the AMD 29k CPU. A register window exposes just a
subset of the total available registers to each function, and this
subset changes (and is restored) every time you enter (and exit) a
function. This allows both the abstraction of register names, and the
avoidance of software handling of register spilling. In SPARC designs,
the window is fixed size:

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
stack of which contains the current stack-allocated values of the
current call-chain. The AMD 29k CPU had an elegant modification of
this design in that the register window is not of fixed size. Thus
functions declared how many registers they needed and this ensured
better use of the precious resource that are hardware registers.

It is worth noting that the MIPS design team examined this design and
concluded that register windows were an unnecessarily complex feature
and that fewer registers but smarted compilers which made better
decisions about the use of registers were the way forwards. Received
opinion is that this is true, though it's difficult to find compelling
studies given that there are no two CPUs with the same architecture
that differ only in the provision of register windows.

It is obviously also worth studying VM designs themselves. Some of
these are fairly general in nature, whilst others are carefully
designed to match with expected use cases. The JVM, for example,
accommodates Java very well, whilst accommodating less statically-rigid
languages far less well. PostScript contains several features and many
operators specifically designed for the layout of data on a
page. Parrot contains more operators than could ever be considered
reasonable by man or beast. There are however more general design
issues of each that can inform future designs of VMs.

One of the first steps when deciding on a virtual machine design is to
decide whether it's going to register-based or at least whether the
operators are going to have explicit locations of operands indicated
(which could just be memory addresses), or whether it's going to be
stack-based and thus operands are implicitly taken from the head of
the stack.

When measured by use, most virtual machines are stack based. This is
due to the overwhelming influence of both the JVM, and PostScript
which exists in pretty much every serious printer made. But even if
you disregard the popularity of these VMs, there seem to be
relatively few register-based virtual machines. There are several
reasons for this:

1. The only reason hard CPUs have registers is as a means of
identifying locations which are valid holders of operands. With a
software CPU, you don't have this restriction: the operands can come
from anywhere.

2. Hard CPUs have a limited number of registers. Hard CPU registers
are special high-performance locations. In a modern CPU, a *register*
is actually an abstracted location as each register will exist many
times over at most stages within the CPU's pipeline (assuming it's a
pipelined design). With a software CPU, as you're not implementing a
chip, you don't have this limitation. It then seems perverse to
inflict the issues of register-spilling and management onto any
compiler targeting your architecture when there's no hardware-based
reason to have a limited number of registers. Having an unbounded
number of registers in a VM would complicate the instruction set
format as the format to indicate which registers are operands would
become a little involved. Some register-based VMs such as Parrot make
the argument that they can simply map their virtual registers to
hardware registers. This is true, but complicates implementations of
the VM on different architectures with different numbers and types of
hard registers. Furthermore, given the evidence of the speed of well
optimised stack-based VMs such as the JVM, it would seem a
register-based VM is not a necessary precondition of a well-performing
VM.

3. Stack-based instruction sets tend to have better code density. This
is definitely true if you just count *instructions per object-file
byte* as all instructions take operands implicitly from the stack(s),
thus operands are not indicated in the instruction stream. However,
stack machines do have to include instructions for manipulating the
stack to make sure the operands are in the correct location for
upcoming instructions. Good compilers can minimise the use of these
instructions though you will never eliminate them entirely. However,
even with a modest sprinkling of such instructions, this is fewer
bytes lost to arrange operands than with register-based VMs where
every single instruction explicitly indicates its operands. In a world
of mobile devices where bandwidth can often be limited and data
transfer billed, this seems a worthwhile concern.

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

* Should the operand stack (and maybe others?) be contiguous, or
  should each activation frame turn out to be an entirely separate
  stack which merely links to its parent? The contiguous design is
  what people are most used to from e.g. C's use of the stack, but it
  adds cost to closure capture when the environment of the closure can
  include stack-based variables and thus sections of the stack then
  have to be copied out and saved for use by the closure, should it be
  later invoked. This can get very complex if the saved environment
  include the contents of parent lexical scopes which are then
  modified elsewhere and perhaps even shared between different
  closures. For example, in the pseudo code

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
  contiguous, then the stack will be popped and `j` will be lost by
  the time the call to `x()` returns. Thus the potential subsequent
  invocations of `y` and `z` will be problematic unless steps are
  taken to ensure `j` is moved to the heap somewhere and all
  references to it are updated.
  
  Alternatively, if each activation frame is an entirely separate
  stack with merely a pointer to previous stack (thus representing the
  dynamic control-flow path) then the stack that is created by the
  invocation of `x()` and containing `j` need not be destroyed when
  execution returns from `x()`. The values assigned to `y` and `z` are
  then closures that contain not only their operators, but also
  pointers to the various activation-frames (or stacks) that are
  lexically in-scope at the time of declaration of the closure.
  
  This however does start to suggest a design focusing more towards
  lexically scoped variables rather than dynamically scoped
  variables. I believe this is justified though as in a
  lexically-scoped language, implementing a dynamically-scoped
  language is fairly straight-forward (there are a number of
  approaches, but one is simply to have a dictionary which maps
  variable names to their current value). The opposite however is more
  involved: implementing a lexically-scoped language within a
  dynamically scoped language requires keeping many dictionaries
  mapping variable names to values, preserving some and creating new
  which inherit from old whenever you enter or exit a function. In my
  estimation, the majority of popular programming languages today are
  lexically scoped. Thus a VM which supports directly lexically-scoped
  languages and offers built-in support for closure capture is
  advantageous. Furthermore, the provision of these features should
  not make it more difficult for the VM to be targeted by
  dynamically-scoped languages nor for languages which do not support
  first-class functions (and so have no need for closure capture).

## The Java Virtual Machine

The JVM mainly uses 1 byte per op-code in its instruction stream which
is taken from its class-file format. The class-file format contains
other elements such as a constant-look-up table which allows constants
(for example strings) to be removed from the instruction stream in
order facilitate reuse amongst other optimisations. Some instructions
do have further operands taken from the instruction stream. These tend
to point to the fact that the JVM was designed with little more than
the needs of the Java language in mind. So for example, because Java
does closed-world compilation, all method invocation can be resolved
at compile-time. This means that there is never a need to try and look
up a method based on the name on the top of the stack: as all method
names are known at compile-time, they are held in the class-file
constant table, and then all method invocation op-codes take from the
instruction-stream indices into the class-file constant table to
identify the method name. Only the *receiver* of the method invocation
(i.e. the object) is dynamic and thus taken from the stack.

Other examples are that there's no direct heap access at all:
everything's couched in terms of objects.
