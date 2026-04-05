import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SearchSession {
    id: bigint;
    selectedStudies: Array<Study>;
    createdAt: bigint;
    researchQuestions: Array<ResearchQuestion>;
    synthesisTable?: SynthesisTable;
    broadArea: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface SynthesisTable {
    generatedAt: bigint;
    studies: Array<Study>;
    sessionId: bigint;
}
export interface Study {
    id: bigint;
    doi: string;
    title: string;
    source: string;
    journal: string;
    year: bigint;
    gapFramework?: GapFramework;
    volume: string;
    researchGaps: string;
    authors: Array<string>;
    abstract: string;
    pages: string;
    keyFindings: string;
}
export interface ResearchQuestion {
    text: string;
    framework: string;
    rationale: string;
}
export interface GapFramework {
    frameworkType: string;
    details: string;
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
    addResearchQuestion(sessionId: bigint, question: ResearchQuestion): Promise<void>;
    addStudy(sessionId: bigint, study: Study): Promise<bigint>;
    createSession(broadArea: string): Promise<bigint>;
    deleteSession(id: bigint): Promise<void>;
    fetchPubMedArticles(ids: string): Promise<string>;
    getAllSessions(): Promise<Array<SearchSession>>;
    getResearchQuestions(sessionId: bigint): Promise<Array<ResearchQuestion>>;
    getSession(id: bigint): Promise<SearchSession | null>;
    getStudies(sessionId: bigint): Promise<Array<Study>>;
    getStudiesByFramework(sessionId: bigint, framework: string): Promise<Array<Study>>;
    getStudy(sessionId: bigint, studyId: bigint): Promise<Study | null>;
    getSynthesisTable(sessionId: bigint): Promise<SynthesisTable | null>;
    saveSynthesisTable(sessionId: bigint, studies: Array<Study>): Promise<void>;
    searchPubMed(searchQuery: string): Promise<string>;
    searchStudies(sessionId: bigint, searchTerm: string): Promise<Array<Study>>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
