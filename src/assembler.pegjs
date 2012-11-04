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

MultiLineComment "multi-line comment"
  = "/*" (!"*/" Char)* "*/"

MultiLineCommentNoLineTerminator
  = "/*" (!("*/" / LineTerminatorSequence) Char)* "*/"

SingleLineComment "single-line comment"
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

gap
  = (LineTerminatorSequence / WhiteSpace / MultiLineComment / (SingleLineComment LineTerminatorSequence))+

Program
  = statements:Statements? {
      return {
        type:       "Program",
        statements: statements !== "" ? statements : []
      };
    }

Statements
  = head:Statement (gap / EOF)
    tail:(Statement (gap / EOF))* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][0]);
      }
      return result;
    }

Statement
  = Section
  / PushOpcode
  / LexicalAddress
  / SignedNumericLiteral
  / QuotedStringLiteral
  / Opcode

PushOpcode
  = Push gap
    arg:(LexicalAddress / SignedNumericLiteral / QuotedStringLiteral) {
      return {
        type: "PUSH",
        arg: arg
      };
    }

Push "push"
  = "PUSH"i

SectionPrefix
  = "SEG"i / "ARRAY"i / "DICT"i

Section "section"
  = start:SectionPrefix "_START"i gap
    contents:Statements?
    end:SectionPrefix "_END"i & {
      return start === end;
    } {
      return {
        type: start,
        contents: contents
      };
    }

LexicalAddress "lexical address"
  = "(" _ lsp:UnsignedInteger _ "," _ offset:UnsignedInteger _ ")" {
      return {
        type: "LexicalAddress",
        lsp: lsp,
        offset: offset
      };
    }
  / "(" _ offset:UnsignedInteger _ ")" { // shorthand - implicitly current scope
      return {
        type: "LexicalAddress",
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
  / '\\\\' { return '\\'; }
  / !'"' char:Char { return char; }

Opcode
  = chars:(!(SectionPrefix / Push) OpcodeCharset+) { return chars[1].join(""); }

OpcodeCharset "opcode"
  = [A-Za-z_]
