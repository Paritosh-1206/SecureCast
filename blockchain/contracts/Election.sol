// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Election
 * @notice A single-election voting contract deployed per election.
 * @dev The backend wallet submits votes on behalf of authenticated voters.
 *      Only vote hashes are stored on-chain (not raw vote data).
 *      Double-voting is prevented via voter address mapping.
 */
contract Election {
    // ──────────────────────────── State ────────────────────────────

    address public admin;
    string public electionTitle;
    uint256 public candidateCount;
    bool public isActive;
    bool public resultsPublished;

    /// @notice Tracks whether an address has already voted
    mapping(address => bool) public hasVoted;

    /// @notice Vote count per candidate (1-indexed)
    mapping(uint256 => uint256) public voteCounts;

    /// @notice Stores the vote hash for each voter (for audit)
    mapping(address => bytes32) public voteHashes;

    /// @notice Total number of votes cast
    uint256 public totalVotes;

    // ──────────────────────────── Events ───────────────────────────

    event VoteCast(
        address indexed voter,
        uint256 indexed candidateId,
        bytes32 voteHash,
        uint256 timestamp
    );
    event ElectionStarted(uint256 timestamp);
    event ElectionEnded(uint256 timestamp);
    event ResultsPublished(uint256 timestamp);

    // ─────────────────────────── Modifiers ─────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier electionIsActive() {
        require(isActive, "Election is not active");
        _;
    }

    // ─────────────────────────── Constructor ──────────────────────

    /**
     * @param _title         Human-readable election title
     * @param _candidateCount Number of candidates in this election
     */
    constructor(string memory _title, uint256 _candidateCount) {
        require(_candidateCount > 0, "Must have at least 1 candidate");
        admin = msg.sender;
        electionTitle = _title;
        candidateCount = _candidateCount;
        isActive = false;
        resultsPublished = false;
        totalVotes = 0;
    }

    // ─────────────────────────── Admin Functions ──────────────────

    /// @notice Activate the election so votes can be cast
    function startElection() external onlyAdmin {
        require(!isActive, "Election already active");
        isActive = true;
        emit ElectionStarted(block.timestamp);
    }

    /// @notice Deactivate the election to stop accepting votes
    function endElection() external onlyAdmin {
        require(isActive, "Election is not active");
        isActive = false;
        emit ElectionEnded(block.timestamp);
    }

    /// @notice Mark results as published (frontend display control)
    function publishResults() external onlyAdmin {
        require(!isActive, "End the election first");
        resultsPublished = true;
        emit ResultsPublished(block.timestamp);
    }

    // ─────────────────────────── Voting ───────────────────────────

    /**
     * @notice Cast a vote for a candidate
     * @param _candidateId  1-indexed candidate identifier
     * @param _voteHash     keccak256 hash of (voterId + electionId + candidateId + salt)
     * @dev Called by the backend wallet on behalf of the authenticated voter.
     *      The _voterAddress is passed so the contract can track per-voter status
     *      while the backend's wallet pays gas.
     */
    function castVote(
        uint256 _candidateId,
        bytes32 _voteHash,
        address _voterAddress
    ) external onlyAdmin electionIsActive {
        // Checks
        require(!hasVoted[_voterAddress], "Voter has already voted");
        require(
            _candidateId >= 1 && _candidateId <= candidateCount,
            "Invalid candidate ID"
        );
        require(_voteHash != bytes32(0), "Invalid vote hash");

        // Effects
        hasVoted[_voterAddress] = true;
        voteCounts[_candidateId] += 1;
        voteHashes[_voterAddress] = _voteHash;
        totalVotes += 1;

        // Event
        emit VoteCast(_voterAddress, _candidateId, _voteHash, block.timestamp);
    }

    // ─────────────────────────── View Functions ───────────────────

    /**
     * @notice Get vote counts for all candidates
     * @return counts Array of vote counts (index 0 = candidate 1)
     */
    function getResults()
        external
        view
        returns (uint256[] memory counts)
    {
        counts = new uint256[](candidateCount);
        for (uint256 i = 0; i < candidateCount; i++) {
            counts[i] = voteCounts[i + 1];
        }
        return counts;
    }

    /**
     * @notice Check if a specific voter has voted
     * @param _voter Address of the voter to check
     */
    function hasVoterVoted(address _voter) external view returns (bool) {
        return hasVoted[_voter];
    }

    /**
     * @notice Get the full election info
     */
    function getElectionInfo()
        external
        view
        returns (
            string memory title,
            uint256 candidates,
            bool active,
            bool published,
            uint256 votes
        )
    {
        return (
            electionTitle,
            candidateCount,
            isActive,
            resultsPublished,
            totalVotes
        );
    }
}
