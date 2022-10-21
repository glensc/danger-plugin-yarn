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
exports._operateOnSingleDiff = exports.checkForTypesInDeps = exports.checkForLockfileDiff = exports._renderNPMTable = exports.getNPMMetadataForDep = exports.getYarnMetadataForDep = exports.findNewDependencies = exports.checkForNewDependencies = exports.checkForRelease = void 0;
const child_process = require("child_process");
const date_fns_1 = require("date-fns");
const fetch = require("node-fetch");
const semver = require("semver");
const includesOriginal = require("lodash.includes");
const includes = includesOriginal;
// Celebrate when a new release is being shipped
const checkForRelease = packageDiff => {
    if (packageDiff.version && packageDiff.version.before && packageDiff.version.after) {
        if (semver.lt(packageDiff.version.before, packageDiff.version.after)) {
            message(":tada: - congrats on your new release");
        }
    }
};
exports.checkForRelease = checkForRelease;
const cacheEntryForDep = (cache, depName) => {
    if (cache[depName]) {
        return [false, cache[depName]];
    }
    else {
        cache[depName] = {
            packageJSONPaths: [],
            npmData: {
                details: [],
                readme: "`[no-data-present]`",
            },
        };
        return [true, cache[depName]];
    }
};
// Initial stab at showing information about a new dependency
const checkForNewDependencies = (packagePath, packageDiff, duplicationCache, npmRegistryUrl, npmAuthToken) => __awaiter(void 0, void 0, void 0, function* () {
    const newDependencies = (0, exports.findNewDependencies)(packageDiff);
    for (const dep of newDependencies) {
        const [freshlyCreated, cacheEntry] = cacheEntryForDep(duplicationCache, dep);
        cacheEntry.packageJSONPaths.push(packagePath);
        if (!freshlyCreated) {
            continue;
        }
        // Pump out a bunch of metadata information
        const npm = yield (0, exports.getNPMMetadataForDep)(dep, npmRegistryUrl, npmAuthToken);
        if (npm) {
            cacheEntry.npmData.details = npm.details;
            cacheEntry.npmData.readme = npm.readme;
        }
        else if (dep) {
            warn(`Could not get info from npm on ${safeLink(dep)}</a>`);
        }
        if ("undefined" === typeof peril) {
            const yarn = yield (0, exports.getYarnMetadataForDep)(dep);
            if (yarn && yarn.length) {
                cacheEntry.yarnBody = yarn;
            }
            else if (dep) {
                warn(`Could not get info from yarn on ${safeLink(dep)}`);
            }
        }
    }
});
exports.checkForNewDependencies = checkForNewDependencies;
const findNewDependencies = (packageDiff) => {
    const added = [];
    for (const element of [packageDiff.dependencies, packageDiff.devDependencies]) {
        if (element && element.added && element.added.length) {
            added.push.apply(added, element.added);
        }
    }
    return added;
};
exports.findNewDependencies = findNewDependencies;
const getYarnMetadataForDep = (dep) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(resolve => {
        child_process.exec(`yarn why '${dep}' --json`, (err, output) => {
            if (output) {
                // Comes as a series of little JSON messages
                const usefulJSONContents = output.toString().split(`{"type":"activityEnd","data":{"id":0}}`).pop();
                const asJSON = usefulJSONContents.split("}\n{").join("},{");
                const whyJSON = JSON.parse(`[${asJSON}]`);
                const messages = whyJSON.filter(msg => typeof msg.data === "string").map(m => m.data);
                resolve(`
  <details>
    <summary><code>yarn why ${printDep(dep)}</code> output</summary>
    <ul><li><code>${messages.join("</code></li><li><code>")}
    </code></li></ul>
  </details>
  `);
            }
            else {
                resolve("");
            }
        });
    });
});
exports.getYarnMetadataForDep = getYarnMetadataForDep;
const safeLink = (name) => `<a href='${linkToNPM(name)}'><code>${printDep(name)}</code></a>`;
const printDep = (name) => name.replace(/@/, "&#64;");
const linkToNPM = (name) => `https://www.npmjs.com/package/${name}`;
const forwardSlashRegex = /(\/+)/g;
/**
 * Long enough URLs as contiguous text forces browsers to avoid wrapping them
 *  this expands a table beyond the bounds of the viewport too easily.
 * Inserting <wbr/> tags allows the browser to wrap the url at each path segment.
 */
