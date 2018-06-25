import { Diagnostic, DiagnosticSeverity, TextDocument } from "vscode-languageserver/lib/main";

const diagnosticSource = "Axibase Visual Plugin";

export function nonExistentAliases(textDocument: TextDocument, hasDiagnosticRelatedInformationCapability: boolean): Diagnostic[] {
	const result: Diagnostic[] = [];

	const text = textDocument.getText();
	const aliasRegex = /alias\s*?=\s*?(\w[-\w\d_])/g;
	const deAliasRegex = /value\((['"])(.*)\1\)/g;

	let matching: RegExpExecArray;
	let aliases: String[] = [];

	while (matching = aliasRegex.exec(text)) {
		aliases.push(matching[1]);
	}

	while (matching = deAliasRegex.exec(text)) {
		const deAlias = matching[2];
		if (!aliases.find(alias => alias == deAlias)) {
			const deAliasStart = matching.index + 'value("'.length;
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: textDocument.positionAt(deAliasStart),
					end: textDocument.positionAt(deAliasStart + matching[2].length)
				},
				message: "Non-existent alias",
				source: diagnosticSource
			};
			if (hasDiagnosticRelatedInformationCapability) {
				diagnostic.relatedInformation = [
					{
						location: {
							uri: textDocument.uri,
							range: diagnostic.range
						},
						message: `The alias is referred, but never declared.`
					}
				];
			}
			result.push(diagnostic);
		}
	}

	return result;
}

export function unmatchedEndFor(textDocument: TextDocument, hasDiagnosticRelatedInformationCapability: boolean): Diagnostic[] {
	const result: Diagnostic[] = [];

	const text = textDocument.getText();
	const regexFor = /\bfor\b/g;
	const regexEndFor = /\bendfor\b/g;

	let matching: RegExpExecArray;

	while (matching = regexFor.exec(text)) {
		if (!regexEndFor.exec(text)) {
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: textDocument.positionAt(matching.index),
					end: textDocument.positionAt(matching.index + 3)
				},
				message: "For loop has no matching endfor",
				source: diagnosticSource
			};
			if (hasDiagnosticRelatedInformationCapability) {
				diagnostic.relatedInformation = [
					{
						location: {
							uri: textDocument.uri,
							range: diagnostic.range
						},
						message: `For keyword expects endfor keyword`
					}
				];
			}
			result.push(diagnostic);
		}
	}

	return result;
}

export function undefinedForVariables(textDocument: TextDocument, hasDiagnosticRelatedInformationCapability: boolean): Diagnostic[] {
	const result: Diagnostic[] = [];

	const text = textDocument.getText();
	const forPattern = /(for\s(\w+?)\sin\s\w+?)\s([\s\S]*?)\sendfor/gm;
	const variablePattern = /@\{(\w+)\}/g;

	let matchingFor: RegExpExecArray;
	while (matchingFor = forPattern.exec(text)) {
		const forDeclarationLength = matchingFor[1].length;
		const forVariable = matchingFor[2];
		const forContents = matchingFor[3];
		let matchingVariable: RegExpExecArray;
		while (matchingVariable = variablePattern.exec(forContents)) {
			const foundVariable = matchingVariable[1];
			if (foundVariable != forVariable) {
				let diagnostic: Diagnostic = {
					severity: DiagnosticSeverity.Error,
					range: {
						start: textDocument.positionAt(forDeclarationLength + matchingFor.index + matchingVariable.index + 3),
						end: textDocument.positionAt(forDeclarationLength + matchingFor.index + matchingVariable.index + foundVariable.length + 3)
					},
					message: `${foundVariable} is undefined`,
					source: diagnosticSource
				};
				if (hasDiagnosticRelatedInformationCapability) {
					diagnostic.relatedInformation = [
						{
							location: {
								uri: textDocument.uri,
								range: diagnostic.range
							},
							message: `For loop variable is ${forVariable}, but found ${foundVariable}`
						}
					];
				}
				result.push(diagnostic);
			}
		}
	}

	return result;
}