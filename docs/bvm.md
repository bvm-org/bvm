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
