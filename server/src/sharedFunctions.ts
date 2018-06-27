export function deleteComments(text: string): string {
	const multiLine = /\/\*[\s\S]*\*\//gm;
	const oneLine = /#.*/g;
	const notNewLine = /./g;
	let i, j: RegExpExecArray;

	while ((i = multiLine.exec(text)) || (i = oneLine.exec(text))) {
		let comment = i[0];
		while (j = notNewLine.exec(comment)) {
			comment = comment.substring(0, j.index) + " " + comment.substring(j.index + 1);
		}
		text = text.substring(0, i.index) + comment +
			text.substring(i.index + comment.length, text.length);
	}

	return text;
}