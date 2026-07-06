// Wraps free text into at most `maxLines` lines of at most `maxCharsPerLine`
// characters each, discarding any overflow. Because each resulting line fits
// within a single PDF row, the cell renders at most `maxLines` rows even for
// long words (which pdfmake's automatic word wrapping would otherwise push onto
// an extra row, spilling the metadata onto a second page).
export function limitTextToLines(
    value: string,
    maxCharsPerLine: number,
    maxLines: number
): string {
    if (!value) {
        return value;
    }
    const words = value
        .replace(/[\r\n]+/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0);

    const lines: string[] = [];
    let current = '';

    for (const rawWord of words) {
        if (lines.length >= maxLines) {
            break;
        }
        let word = rawWord;
        // Hard-break a single word that is wider than a whole line.
        while (word.length > maxCharsPerLine && lines.length < maxLines) {
            if (current) {
                lines.push(current);
                current = '';
                if (lines.length >= maxLines) {
                    break;
                }
            }
            lines.push(word.slice(0, maxCharsPerLine));
            word = word.slice(maxCharsPerLine);
        }
        if (lines.length >= maxLines || word.length === 0) {
            continue;
        }
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxCharsPerLine) {
            current = candidate;
        } else {
            lines.push(current);
            current = word;
        }
    }
    if (current && lines.length < maxLines) {
        lines.push(current);
    }
    return lines.slice(0, maxLines).join('\n');
}