const wrappableURLForTextDisplay = (url) => (url || "").replace(forwardSlashRegex, `$1<wbr/>`);
const isTableDeetPlaceholder = (deet) => {
    return "placeholderKey" in deet;
};
const isTableDeetFormatted = (deet) => {
    return "content" in deet;
};
const isTableRowBreak = (deet) => {
    return "break" in deet;
};
const getNPMMetadataForDep = (dep, npmRegistryUrl, npmAuthToken) => __awaiter(void 0, void 0, void 0, function* () {
    const sentence = danger.utils.sentence;
    // Note: NPM can't handle encoded '@'
    const urlDep = encodeURIComponent(dep).replace("%40", "@");
    npmRegistryUrl = npmRegistryUrl || "https://registry.npmjs.org";
    const headers = npmAuthToken ? { Authorization: `Bearer ${npmAuthToken}` } : undefined;
    const npmResponse = yield fetch(`${npmRegistryUrl}/${urlDep}`, { headers });
    if (npmResponse.ok) {
        /**
         * TableDeets is carefully constructed to be a 2-wide table, with some entries spanning columns
         * Testing on mobile / web, 4-wide tables were too easy to break the viewport bounds.
         */
        const tableDeets = [];
        const npm = (yield npmResponse.json());
        const homepage = npm.homepage ? npm.homepage : `http://npmjs.com/package/${dep}`;
        // Left
        tableDeets.push({ content: `<h2><a href="${homepage}">${printDep(dep)}</a></h2>` });
        // Right
        tableDeets.push({ placeholderKey: "used-in-packages" });
        tableDeets.push({ break: "row-break" });
        // Left
        tableDeets.push({ name: "Author", message: npm.author && npm.author.name ? npm.author.name : "Unknown" });
        // Right
        tableDeets.push({ name: "Description", message: npm.description });
        tableDeets.push({ break: "row-break" });
        // Left
        const license = npm.license;
        if (license) {
            tableDeets.push({ name: "License", message: license });
        }
        else {
            // License is important, so always show info
            tableDeets.push({
                name: "License",
                message: "<b>NO LICENSE FOUND</b>",
            });
        }
        // Right
        tableDeets.push({ name: "Homepage", message: `<a href="${homepage}">${wrappableURLForTextDisplay(homepage)}</a>` });
        tableDeets.push({ break: "row-break" });
        const hasKeywords = npm.keywords && npm.keywords.length;
        if (hasKeywords) {
            // Whole row
            tableDeets.push({
                name: "Keywords",
                message: sentence(npm.keywords),
                colspan: 2,
            });
            tableDeets.push({ break: "row-break" });
        }
        const createdTimeStr = npm.time && npm.time.created
            ? `${(0, date_fns_1.distanceInWords)(new Date(npm.time.created), new Date())} ago`
            : "Unknown";
        const updatedTimeStr = npm.time && npm.time.modified
            ? `${(0, date_fns_1.distanceInWords)(new Date(npm.time.modified), new Date())} ago`
            : createdTimeStr;
        // Left
        tableDeets.push({ name: "Updated", message: updatedTimeStr });
        // Right
        tableDeets.push({ name: "Created", message: createdTimeStr });
        tableDeets.push({ break: "row-break" });
        const hasReleases = npm["dist-tags"] && npm["dist-tags"].latest;
        const hasMaintainers = npm.maintainers && npm.maintainers.length;
        if (hasReleases) {
            tableDeets.push(Object.assign({ name: "Releases", message: String(Object.keys(npm.versions).length) }, !hasMaintainers ? { colspan: 2 } : {}));
        }
        if (hasMaintainers) {
            tableDeets.push(Object.assign({ name: "Maintainers", message: npm.maintainers.length }, !hasReleases ? { colspan: 2 } : {}));
        }
        tableDeets.push({ break: "row-break" });
        if (hasKeywords) {
            const currentTag = npm["dist-tags"].latest;
            const tag = npm.versions[currentTag];
            // Whole row
            if (tag.dependencies) {
                const deps = Object.keys(tag.dependencies);
                const depLinks = deps.map(safeLink);
                tableDeets.push({
                    name: "Direct <wbr/>Dependencies",
                    message: depLinks
                        .reduce((accum, link, idx) => {
                        if (idx !== 0) {
                            accum.push(", <wbr/>");
                        }
                        accum.push(link);
                        return accum;
                    }, [])
                        .join(""),
                    colspan: 3,
                });
                tableDeets.push({ break: "row-break" });
            }
        }
        // Insert any table-content above this point!
        if (isTableRowBreak(tableDeets[tableDeets.length - 1])) {
            // Remove unnecessary row-break
            tableDeets.pop();
        }
        // Outside the table
        let readme = npm.readme ? "This README is too long to show." : "";
        if (npm.readme && npm.readme.length < 10000) {
            readme = `
<details>
<summary><code>README</code></summary></br>

${npm.readme}

</details>
`;
        }
        return {
            details: tableDeets,
            readme,
        };
    }
});
exports.getNPMMetadataForDep = getNPMMetadataForDep;
function renderCell({ colspanToUse = 1, content }) {
    return `<td${colspanToUse !== 1 ? ` colspan="${colspanToUse}"` : ""}> ${content} </td>`;
}
/**
 * Little renderer for the npm table details and relies on the data to be provided
 * @private Only exported for testing reasons.
 */
