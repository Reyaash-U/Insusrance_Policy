import Claim from "../models/Claim.model.js";
import FraudLog, { FRAUD_RULES } from "../models/FraudLog.model.js";
import logger from "../utils/logger.js";

// ─── Rule Scoring Weights ────────────────────────────────────
// Each triggered rule contributes this many points to the risk score (0–100).
const RULE_WEIGHTS = {
  [FRAUD_RULES.MULTIPLE_CLAIMS_SHORT_WINDOW]:  30,
  [FRAUD_RULES.EXPIRED_POLICY]:                40,
  [FRAUD_RULES.WAITING_PERIOD_VIOLATION]:      35,
  [FRAUD_RULES.HIGH_CLAIM_AMOUNT]:             20,
  [FRAUD_RULES.CLAIM_EXCEEDS_COVERAGE]:        40,
  [FRAUD_RULES.DUPLICATE_INCIDENT_DATE]:       25,
  [FRAUD_RULES.RAPID_SEQUENTIAL_CLAIMS]:       20,
};

const RULE_SEVERITY = {
  [FRAUD_RULES.MULTIPLE_CLAIMS_SHORT_WINDOW]:  "high",
  [FRAUD_RULES.EXPIRED_POLICY]:                "critical",
  [FRAUD_RULES.WAITING_PERIOD_VIOLATION]:      "critical",
  [FRAUD_RULES.HIGH_CLAIM_AMOUNT]:             "medium",
  [FRAUD_RULES.CLAIM_EXCEEDS_COVERAGE]:        "critical",
  [FRAUD_RULES.DUPLICATE_INCIDENT_DATE]:       "high",
  [FRAUD_RULES.RAPID_SEQUENTIAL_CLAIMS]:       "medium",
};

// Claim is flagged if risk score >= this threshold
const FLAG_THRESHOLD = 40;

// ─── Individual Rule Checks ──────────────────────────────────

/**
 * Rule 1: Multiple claims submitted within a 30-day window.
 * Trigger: more than 2 approved/submitted/under_review claims in 30 days.
 */
const checkMultipleClaimsShortWindow = async (customerId, excludeClaimId) => {
  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentCount = await Claim.countDocuments({
    customer: customerId,
    _id: { $ne: excludeClaimId },
    status: { $in: ["submitted", "under_review", "approved"] },
    createdAt: { $gte: windowStart },
  });

  if (recentCount >= 2) {
    return {
      triggered: true,
      rule: FRAUD_RULES.MULTIPLE_CLAIMS_SHORT_WINDOW,
      description: `Customer submitted ${recentCount} other claim(s) within the last 30 days.`,
    };
  }
  return { triggered: false };
};

/**
 * Rule 2: Claim filed against an already expired policy.
 */
const checkExpiredPolicy = (purchasedPolicy) => {
  const now = new Date();
  if (purchasedPolicy.endDate < now || purchasedPolicy.status === "expired") {
    return {
      triggered: true,
      rule: FRAUD_RULES.EXPIRED_POLICY,
      description: `Policy expired on ${purchasedPolicy.endDate.toISOString().split("T")[0]}.`,
    };
  }
  return { triggered: false };
};

/**
 * Rule 3: Claim filed before the waiting period has ended.
 */
const checkWaitingPeriodViolation = (purchasedPolicy) => {
  const now = new Date();
  if (now < purchasedPolicy.claimsAllowedFrom) {
    return {
      triggered: true,
      rule: FRAUD_RULES.WAITING_PERIOD_VIOLATION,
      description: `Claim filed during waiting period. Claims allowed from ${purchasedPolicy.claimsAllowedFrom.toISOString().split("T")[0]}.`,
    };
  }
  return { triggered: false };
};

/**
 * Rule 4: Claimed amount exceeds 80% of the policy's maximum claim amount.
 */
const checkHighClaimAmount = (claimAmount, maxClaimAmount) => {
  const ratio = claimAmount / maxClaimAmount;
  if (ratio >= 0.8) {
    return {
      triggered: true,
      rule: FRAUD_RULES.HIGH_CLAIM_AMOUNT,
      description: `Claim amount ($${claimAmount}) is ${(ratio * 100).toFixed(1)}% of the maximum coverage ($${maxClaimAmount}).`,
    };
  }
  return { triggered: false };
};

/**
 * Rule 5: Claim amount exceeds remaining coverage.
 */
const checkClaimExceedsCoverage = (claimAmount, remainingCoverage) => {
  if (claimAmount > remainingCoverage) {
    return {
      triggered: true,
      rule: FRAUD_RULES.CLAIM_EXCEEDS_COVERAGE,
      description: `Claim amount ($${claimAmount}) exceeds remaining coverage ($${remainingCoverage}).`,
    };
  }
  return { triggered: false };
};

/**
 * Rule 6: Another claim with the same incident date already exists for this customer.
 */
const checkDuplicateIncidentDate = async (customerId, incidentDate, excludeClaimId) => {
  const dateStart = new Date(incidentDate);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(incidentDate);
  dateEnd.setHours(23, 59, 59, 999);

  const duplicate = await Claim.countDocuments({
    customer: customerId,
    _id: { $ne: excludeClaimId },
    incidentDate: { $gte: dateStart, $lte: dateEnd },
    status: { $ne: "withdrawn" },
  });

  if (duplicate > 0) {
    return {
      triggered: true,
      rule: FRAUD_RULES.DUPLICATE_INCIDENT_DATE,
      description: `Another claim with incident date ${dateStart.toISOString().split("T")[0]} already exists.`,
    };
  }
  return { triggered: false };
};

