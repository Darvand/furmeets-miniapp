export const wrapLastText = (maxLineLength: number, ...texts: string[]): string => {
    const totalLength = texts.reduce((acc, text) => acc + text.length, 0);
    if (totalLength < maxLineLength) {
        return texts[texts.length - 1];
    }
    return texts[texts.length - 1].trimEnd().slice(0, maxLineLength - (totalLength - texts[texts.length - 1].length) - 3) + '...';
}


