start
  = ___ program:Program ___ { return program; }

Char
  = .

EOF
  = !.

WhiteSpace "whitespace"
  = [\t\v\f ]

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"

MultiLineComment
  = "/*" (!"*/" Char)* "*/"

MultiLineCommentNoLineTerminator
  = "/*" (!("*/" / LineTerminatorSequence) Char)* "*/"

SingleLineComment
  = "//" (!LineTerminatorSequence Char)*

Comment "comment"
  = MultiLineComment
  / SingleLineComment

EOF
  = !.

___
  = (WhiteSpace / Comment / LineTerminatorSequence)*

_slc
  = (WhiteSpace / MultiLineCommentNoLineTerminator / SingleLineComment)*

__
  = (WhiteSpace / MultiLineCommentNoLineTerminator)+

_
  = (WhiteSpace / MultiLineCommentNoLineTerminator)*

Program
  = statements:Statements? {
      return {
        type:       "Program",
        statements: statements !== "" ? statements : []
      };
    }

Statements
  = head:Statement _slc ((LineTerminatorSequence ___) / EOF)
    tail:(Statement _slc ((LineTerminatorSequence ___) / EOF))* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][0]);
      }
      return result;
    }

AddressTuple "scope relative address"
  = "(" _ lsp:UnsignedInteger _ "," _ offset:UnsignedInteger _ ")" {
      return {
        type: "AddressTuple",
        lsp: lsp,
        offset: offset
      };
    }
  / "(" _ offset:UnsignedInteger _ ")" { // shorthand - implicitly current scope
      return {
        type: "AddressTuple",
        lsp: 0,
        offset: offset
      };
    }

UnsignedInteger "unsigned integer"
  = HexInteger / DecInteger

SignedInteger "signed integer"
  = sign:Sign? int:UnsignedInteger {
      return (sign && sign === "-") ? - int : int;
    }

HexInteger
  = "0" [xX] digits:HexDigit+ { return parseInt(digits.join(""), 16); }

DecInteger
  = digits:Digit+ { return parseInt(digits.join(""), 10); }

HexDigit
  = [0-9a-fA-F]

Digit
  = [0-9]

Sign
  = [-+]

UnsignedReal
  = before:DecInteger
    after:("." DecInteger)?
    exponent:ExponentPart? {
      return parseFloat("" + before + (after ? "." + after[1] : "") + exponent);
    }

ExponentPart
  = indicator:ExponentIndicator int:SignedInteger {
      return indicator + int;
    }

ExponentIndicator
  = [eE]

SignedNumericLiteral
  = sign:Sign? num:(HexInteger / UnsignedReal) {
      return (sign && sign === "-") ? - num : num;
    }

NumericWidthIndicator
  = 'i16' / 'i32'/ 'i64' / 'ui16' / 'ui32'/ 'ui64' / 'f32' / 'f64'

QuotedStringLiteral "string"
  = parts:('"' QuotedStringCharacters? '"' ) { return parts[1]; }

QuotedStringCharacters
  = chars:QuotedStringCharacter+ { return chars.join(""); }

QuotedStringCharacter
  = '\\"' { return '"'; }
  / !'"' char:Char { return char; }

Statement
  = Segment

  / PushName
  / PushValue
  / Load
  / LoadValue
  / LoadConstant
  / Duplicate
  / Pop
  / Store

  / Enter
  / Return

  / Link
  / Resolve

  / Add
  / Subtract
  / Multiply
  / Divide
  / Increment
  / Decrement

  / Compare
  / IfZero
  / IfNotZero

Segment "segment"
  = segment:SegmentDeclare _slc LineTerminatorSequence ___
    body:Statements? end:SegmentEnd {
      if (body) {
          segment.body = body;
      }
      segment.end = end;
      return segment;
    }

SegmentDeclare "segment declaration"
  = "seg"i
    name:(__ QuotedStringLiteral)?
    arity:(__ UnsignedInteger)? {
      return {
        type: "SEGMENT",
        name: name[1] ? name[1] : undefined,
        arity: arity[1] ? arity[1] : 0,
        line: line, column: column
      };
    }

SegmentEnd "segment end"
  = "end"i { return { type: "END", line: line, column: column }; }

PushName "push name"
  = "pushn"i __ address:AddressTuple {
      return {
        type: "PUSHN",
        address: address,
        line: line, column: column
      };
    }

PushValue "push value"
  = "pushv"i __ address:AddressTuple {
      return {
        type: "PUSHV",
        address: address,
        line: line, column: column
      };
    }

Load "load"
  = "load"i {
      return {
        type: "LOAD",
        line: line, column: column
      };
    }

LoadValue "load value"
  = "loadv"i {
      return {
        type: "LOADV",
        line: line, column: column
      };
    }

LoadConstant "load constant"
  = "loadc"i __ value:((SignedNumericLiteral (_ NumericWidthIndicator)?) / QuotedStringLiteral) {
      return {
        type: "LOADC",
        value: value, // FIX ME
        line: line, column: column
      };
    }

Duplicate "duplicate"
  = "dup"i __ num:UnsignedInteger {
      return {
        type: "DUPLICATE",
        number: num,
        line: line, column: column
      };
    }

Pop "pop"
  = "pop"i __ num:UnsignedInteger {
      return {
        type: "POP",
        number: num,
        line: line, column: column
      };
    }

Store "store"
  = "store"i {
      return {
        type: "STORE",
        line: line, column: column
      };
    }

Enter "enter"
  = "enter"i {
      return {
        type: "ENTER",
        line: line, column: column
      };
    }

Return "return"
  = "return"i {
      return {
        type: "RETURN",
        line: line, column: column
      };
    }

Link "link"
  = "link"i {
      return {
        type: "LINK",
        line: line, column: column
      };
    }

Resolve "resolve"
  = "resolve"i {
      return {
        type: "RESOLVE",
        line: line, column: column
      };
    }

Add "add"
  = "add"i { return { type: "ADD", line: line, column: column }; }

Subtract "subtract"
  = "sub"i { return { type: "SUBTRACT", line: line, column: column }; }

Multiply "multiply"
  = "mul"i { return { type: "MULTIPLY", line: line, column: column }; }

Divide "divide"
  = "div"i { return { type: "DIVIDE", line: line, column: column }; }

Decrement "decrement"
  = "dec"i { return { type: "DECREMENT", line: line, column: column }; }

Increment "increment"
  = "inc"i { return { type: "INCREMENT", line: line, column: column }; }

Compare "compare"
  = "cmp"i _ st:("eq" / "lt" / "lte" / "gt" / "gte") {
      return {
        type: "COMPARE", subtype: st,
        line: line, column: column
      };
    }

IfZero "ifzero"
  = "ifzero"i __ t:AddressTuple f:(__ AddressTuple)? {
      return {
        type: "IFZERO",
        true: t,
        false: f ? f[1] : undefined,
        line: line, column: column
      };
    }

IfNotZero "ifnotzero"
  = "ifnotzero"i __ t:AddressTuple f:(__ AddressTuple)? {
      return {
        type: "IFZERO",
        true: t,
        false: f ? f[1] : undefined,
        line: line, column: column
      };
    }
