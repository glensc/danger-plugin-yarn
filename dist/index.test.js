"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mockfs = require("fs");
jest.mock("node-fetch", () => () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(JSON.parse(mockfs.readFileSync("src/fixtures/danger-npm-info.json", "utf8"))),
}));
const index_1 = require("./index");
beforeEach(() => {
    global.warn = jest.fn();
    global.message = jest.fn();
    global.fail = jest.fn();
    global.markdown = jest.fn();
    global.danger = { utils: { sentence: jest.fn() } };
});
afterEach(() => {
    global.warn = undefined;
    global.message = undefined;
    global.fail = undefined;
    global.markdown = undefined;
});
describe("checkForRelease", () => {
    it("Says congrats if there is a package diff version change", () => {
        (0, index_1.checkForRelease)({ version: { before: "1.0.0", after: "1.0.1" } });
        expect(global.message).toHaveBeenCalledWith(":tada: - congrats on your new release");
    });
    it("Says nothing if there is a no difference in version", () => {
        (0, index_1.checkForRelease)({ version: { before: "1.0.0", after: "1.0.0" } });
        expect(global.message).toHaveBeenCalledTimes(0);
    });
    it("Says nothing if there is a backslip in version", () => {
        (0, index_1.checkForRelease)({ version: { before: "1.0.0", after: "0.2.0" } });
        expect(global.message).toHaveBeenCalledTimes(0);
    });
    it("does nothing when there's no version change", () => {
        (0, index_1.checkForRelease)({});
        expect(global.markdown).toHaveBeenCalledTimes(0);
    });
});
describe("checkForTypesInDeps", () => {
    it("does nothing when there's no dependency changes", () => {
        (0, index_1.checkForTypesInDeps)({});
        expect(global.fail).toHaveBeenCalledTimes(0);
    });
    it("when there is an @types dependency, it should call fail", () => {
        const deps = {
            dependencies: {
                added: ["@types/danger"],
            },
        };
        (0, index_1.checkForTypesInDeps)(deps);
        expect(global.fail).toHaveBeenCalledTimes(1);
    });
});
describe("checkForLockfileDiff", () => {
    it("does nothing when there's no dependency changes", () => {
        (0, index_1.checkForLockfileDiff)("package.json", {});
        expect(global.warn).toHaveBeenCalledTimes(0);
    });
    it("when there are dependency changes, and no lockfile in modified - warn", () => {
        global.danger = { git: { modified_files: [] } };
        const deps = {
            dependencies: {},
        };
        (0, index_1.checkForLockfileDiff)("package.json", deps);
        expect(global.warn).toHaveBeenCalledTimes(1);
    });
    it("when there are dependency changes, and a lockfile in modified - do not warn", () => {
        global.danger = { git: { modified_files: ["yarn.lock"] } };
        const deps = { dependencies: {} };
        (0, index_1.checkForLockfileDiff)("package.json", deps);
        expect(global.warn).toHaveBeenCalledTimes(0);
    });
    it("detects changes from multiple package.json files", () => __awaiter(void 0, void 0, void 0, function* () {
        expect.assertions(6);
        global.danger.utils.sentence = (...args) => args.join(", ");
        global.danger.git = {
            modified_files: ["package.json"],
            created_files: ["packages/my-other-package/package.json"],
            JSONDiffForFile: jest.fn(() => ({
                dependencies: {
                    before: {},
                    after: {
                        "my-new-dependency": "^1.0.0",
                    },
                    added: ["my-new-dependency"],
                },
            })),
        };
        yield (0, index_1.default)();
        expect(global.warn).toHaveBeenCalledTimes(2);
        expect(global.warn.mock.calls[0][0]).toMatch(/.*Changes were made to package.json.*/);
        expect(global.warn.mock.calls[1][0]).toMatch(/.*Changes were made to packages\/my-other-package\/package.json.*/);
        expect(global.markdown).toHaveBeenCalledTimes(2);
        expect(global.markdown.mock.calls[0][0]).toMatchSnapshot();
        expect(global.markdown.mock.calls[1][0]).toMatchSnapshot();
    }));
});
describe("npm metadata", () => {
    it("Shows a bunch of useful text for a new dep", () => __awaiter(void 0, void 0, void 0, function* () {
        expect.assertions(1);
        const npmData = yield (0, index_1.getNPMMetadataForDep)("danger");
        expect((0, index_1._renderNPMTable)({ usedInPackageJSONPaths: ["package.json"], npmData: npmData })).toMatchSnapshot();
    }));
});
describe("Feature Flags", () => {
    it("should skip checkForRelease if options.disableCheckForRelease is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, index_1._operateOnSingleDiff)("package.json", { version: { before: "1.0.0", after: "1.0.1" } }, {}, { disableCheckForRelease: true });
        expect(global.message).toHaveBeenCalledTimes(0);
        expect(global.warn).toHaveBeenCalledTimes(0);
        expect(global.fail).toHaveBeenCalledTimes(0);
        expect(global.markdown).toHaveBeenCalledTimes(0);
    }));
    it("should skip checkForLockFileDiff if options.disableCheckForLockfileDiff is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        global.danger.git = { modified_files: [] };
        const deps = {
            dependencies: { before: {}, after: {} },
        };
        yield (0, index_1._operateOnSingleDiff)("package.json", deps, {}, { disableCheckForLockfileDiff: true });
        expect(global.message).toHaveBeenCalledTimes(0);
        expect(global.warn).toHaveBeenCalledTimes(0);
        expect(global.fail).toHaveBeenCalledTimes(0);
        expect(global.markdown).toHaveBeenCalledTimes(0);
    }));
    it("should skip checkForTypesInDeps if options.disableCheckForTypesInDeps is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        global.danger.git = { modified_files: [] };
        const deps = {
            dependencies: {
                added: ["@types/danger"],
                before: {},
                after: {},
            },
        };
        yield (0, index_1._operateOnSingleDiff)("package.json", deps, {}, { disableCheckForTypesInDeps: true });
        expect(global.message).toHaveBeenCalledTimes(0);
        expect(global.warn).toHaveBeenCalledTimes(1); // Called with "Changes were made to package.json, but not "
        expect(global.fail).toHaveBeenCalledTimes(0);
    }));
    it("should skip checkForNewDependencies if options.disableCheckForNewDependencies is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        global.danger.git = {
            modified_files: ["package.json"],
            created_files: ["packages/my-other-package/package.json"],
            JSONDiffForFile: jest.fn(() => ({
                dependencies: {
                    before: {},
                    after: {
                        "my-new-dependency": "^1.0.0",
                    },
                },
            })),
        };
        yield (0, index_1.default)({ disableCheckForNewDependencies: true });
        expect(global.message).toHaveBeenCalledTimes(0);
        expect(global.warn).toHaveBeenCalledTimes(2); // Called with "Changes were made to package.json, but not […]"
        expect(global.fail).toHaveBeenCalledTimes(0);
    }));
});
