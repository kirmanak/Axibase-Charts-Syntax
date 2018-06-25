import { TextDocument } from "vscode-languageserver/lib/main";
import * as assert from 'assert';
import * as Functions from '../validateFunctions';

suite("Unmatched endfor tests", () => {

    test("Correct one loop", () => {
        const text = 
        "for server in servers\n"+
        "   #do something\n"+
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

    test("Correct two loop", () => {
        const text = 
        "for server in servers\n"+
        "   #do something\n"+
        "endfor\n"+
        "for server in servers\n"+
        "   #do something\n"+
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