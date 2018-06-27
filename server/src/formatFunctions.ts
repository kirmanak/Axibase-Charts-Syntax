import { DocumentFormattingParams, TextDocuments, TextEdit } from 'vscode-languageserver';
import * as Shared from './sharedFunctions';

export function extraTextSectionLine(params: DocumentFormattingParams, documents: TextDocuments): TextEdit[] {
	let edits: TextEdit[] = [];
	let document = documents.get(params.textDocument.uri);
	let text = Shared.deleteComments(document.getText());
	let target = /(.*)\[.*\](.*)/g; // incorrect formatting
	let purpose = /\[.*\]/; // correct formatting
	let nonWhiteSpace = /\s*\S+\s*/;
	let matching: RegExpExecArray;

	while (matching = target.exec(text)) {
		let incorrectLine = matching[0];
		let substr = purpose.exec(incorrectLine)[0];
		let before = matching[1];
		let after = matching[2];
		let newText = (nonWhiteSpace.test(before)) ? before + '\n' + substr : substr;
		if (nonWhiteSpace.test(after)) newText += '\n\t' + after;
		let edit: TextEdit = {
			range: {
				start: document.positionAt(matching.index),
				end: document.positionAt(matching.index + incorrectLine.length)
			},
			newText: newText
		};
		edits.push(edit);
	}

	return edits;
}
