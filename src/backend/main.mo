import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import OutCall "http-outcalls/outcall";


actor {
  type PubMedArticle = {
    id : Text;
    title : Text;
  };

  type ResearchSession = {
    broadArea : Text;
    whatIsKnown : Text;
    whatIsContested : Text;
    whatIsMissing : Text;
    proposedGap : Text;
    timestamp : Int;
    id : Nat;
  };

  module ResearchSession {
    public func compare(r1 : ResearchSession, r2 : ResearchSession) : Order.Order {
      Nat.compare(r1.id, r2.id);
    };
  };

  let sessions = Map.empty<Nat, ResearchSession>();
  var nextId = 0;

  func getSessionInternal(id : Nat) : ResearchSession {
    switch (sessions.get(id)) {
      case (null) { Runtime.trap("Research question not found") };
      case (?session) { session };
    };
  };

  public shared ({ caller }) func saveSession(broadArea : Text, whatIsKnown : Text, whatIsContested : Text, whatIsMissing : Text, proposedGap : Text) : async Nat {
    let session : ResearchSession = {
      id = nextId;
      broadArea;
      whatIsKnown;
      whatIsContested;
      whatIsMissing;
      proposedGap;
      timestamp = Time.now();
    };
    sessions.add(nextId, session);
    nextId += 1;
    session.id;
  };

  public shared ({ caller }) func deleteSession(id : Nat) : async () {
    ignore getSessionInternal(id);
    sessions.remove(id);
  };

  public query ({ caller }) func getAllSessions() : async [ResearchSession] {
    sessions.values().toArray().sort();
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
