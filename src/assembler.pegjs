start
  = ___ program:Program ___ { return program; }

Program
  = statements:Statements? {
      return {
        type:       "Program",
        statements: statements !== "" ? statements : []
      };
    }

Statements
  = head:Statement (__ / EOF)
    tail:(Statement (__ / EOF))* {
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

Section "section"
  = start:SectionStart __
    statements:Statements?
    end:SectionEnd & {
      return start.text === end.text;
    } {
      return {
        type: "Section",
        subtype: start.type,
        statements: statements
      };
    }

SectionStart
  = type:SectionPrefix "_START"i { type = type.toUpperCase();
                                   return { type: type, text: type }; }
  / "[" { return { type: "ARRAY", text: 0 }; }
  / "<" { return { type: "DICT", text: 1 }; }
  / "{" { return { type: "SEG", text: 2 }; }

SectionEnd
  = type:SectionPrefix "_END"i { type = type.toUpperCase(); return { type: type, text: type }; }
  / "]" { return { type: "ARRAY", text: 0 }; }
  / ">" { return { type: "DICT", text: 1 }; }
  / "}" { return { type: "SEG", text: 2 }; }

SectionPrefix
  = "SEG"i / "ARRAY"i / "DICT"i

PushOpcode
  = Push __
    arg:(LexicalAddress / SignedNumericLiteral / QuotedStringLiteral) {
      return {
        type: "Push",
        arg: arg
      };
    }

Push "push"
  = "PUSH"i

LexicalAddress "lexical address"
  = "(" _ lsl:SignedInteger _ "," _ index:UnsignedInteger _ ")" {
      return {
        type: "LexicalAddress",
        lsl: lsl,
        index: index
      };
    }
  / "(" _ index:UnsignedInteger _ ")" { // shorthand - implicitly current scope
      return {
        type: "LexicalAddress",
        index: index
      };
    }

SignedNumericLiteral
  = sign:Sign? num:(HexInteger / UnsignedReal) {
      return (sign && sign === "-") ? - num : num;
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

QuotedStringLiteral "string"
  = parts:('"' QuotedStringCharacters? '"' ) { return parts[1]; }

QuotedStringCharacters
  = chars:QuotedStringCharacter+ { return chars.join(""); }

QuotedStringCharacter
  = Escaped
  / !"\"" char:Char { return char; }

EscapeChar
  = "\\"

Escaped
  = EscapeChar char:(SingleEscapeCharacter / NonEscapeCharacter) { return char; }

SingleEscapeCharacter
  = char:[\'\"\\bfnrtv] {
      return char
        .replace("b", "\b")
        .replace("f", "\f")
        .replace("n", "\n")
        .replace("r", "\r")
        .replace("t", "\t")
        .replace("v", "\x0B") // IE does not recognize "\v".
    }

NonEscapeCharacter
  = (!SingleEscapeCharacter) char:Char { return char; }

Opcode
  = chars:(!(SectionPrefix / Push) OpcodeCharset+ ) { return chars[1].join(""); }

OpcodeCharset "opcode"
  = [A-Za-z_]

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

__
  = (WhiteSpace / Comment / LineTerminatorSequence)+

_
  = (WhiteSpace / MultiLineCommentNoLineTerminator)*
