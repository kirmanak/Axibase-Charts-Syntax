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
	forLoops(textDocument).forEach(element => {
		diagnostics.push(element);
	});

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function forLoops(textDocument: TextDocument): Diagnostic[] {
	let result: Diagnostic[] = [];

	let text = textDocument.getText();
	let forPattern = /\bfor\s+(\w+)\s+in\s+(\w+)/g;
	let variablePattern = /\@\{(\w+)\}/;
	let endForPattern = /\bendfor\b/g;

	let matchingFor: RegExpExecArray;
	let matchingVariable: RegExpExecArray;

	while (matchingFor = forPattern.exec(text)) {
		let variableName = matchingFor[1];
		if (matchingVariable = variablePattern.exec(text)) {
			let foundVar = matchingVariable[1];
			if (foundVar != variableName) {
				let diagnostic: Diagnostic = {
					severity: DiagnosticSeverity.Error,
					range: {
						start: textDocument.positionAt(matchingVariable.index + 2),
						end: textDocument.positionAt(matchingVariable.index + foundVar.length + 2)
					},
					message: `${foundVar} is undefined`,
					source: diagnosticSource
				};
				if (hasDiagnosticRelatedInformationCapability) {
					diagnostic.relatedInformation = [
						{
							location: {
								uri: textDocument.uri,
								range: diagnostic.range
							},
							message: `For loop variable is ${variableName}, but found ${foundVar}`
						}
					];
				}
				result.push(diagnostic);
			}
		}
		if (endForPattern.exec(text) == null) {
			let diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: textDocument.positionAt(matchingFor.index),
					end: textDocument.positionAt(matchingFor.index + matchingFor[0].length)
				},
				message: "Matching endfor not found",
				source: diagnosticSource
			};
			if (hasDiagnosticRelatedInformationCapability) {
				diagnostic.relatedInformation = [
					{
						location: {
							uri: textDocument.uri,
							range: diagnostic.range
						},
						message: "For keyword has no matching endfor keyword"
					}
				];
			}
			result.push(diagnostic);
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