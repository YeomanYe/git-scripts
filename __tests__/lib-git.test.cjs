const {
  escapeQuotes,
  unescapeQuotes,
  encodeMessage,
  decodeMessage,
} = require('../src/lib/git');

describe('lib/git pure helpers', () => {
  describe('escapeQuotes / unescapeQuotes', () => {
    it('escapes double quotes for the shell', () => {
      expect(escapeQuotes('say "hi"')).toBe('say \\"hi\\"');
    });

    it('unescapes user-supplied escaped quotes', () => {
      expect(unescapeQuotes('say \\"hi\\" and \\\'yo\\\'')).toBe('say "hi" and \'yo\'');
    });

    it('escape leaves text without quotes untouched', () => {
      expect(escapeQuotes('plain message')).toBe('plain message');
    });
  });

  describe('encodeMessage / decodeMessage', () => {
    it('round-trips newline, carriage return, tab and double quote', () => {
      const original = 'line1\nline2\r\twith "quote"';
      expect(decodeMessage(encodeMessage(original))).toBe(original);
    });

    it('encodes each special character to its marker', () => {
      expect(encodeMessage('a\nb\rc\td"e')).toBe('a::NL::b::CR::c::TAB::d::DQ::e');
    });

    it('escapes pre-existing markers before encoding (matches gcs behavior)', () => {
      // A literal "::NL::" in the user message is first escaped to "::::NL::::"
      // so the encode pass does not mistake it for a real newline.
      expect(encodeMessage('real ::NL:: marker')).toBe('real ::::NL:::: marker');
    });

    it('decode reverses encode for empty string', () => {
      expect(decodeMessage(encodeMessage(''))).toBe('');
    });
  });
});
