import { JSONDiff } from "../node_modules/danger/distribution/dsl/GitDSL";
export declare function message(message: string): void;
export declare function warn(message: string): void;
export declare function fail(message: string): void;
export declare function markdown(message: string): void;
export declare const checkForRelease: (packageDiff: any) => void;
export interface DepDuplicationCache {
    [depName: string]: {
        packageJSONPaths: string[];
        npmData: PartiallyRenderedNPMMetadata;
        yarnBody?: string;
    };
}
export declare const checkForNewDependencies: (packagePath: string, packageDiff: JSONDiff, duplicationCache: DepDuplicationCache, npmRegistryUrl?: string | undefined, npmAuthToken?: string | undefined) => Promise<void>;
export declare const findNewDependencies: (packageDiff: JSONDiff) => string[];
export declare const getYarnMetadataForDep: (dep: any) => Promise<string>;
/** Represents a label / value, aka 2 cells */
export interface TableDeetNew {
    /** Label */
    name: string;
    /** Value */
    message: string;
    /** Applies to the message cell, not the label-cell */
    colspan?: number;
}
/** Represents arbitrary cell contents */
export interface TableDeetFormatted {
    content: string;
    colspan?: number;
}
/** Represents arbitrary cell that will be dynamically replaced on final render */
export interface TableDeetPlaceholder {
    placeholderKey: "used-in-packages";
    colspan?: number;
}
export interface TableRowBreak {
    break: "row-break";
}
export declare type TableDeet = TableRowBreak | TableDeetNew | TableDeetFormatted | TableDeetPlaceholder;
export interface PartiallyRenderedNPMMetadata {
    details: TableDeet[];
    readme: string;
}
export declare const getNPMMetadataForDep: (dep: string, npmRegistryUrl?: string | undefined, npmAuthToken?: string | undefined) => Promise<PartiallyRenderedNPMMetadata | undefined>;
/**
 * Little renderer for the npm table details and relies on the data to be provided
 * @private Only exported for testing reasons.
 */
export declare function _renderNPMTable({ usedInPackageJSONPaths, npmData: { details, readme }, }: {
    usedInPackageJSONPaths: string[];
    npmData: PartiallyRenderedNPMMetadata;
}): string;
export declare const checkForLockfileDiff: (packagePath: any, packageDiff: any) => void;
export declare const checkForTypesInDeps: (packageDiff: any) => void;
export interface Options {
    pathToPackageJSON?: string;
    npmAuthToken?: string;
    npmRegistryUrl?: string;
    disableCheckForRelease?: boolean;
    disableCheckForNewDependencies?: boolean;
    disableCheckForLockfileDiff?: boolean;
    disableCheckForTypesInDeps?: boolean;
}
/** @private Only exported for testing reasons */
export declare function _operateOnSingleDiff(packagePath: string, packageDiff: JSONDiff, duplicationCache: DepDuplicationCache, options: Options): Promise<void>;
/**
 * Provides dependency information on dependency changes in a PR
 */
export default function yarn(options?: Options): Promise<void>;
