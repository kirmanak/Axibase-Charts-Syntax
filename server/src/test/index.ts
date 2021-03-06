//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//
// You can provide your own test runner if you want to override it by exporting
// A function run(testRoot: string, clb: (error:Error) => void) that the extension
// Host can call to run the tests. The test runner is expected to use console.log
// To report the results back to the caller. When the tests are finished, return
// A possible error to the callback or null if none.

// tslint:disable-next-line:no-submodule-imports
import * as testRunner from "vscode/lib/testrunner";

// You can directly control Mocha options by uncommenting the following lines
// See https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options for more info
testRunner.configure({
    ui: "tdd", 		// The TDD UI is being used in extension.test.ts (suite, test, etc.)
    useColors: true, // Colored output from test results
});

module.exports = testRunner;
