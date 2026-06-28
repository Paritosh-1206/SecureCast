const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Election Contract", function () {
  let election;
  let admin, voter1, voter2, voter3;
  const TITLE = "Student Council 2026";
  const CANDIDATE_COUNT = 3;

  beforeEach(async function () {
    [admin, voter1, voter2, voter3] = await ethers.getSigners();
    const Election = await ethers.getContractFactory("Election");
    election = await Election.deploy(TITLE, CANDIDATE_COUNT);
    await election.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the correct admin", async function () {
      expect(await election.admin()).to.equal(admin.address);
    });

    it("should set the election title", async function () {
      expect(await election.electionTitle()).to.equal(TITLE);
    });

    it("should set the candidate count", async function () {
      expect(await election.candidateCount()).to.equal(CANDIDATE_COUNT);
    });

    it("should start as inactive", async function () {
      expect(await election.isActive()).to.equal(false);
    });

    it("should revert with 0 candidates", async function () {
      const Election = await ethers.getContractFactory("Election");
      await expect(Election.deploy("Bad", 0)).to.be.revertedWith(
        "Must have at least 1 candidate"
      );
    });
  });

  describe("Election Lifecycle", function () {
    it("should allow admin to start election", async function () {
      await expect(election.startElection())
        .to.emit(election, "ElectionStarted");
      expect(await election.isActive()).to.equal(true);
    });

    it("should prevent non-admin from starting election", async function () {
      await expect(
        election.connect(voter1).startElection()
      ).to.be.revertedWith("Only admin can call this");
    });

    it("should allow admin to end election", async function () {
      await election.startElection();
      await expect(election.endElection())
        .to.emit(election, "ElectionEnded");
      expect(await election.isActive()).to.equal(false);
    });

    it("should allow admin to publish results after ending", async function () {
      await election.startElection();
      await election.endElection();
      await expect(election.publishResults())
        .to.emit(election, "ResultsPublished");
      expect(await election.resultsPublished()).to.equal(true);
    });

    it("should prevent publishing results while active", async function () {
      await election.startElection();
      await expect(election.publishResults()).to.be.revertedWith(
        "End the election first"
      );
    });
  });

  describe("Voting", function () {
    const voteHash = ethers.keccak256(ethers.toUtf8Bytes("voter1-election1-candidate1-salt"));

    beforeEach(async function () {
      await election.startElection();
    });

    it("should allow admin to cast vote on behalf of voter", async function () {
      await expect(
        election.castVote(1, voteHash, voter1.address)
      )
        .to.emit(election, "VoteCast")
        .withArgs(voter1.address, 1, voteHash, (v) => v > 0);

      expect(await election.hasVoted(voter1.address)).to.equal(true);
      expect(await election.voteCounts(1)).to.equal(1);
      expect(await election.totalVotes()).to.equal(1);
    });

    it("should prevent double voting", async function () {
      await election.castVote(1, voteHash, voter1.address);
      const voteHash2 = ethers.keccak256(ethers.toUtf8Bytes("different"));
      await expect(
        election.castVote(2, voteHash2, voter1.address)
      ).to.be.revertedWith("Voter has already voted");
    });

    it("should reject invalid candidate ID (0)", async function () {
      await expect(
        election.castVote(0, voteHash, voter1.address)
      ).to.be.revertedWith("Invalid candidate ID");
    });

    it("should reject invalid candidate ID (too high)", async function () {
      await expect(
        election.castVote(CANDIDATE_COUNT + 1, voteHash, voter1.address)
      ).to.be.revertedWith("Invalid candidate ID");
    });

    it("should reject empty vote hash", async function () {
      await expect(
        election.castVote(1, ethers.ZeroHash, voter1.address)
      ).to.be.revertedWith("Invalid vote hash");
    });

    it("should prevent voting when election inactive", async function () {
      await election.endElection();
      await expect(
        election.castVote(1, voteHash, voter1.address)
      ).to.be.revertedWith("Election is not active");
    });

    it("should prevent non-admin from casting votes", async function () {
      await expect(
        election.connect(voter1).castVote(1, voteHash, voter1.address)
      ).to.be.revertedWith("Only admin can call this");
    });
  });

  describe("Results", function () {
    beforeEach(async function () {
      await election.startElection();
      // Cast 3 votes: 2 for candidate 1, 1 for candidate 2
      const h1 = ethers.keccak256(ethers.toUtf8Bytes("v1"));
      const h2 = ethers.keccak256(ethers.toUtf8Bytes("v2"));
      const h3 = ethers.keccak256(ethers.toUtf8Bytes("v3"));
      await election.castVote(1, h1, voter1.address);
      await election.castVote(1, h2, voter2.address);
      await election.castVote(2, h3, voter3.address);
    });

    it("should return correct vote counts", async function () {
      const results = await election.getResults();
      expect(results[0]).to.equal(2); // Candidate 1
      expect(results[1]).to.equal(1); // Candidate 2
      expect(results[2]).to.equal(0); // Candidate 3
    });

    it("should return correct total votes", async function () {
      expect(await election.totalVotes()).to.equal(3);
    });

    it("should return correct election info", async function () {
      const info = await election.getElectionInfo();
      expect(info.title).to.equal(TITLE);
      expect(info.candidates).to.equal(CANDIDATE_COUNT);
      expect(info.active).to.equal(true);
      expect(info.published).to.equal(false);
      expect(info.votes).to.equal(3);
    });
  });
});
