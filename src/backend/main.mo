import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";

import OutCall "http-outcalls/outcall";

// specify the data migration function in with-clause

actor {
  // Types
  type GapFramework = {
    frameworkType : Text;
    details : Text;
  };

  type Study = {
    id : Nat;
    title : Text;
    authors : [Text];
    journal : Text;
    year : Nat;
    volume : Text;
    pages : Text;
    doi : Text;
    abstract : Text;
    source : Text;
    keyFindings : Text;
    researchGaps : Text;
    gapFramework : ?GapFramework;
  };

  module Study {
    public func compare(s1 : Study, s2 : Study) : Order.Order {
      Nat.compare(s1.id, s2.id);
    };
  };

  type SynthesisTable = {
    sessionId : Nat;
    studies : [Study];
    generatedAt : Int;
  };

  type ResearchQuestion = {
    text : Text;
    framework : Text;
    rationale : Text;
  };

  type SearchSession = {
    id : Nat;
    broadArea : Text;
    createdAt : Int;
    selectedStudies : [Study];
    synthesisTable : ?SynthesisTable;
    researchQuestions : [ResearchQuestion];
  };

  module SearchSession {
    public func compare(s1 : SearchSession, s2 : SearchSession) : Order.Order {
      Nat.compare(s1.id, s2.id);
    };
  };

  // State
  let sessions = Map.empty<Nat, SearchSession>();
  var nextSessionId = 0;
  var nextStudyId = 0;

  // Helper Functions
  func getSessionInternal(id : Nat) : SearchSession {
    switch (sessions.get(id)) {
      case (null) { Runtime.trap("Search session not found") };
      case (?session) { session };
    };
  };

  // Create new search session
  public shared ({ caller }) func createSession(broadArea : Text) : async Nat {
    let session : SearchSession = {
      id = nextSessionId;
      broadArea;
      createdAt = Time.now();
      selectedStudies = [];
      synthesisTable = null;
      researchQuestions = [];
    };
    sessions.add(nextSessionId, session);
    let id = nextSessionId;
    nextSessionId += 1;
    id;
  };

  // Add study to session
  public shared ({ caller }) func addStudy(sessionId : Nat, study : Study) : async Nat {
    let session = getSessionInternal(sessionId);
    let newStudy = {
      study with
      id = nextStudyId;
    };
    let newStudies = session.selectedStudies.concat([newStudy]);
    let updatedSession = { session with selectedStudies = newStudies };
    sessions.add(sessionId, updatedSession);
    let id = nextStudyId;
    nextStudyId += 1;
    id;
  };

  // Save synthesis table for session
  public shared ({ caller }) func saveSynthesisTable(sessionId : Nat, studies : [Study]) : async () {
    let session = getSessionInternal(sessionId);
    let table : SynthesisTable = {
      sessionId;
      studies;
      generatedAt = Time.now();
    };
    let updatedSession = { session with synthesisTable = ?table };
    sessions.add(sessionId, updatedSession);
  };

  // Add research question to session
  public shared ({ caller }) func addResearchQuestion(sessionId : Nat, question : ResearchQuestion) : async () {
    let session = getSessionInternal(sessionId);
    let newQuestions = session.researchQuestions.concat([question]);
    let updatedSession = { session with researchQuestions = newQuestions };
    sessions.add(sessionId, updatedSession);
  };

  // Get all sessions
  public query ({ caller }) func getAllSessions() : async [SearchSession] {
    sessions.values().toArray().sort();
  };

  // Get session by ID
  public query ({ caller }) func getSession(id : Nat) : async ?SearchSession {
    sessions.get(id);
  };

  public shared ({ caller }) func deleteSession(id : Nat) : async () {
    ignore getSessionInternal(id);
    sessions.remove(id);
  };

  // Get studies for a session
  public query ({ caller }) func getStudies(sessionId : Nat) : async [Study] {
    switch (sessions.get(sessionId)) {
      case (null) { [] };
      case (?session) { session.selectedStudies.sort() };
    };
  };

  // Get synthesis table for session
  public query ({ caller }) func getSynthesisTable(sessionId : Nat) : async ?SynthesisTable {
    switch (sessions.get(sessionId)) {
      case (null) { null };
      case (?session) { session.synthesisTable };
    };
  };

  // Get research questions for session
  public query ({ caller }) func getResearchQuestions(sessionId : Nat) : async [ResearchQuestion] {
    switch (sessions.get(sessionId)) {
      case (null) { [] };
      case (?session) { session.researchQuestions };
    };
  };

  // Get study by ID
  public query ({ caller }) func getStudy(sessionId : Nat, studyId : Nat) : async ?Study {
    switch (sessions.get(sessionId)) {
      case (null) { null };
      case (?session) {
        session.selectedStudies.find(func(s) { s.id == studyId });
      };
    };
  };

  // Search studies by title (simple contains match)
  public query ({ caller }) func searchStudies(sessionId : Nat, searchTerm : Text) : async [Study] {
    switch (sessions.get(sessionId)) {
      case (null) { [] };
      case (?session) {
        let searchTermLower = searchTerm.toLower();
        session.selectedStudies.filter(
          func(s) { s.title.toLower().contains(#text searchTermLower) }
        );
      };
    };
  };

  // Search studies by framework type
  public query ({ caller }) func getStudiesByFramework(sessionId : Nat, framework : Text) : async [Study] {
    switch (sessions.get(sessionId)) {
      case (null) { [] };
      case (?session) {
        let searchTerm = framework.toLower();
        session.selectedStudies.filter(
          func(s) {
            switch (s.gapFramework) {
              case (null) { false };
              case (?g) { g.frameworkType.toLower() == searchTerm };
            };
          }
        );
      };
    };
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func searchPubMed(searchQuery : Text) : async Text {
    let apiUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=" # searchQuery # "&retmode=json";
    await OutCall.httpGetRequest(apiUrl, [], transform);
  };

  public shared ({ caller }) func fetchPubMedArticles(ids : Text) : async Text {
    let apiUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=" # ids # "&retmode=json";
    await OutCall.httpGetRequest(apiUrl, [], transform);
  };
};