/**
 * Rule 7: Customer has another claim currently under review on the same policy.
 */
const checkRapidSequentialClaims = async (customerId, purchasedPolicyId, excludeClaimId) => {
  const pending = await Claim.countDocuments({
    customer: customerId,
    purchasedPolicy: purchasedPolicyId,
    _id: { $ne: excludeClaimId },
    status: { $in: ["submitted", "under_review"] },
  });

  if (pending > 0) {
    return {
      triggered: true,
      rule: FRAUD_RULES.RAPID_SEQUENTIAL_CLAIMS,
      description: `Customer has ${pending} pending claim(s) on the same policy.`,
    };
  }
  return { triggered: false };
};

// ─── Main Fraud Check Orchestrator ───────────────────────────

/**
 * Runs all fraud detection rules against a new or updated claim.
 * Creates/updates a FraudLog document and updates the claim's fraudCheck field.
 *
 * @param {object} params
 * @param {Document} params.claim            - Mongoose Claim document (unsaved or saved)
 * @param {Document} params.purchasedPolicy  - Mongoose PurchasedPolicy document (populated)
 * @returns {Promise<object>} fraudResult { riskScore, isFlagged, triggeredRules, ruleDetails }
 */
export const runFraudChecks = async ({ claim, purchasedPolicy }) => {
  try {
    const customerId        = claim.customer.toString();
    const purchasedPolicyId = purchasedPolicy._id.toString();
    const claimId           = claim._id?.toString();
    const maxClaimAmount    = purchasedPolicy.policySnapshot.maxClaimAmount;
    const remainingCoverage = purchasedPolicy.remainingCoverageAmount;

    // Run all checks in parallel (independent checks only)
    const [
      multipleClaimsResult,
      duplicateDateResult,
      rapidSequentialResult,
    ] = await Promise.all([
      checkMultipleClaimsShortWindow(customerId, claimId),
      checkDuplicateIncidentDate(customerId, claim.incidentDate, claimId),
      checkRapidSequentialClaims(customerId, purchasedPolicyId, claimId),
    ]);

    // Synchronous checks
    const expiredResult         = checkExpiredPolicy(purchasedPolicy);
    const waitingPeriodResult   = checkWaitingPeriodViolation(purchasedPolicy);
    const highAmountResult      = checkHighClaimAmount(claim.claimAmount, maxClaimAmount);
    const exceedsCoverageResult = checkClaimExceedsCoverage(claim.claimAmount, remainingCoverage);

    // Collect all triggered rules
    const allResults = [
      multipleClaimsResult,
      expiredResult,
      waitingPeriodResult,
      highAmountResult,
      exceedsCoverageResult,
      duplicateDateResult,
      rapidSequentialResult,
    ];

    const triggeredRules = allResults.filter((r) => r.triggered);

    // Build ruleDetails array and calculate risk score
    let riskScore = 0;
    const ruleDetails = triggeredRules.map((r) => {
      const contribution = RULE_WEIGHTS[r.rule] || 10;
      riskScore += contribution;
      return {
        rule:              r.rule,
        description:       r.description,
        severity:          RULE_SEVERITY[r.rule] || "medium",
        scoreContribution: contribution,
      };
    });

    // Cap at 100
    riskScore = Math.min(100, riskScore);

    const isFlagged = riskScore >= FLAG_THRESHOLD;

    logger.info(
      `Fraud check complete for claim ${claimId || "NEW"}: score=${riskScore}, flagged=${isFlagged}, rules=[${triggeredRules.map((r) => r.rule).join(", ")}]`
    );

    return {
      riskScore,
      isFlagged,
      triggeredRules: triggeredRules.map((r) => r.rule),
      ruleDetails,
    };
  } catch (error) {
    logger.error(`Fraud check failed: ${error.message}`);
    // Return a safe default — don't block claim submission on a fraud check failure
    return { riskScore: 0, isFlagged: false, triggeredRules: [], ruleDetails: [] };
  }
};

/**
 * Persists the fraud check result to the FraudLog collection
 * and updates the fraudCheck embedded field on the Claim document.
 *
 * @param {Document} claim           - Saved Claim document
 * @param {Document} purchasedPolicy - PurchasedPolicy document
 * @returns {Promise<Document>}      - Updated Claim document
 */
export const applyFraudCheck = async (claim, purchasedPolicy) => {
  const fraudResult = await runFraudChecks({ claim, purchasedPolicy });

  // Update embedded fraudCheck on the claim
  claim.fraudCheck = {
    riskScore:    fraudResult.riskScore,
    flags:        fraudResult.triggeredRules,
    isFlagged:    fraudResult.isFlagged,
    checkedAt:    new Date(),
  };
  await claim.save({ validateBeforeSave: false });

  // Upsert FraudLog (one per claim)
  await FraudLog.findOneAndUpdate(
    { claim: claim._id },
    {
      claim:          claim._id,
      customer:       claim.customer,
      purchasedPolicy: purchasedPolicy._id,
      riskScore:      fraudResult.riskScore,
      triggeredRules: fraudResult.triggeredRules,
      ruleDetails:    fraudResult.ruleDetails,
      isFlagged:      fraudResult.isFlagged,
    },
    { upsert: true, new: true }
  );

  return claim;
};
