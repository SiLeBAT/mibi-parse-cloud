import { limitTextToLines } from '../pdf-text.util';

const MAX_PER_LINE = 60;
const MAX_LINES = 2;

const linesOf = (out: string) => out.split('\n');

describe('limitTextToLines', () => {
    it('returns short text unchanged on a single line', () => {
        const out = limitTextToLines(
            'kurzer Kommentar',
            MAX_PER_LINE,
            MAX_LINES
        );
        expect(out).toBe('kurzer Kommentar');
        expect(linesOf(out)).toHaveLength(1);
    });

    it('never produces more than the allowed number of rows (short words)', () => {
        const text = Array(60).fill('wort').join(' '); // 60 short words
        const out = limitTextToLines(text, MAX_PER_LINE, MAX_LINES);
        const lines = linesOf(out);
        expect(lines.length).toBeLessThanOrEqual(MAX_LINES);
        lines.forEach(line =>
            expect(line.length).toBeLessThanOrEqual(MAX_PER_LINE)
        );
    });

    it('never produces more than the allowed number of rows (long words)', () => {
        // The word that triggered the ticket: 52 characters, no spaces.
        const longWord =
            'Fussballweltmeisterschaftsendspielpokalsiegerbesieger';
        const text = Array(6).fill(longWord).join(' ');
        const out = limitTextToLines(text, MAX_PER_LINE, MAX_LINES);
        const lines = linesOf(out);
        expect(lines.length).toBeLessThanOrEqual(MAX_LINES);
        lines.forEach(line =>
            expect(line.length).toBeLessThanOrEqual(MAX_PER_LINE)
        );
    });

    it('hard-breaks a single word that is longer than a whole line', () => {
        const out = limitTextToLines('x'.repeat(150), MAX_PER_LINE, MAX_LINES);
        const lines = linesOf(out);
        expect(lines).toHaveLength(2);
        expect(lines[0]).toBe('x'.repeat(MAX_PER_LINE));
        expect(lines[1]).toBe('x'.repeat(MAX_PER_LINE));
    });

    it('collapses existing line breaks into spaces before wrapping', () => {
        expect(limitTextToLines('a\r\nb\nc', MAX_PER_LINE, MAX_LINES)).toBe(
            'a b c'
        );
    });

    it('returns empty/falsy values unchanged', () => {
        expect(limitTextToLines('', MAX_PER_LINE, MAX_LINES)).toBe('');
    });
});
