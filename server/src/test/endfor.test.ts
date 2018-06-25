import { TextDocument } from "vscode-languageserver/lib/main";
import * as assert from 'assert';
import * as Functions from '../validateFunctions';

suite("Unmatched endfor tests", () => {

    test("One correct loop", () => {
        const text =
            "for server in servers\n" +
            "   #do something\n" +
            "endfor";
        const document: TextDocument = TextDocument.create(
            "testDoc", // uri
            "atsd-visual", // language id
            0, // version
            text // content
        );
        const result = Functions.unmatchedEndFor(document, true);
        assert.equal(result.length, 0);
    });

    test("Two correct loops", () => {
        const text =
            "for server in servers\n" +
            "   #do something\n" +
            "endfor\n" +
            "for server in servers\n" +
            "   #do something\n" +
            "endfor";
        const document: TextDocument = TextDocument.create(
            "testDoc", // uri
            "atsd-visual", // language id
            0, // version
            text // content
        );
        const result = Functions.unmatchedEndFor(document, true);
        assert.equal(result.length, 0);
    });
});