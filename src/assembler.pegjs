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
  = LabelDeclaration
  / Section
  / Push
  / StatementNonLabelDeclSectionPush

StatementNonLabelDeclSectionPush
  = LexicalAddress
  / SignedNumericLiteral
  / QuotedCharLiteral
  / LabelReference
  / Opcode

Push "push"
  = PushOpcode __ operand:PushOperand {
      return {
        type: "PUSH",
        operand: operand
      };
    }

PushOpcode
  = "PUSH" / "\"PUSH\""

PushOperand
    = LabelDeclarationPush
    / start:SectionStart { return start + "_START"; }
    / end:SectionEnd { return end + "_END"; }
    / PushOpcode
    / StatementNonLabelDeclSectionPush

Section "section"
  = start:SectionStart __
    statements:Statements?
    end:SectionEnd & { return start === end; } {
      return {
        type: "Section",
        subtype: start,
        statements: statements ? statements : []
      };
    }

SectionStart
  = type:SectionPrefix "_START" { return type; }
  / "[" { return "ARRAY"; }
  / "<" { return "DICT"; }
  / "{" { return "SEG"; }

SectionEnd
  = type:SectionPrefix "_END" { return type; }
  / "]" { return "ARRAY"; }
  / ">" { return "DICT"; }
  / "}" { return "SEG"; }

SectionPrefix
  = "SEG" / "ARRAY" / "DICT"

LexicalAddress "lexical address"
  = "(" _ lsl:SignedInteger _ "," _ index:SignedInteger _ ")" {
      return {
        type: "LexicalAddress",
        lsl: lsl,
        index: index
      };
    }
  / "(" _ index:SignedInteger _ ")" { // shorthand - implicitly current scope
      return {
        type: "LexicalAddress",
        index: index
      };
    }

SignedNumericLiteral "signed numeric literal"
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
  = parts:('"' QuotedStringCharacters? '"' ) {
      return parts[1];
    }

QuotedStringCharacters
  = chars:QuotedStringCharacter+ { return chars.join(""); }

QuotedStringCharacter
  = Escaped
  / !"\"" char:Char { return char; }

QuotedCharLiteral "char"
  = parts:("'" QuotedStringCharacter "'" ) {
      return {
        type: "QuotedChar",
        content: parts[1]
      };
    }

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
  = !SingleEscapeCharacter char:Char { return char; }

LabelDeclaration "label declaration"
  = ">" name:LabelName "<" __ statement:Statement {
    return {
      type: "LabelDeclaration",
      name: name,
      statement: statement
    };
  }

LabelDeclarationPush "label declaration"
  = ">" name:LabelName "<" __ statement:PushOperand {
    return {
      type: "LabelDeclaration",
      name: name,
      statement: statement
    };
  }

LabelReference "label reference"
  = "<" name:LabelName ">" {
    return {
      type: "LabelReference",
      name: name
    };
  }

LabelName "label name"
 = Opcode / UnsignedInteger

Opcode
  = !SectionStart !SectionEnd !PushOpcode chars:OpcodeCharset { return chars; }
  / QuotedStringLiteral

OpcodeCharset "opcode"
  = start:[A-Za-z] rest:[A-Za-z0-9_]* { return '' + start + rest.join(""); }

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