function _renderNPMTable({ usedInPackageJSONPaths, npmData: { details, readme }, }) {
    const rowContent = [""];
    const unProcessedDetails = details.slice();
    while (unProcessedDetails.length) {
        const deet = unProcessedDetails.shift();
        const currentRowIndex = rowContent.length - 1;
        if (isTableRowBreak(deet)) {
            rowContent.push("");
            continue;
        }
        const colspanToUse = Math.max(deet.colspan || 0, 1);
        let content = "";
        if (isTableDeetPlaceholder(deet)) {
            if (deet.placeholderKey === "used-in-packages") {
                content = `<i>Used in ${usedInPackageJSONPaths.map(aPath => "<code>" + aPath + "</code>").join(", ")}<i>`;
            }
        }
        else if (isTableDeetFormatted(deet)) {
            content = deet.content;
        }
        else {
            content = [`<b>${deet.name}:</b>`, deet.message].join(" <wbr/>");
        }
        rowContent[currentRowIndex] += renderCell({ colspanToUse, content });
    }
    return `<table>
${rowContent.map(row => `<tr>${row}</tr>`).join("\n")}
</table>
${readme}
`;
}
exports._renderNPMTable = _renderNPMTable;
function renderDepDuplicationCache(cache) {
    const sentence = danger.utils.sentence;
    const newDependencies = Object.keys(cache).sort();
    if (newDependencies.length) {
        markdown(`New dependencies added: ${sentence(newDependencies.map(safeLink))}.`);
    }
    newDependencies
        .map(depName => cache[depName])
        .forEach(({ npmData, yarnBody, packageJSONPaths }) => markdown(`${_renderNPMTable({ usedInPackageJSONPaths: packageJSONPaths.sort(), npmData })}${yarnBody
        ? `\n${yarnBody}`
        : ""}`));
}
// Ensure a lockfile change if deps/devDeps changes, in case
// someone has only used `npm install` instead of `yarn.
const checkForLockfileDiff = (packagePath, packageDiff) => {
    if (packageDiff.dependencies || packageDiff.devDependencies) {
        const lockfilePath = packagePath.replace(/package\.json$/, "yarn.lock");
        const lockfileChanged = includes(danger.git.modified_files, lockfilePath);
        if (!lockfileChanged) {
            const message = `Changes were made to ${packagePath}, but not to ${lockfilePath}.`;
            const idea = "Perhaps you need to run `yarn install`?";
            warn(`${message}<br/><i>${idea}</i>`);
        }
    }
};
exports.checkForLockfileDiff = checkForLockfileDiff;
// Don't ship @types dependencies to consumers of Danger
const checkForTypesInDeps = packageDiff => {
    const sentence = danger.utils.sentence;
    if (packageDiff.dependencies && packageDiff.dependencies.added) {
        const typesDeps = packageDiff.dependencies.added.filter(d => d.startsWith("@types/")).map(printDep);
        if (typesDeps.length) {
            const message = `@types dependencies were added to package.json, as a dependency for others.`;
            const idea = `You need to move ${sentence(typesDeps)} into "devDependencies"?`;
            fail(`${message}<br/><i>${idea}</i>`);
        }
    }
};
exports.checkForTypesInDeps = checkForTypesInDeps;
/** @private Only exported for testing reasons */
function _operateOnSingleDiff(packagePath, packageDiff, duplicationCache, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options.disableCheckForRelease) {
            (0, exports.checkForRelease)(packageDiff);
        }
        if (!options.disableCheckForLockfileDiff) {
            (0, exports.checkForLockfileDiff)(packagePath, packageDiff);
        }
        if (!options.disableCheckForTypesInDeps) {
            (0, exports.checkForTypesInDeps)(packageDiff);
        }
        if (!options.disableCheckForNewDependencies) {
            yield (0, exports.checkForNewDependencies)(packagePath, packageDiff, duplicationCache, options.npmRegistryUrl, options.npmAuthToken);
        }
    });
}
exports._operateOnSingleDiff = _operateOnSingleDiff;
/**
 * Provides dependency information on dependency changes in a PR
 */
function yarn(options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const allFiles = [...(danger.git.modified_files || []), ...(danger.git.created_files || [])];
        const packageJsonFiles = allFiles.filter(file => /(^|\/)package\.json$/.test(file));
        const paths = options.pathToPackageJSON ? [options.pathToPackageJSON] : packageJsonFiles;
        const depDuplicationCache = {};
        try {
            yield Promise.all(paths.map((path) => __awaiter(this, void 0, void 0, function* () { return yield _operateOnSingleDiff(path, yield danger.git.JSONDiffForFile(path), depDuplicationCache, options); })));
        }
        catch (e) {
            renderDepDuplicationCache(depDuplicationCache);
            throw e;
        }
        renderDepDuplicationCache(depDuplicationCache);
    });
}
exports.default = yarn;
