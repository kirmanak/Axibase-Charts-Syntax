export function deleteComments(text: string): string {
	const multiLine = /\/\*[\s\S]*\*\//gm;
	const oneLine = /#.*/g;
	let matching: RegExpExecArray;

	while ((matching = multiLine.exec(text)) || (matching = oneLine.exec(text))) {
		text = text.substring(0, matching.index) + text.substring(matching.index + matching[0].length, text.length);
	}

	return text;
}