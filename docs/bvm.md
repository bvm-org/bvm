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

## The Java Virtual Machine

The JVM mainly uses 1 byte per opcode in its instruction stream which
is taken from its class-file format. The class-file format contains
other elements such as a constant-lookup table which allows constants
(for example strings) to be removed from the instruction stream in
order facilitate reuse amongst other optimisations. Some instructions
do have further operands taken from the instruction stream. These tend
to point to the fact that the JVM was designed with little more than
the needs of the Java language in mind. So for example, because Java
does closed-world compilation, all method invocation can be resolved
at compile-time. This means that there is never a need to try and look
up a method based on the name on the top of the stack: as all method
names are known at compile-time, they are held in the class-file
constant table, and then all method invocation opcodes take from the
instruction-stream indices into the class-file constant table to
identify the method name. Only the *receiver* of the method invocation
(i.e. the object) is dynamic and thus taken from the stack.

Other examples are that there's no direct heap access at all:
everything's couched in terms of objects.
