import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ResearchSession {
    id: bigint;
    whatIsKnown: string;
    whatIsContested: string;
    timestamp: bigint;
    broadArea: string;
    proposedGap: string;
    whatIsMissing: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface backendInterface {
    deleteSession(id: bigint): Promise<void>;
    fetchPubMedArticles(ids: string): Promise<string>;
    getAllSessions(): Promise<Array<ResearchSession>>;
    saveSession(broadArea: string, whatIsKnown: string, whatIsContested: string, whatIsMissing: string, proposedGap: string): Promise<bigint>;
    searchPubMed(searchQuery: string): Promise<string>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
