'use strict';

import {
	createConnection, TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	ProposedFeatures, InitializeParams, DidChangeConfigurationNotification, DocumentFormattingParams, TextEdit
} from 'vscode-languageserver';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;
const diagnosticSource = "Axibase Visual Plugin";

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasConfigurationCapability = capabilities.workspace && !!capabilities.workspace.configuration;
	hasWorkspaceFolderCapability = capabilities.workspace && !!capabilities.workspace.workspaceFolders;
	hasDiagnosticRelatedInformationCapability = capabilities.textDocument && capabilities.textDocument.publishDiagnostics && capabilities.textDocument.publishDiagnostics.relatedInformation;

	return {
		capabilities: {
			textDocumentSync: documents.syncKind,
			documentFormattingProvider: true
		}
	}
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders((_event) => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

function validateTextDocument(textDocument: TextDocument) {
	let diagnostics: Diagnostic[] = [];
	unmatchedEndFor(textDocument).forEach(element => {
		diagnostics.push(element);
	});
	undefinedForVariables(textDocument).forEach(element => {
		diagnostics.push(element);
	});

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function unmatchedEndFor(textDocument: TextDocument): Diagnostic[] {
	const result: Diagnostic[] = [];

	const text = textDocument.getText();
	const regexFor = /\bfor\b/g;
	const regexEndFor = /\bendfor\b/g;

	let matching: RegExpExecArray;

	while(matching = regexFor.exec(text)) {
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

function undefinedForVariables(textDocument: TextDocument): Diagnostic[] {
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

connection.onDidChangeWatchedFiles((_change) => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

connection.onDocumentFormatting((params: DocumentFormattingParams): TextEdit[] => {
	let edits: TextEdit[] = [];
	extraTextSectionLine(params).forEach((edit) => {
		edits.push(edit);
	});

	return edits;
});

function extraTextSectionLine(params: DocumentFormattingParams): TextEdit[] {
	let edits: TextEdit[] = [];
	let document = documents.get(params.textDocument.uri);
	let text = document.getText();
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

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();