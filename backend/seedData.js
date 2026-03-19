import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;

  await db.collection("users").deleteMany({});
  await db.collection("policies").deleteMany({});
  await db.collection("purchasedpolicies").deleteMany({});
  await db.collection("claims").deleteMany({});
  await db.collection("fraudlogs").deleteMany({});
  await db.collection("notifications").deleteMany({});
  console.log("Cleared existing data");

  const now = new Date();
  const pass = await bcrypt.hash("Demo@1234", 12);
  const adminPass = await bcrypt.hash("Admin@123", 12);

  const daysAgo = (n) => new Date(now - n * 86400000);

  // ── USERS ─────────────────────────────────────────────────────
  const usersRes = await db.collection("users").insertMany([
    // Admin
    { firstName:"Admin",    lastName:"User",      email:"admin@insurex.com",    password:adminPass, role:"admin",    isEmailVerified:true, isActive:true, loginAttempts:0, createdAt:daysAgo(90), updatedAt:now },
    // Agents
    { firstName:"Rahul",    lastName:"Sharma",    email:"agent@demo.com",        password:pass,      role:"agent",    isEmailVerified:true, isActive:true, phone:"+91-9876543210", loginAttempts:0, createdAt:daysAgo(80), updatedAt:now },
    { firstName:"Priya",    lastName:"Mehta",     email:"agent2@demo.com",       password:pass,      role:"agent",    isEmailVerified:true, isActive:true, phone:"+91-9876543211", loginAttempts:0, createdAt:daysAgo(75), updatedAt:now },
    // Adjusters
    { firstName:"Vikram",   lastName:"Singh",     email:"adjuster@demo.com",     password:pass,      role:"adjuster", isEmailVerified:true, isActive:true, phone:"+91-9876543212", loginAttempts:0, createdAt:daysAgo(70), updatedAt:now },
    { firstName:"Anita",    lastName:"Desai",     email:"adjuster2@demo.com",    password:pass,      role:"adjuster", isEmailVerified:true, isActive:true, phone:"+91-9876543213", loginAttempts:0, createdAt:daysAgo(65), updatedAt:now },
    // Customers
    { firstName:"Arjun",    lastName:"Kumar",     email:"customer@demo.com",     password:pass,      role:"customer", isEmailVerified:true, isActive:true, phone:"+91-9876543214", loginAttempts:0, createdAt:daysAgo(60), updatedAt:now },
    { firstName:"Sneha",    lastName:"Patel",     email:"customer2@demo.com",    password:pass,      role:"customer", isEmailVerified:true, isActive:true, phone:"+91-9876543215", loginAttempts:0, createdAt:daysAgo(55), updatedAt:now },
    { firstName:"Rohan",    lastName:"Gupta",     email:"customer3@demo.com",    password:pass,      role:"customer", isEmailVerified:true, isActive:true, phone:"+91-9876543216", loginAttempts:0, createdAt:daysAgo(50), updatedAt:now },
    { firstName:"Kavya",    lastName:"Nair",      email:"customer4@demo.com",    password:pass,      role:"customer", isEmailVerified:true, isActive:true, phone:"+91-9876543217", loginAttempts:0, createdAt:daysAgo(45), updatedAt:now },
    { firstName:"Amit",     lastName:"Verma",     email:"customer5@demo.com",    password:pass,      role:"customer", isEmailVerified:true, isActive:true, phone:"+91-9876543218", loginAttempts:0, createdAt:daysAgo(40), updatedAt:now },
    { firstName:"Deepika",  lastName:"Rao",       email:"customer6@demo.com",    password:pass,      role:"customer", isEmailVerified:true, isActive:true, phone:"+91-9876543219", loginAttempts:0, createdAt:daysAgo(35), updatedAt:now },
    { firstName:"Karan",    lastName:"Malhotra",  email:"customer7@demo.com",    password:pass,      role:"customer", isEmailVerified:true, isActive:false, phone:"+91-9876543220", loginAttempts:0, createdAt:daysAgo(30), updatedAt:now },
  ]);

  const adminId     = usersRes.insertedIds[0];
  const adjId       = usersRes.insertedIds[3];
  const adj2Id      = usersRes.insertedIds[4];
  const c1 = usersRes.insertedIds[5];
  const c2 = usersRes.insertedIds[6];
  const c3 = usersRes.insertedIds[7];
  const c4 = usersRes.insertedIds[8];
  const c5 = usersRes.insertedIds[9];
  const c6 = usersRes.insertedIds[10];
  const c7 = usersRes.insertedIds[11];
  console.log("Created 12 users");

  // ── POLICIES ──────────────────────────────────────────────────
  const policiesRes = await db.collection("policies").insertMany([
    {
      name: "HealthShield Pro", slug: "healthshield-pro", category: "health",
      description: "Comprehensive health insurance covering hospitalization, surgery, critical illness, and day-care procedures with cashless facility at 5000+ network hospitals across India.",
      basePremium: 8500, ageFactor: 1.0, riskFactor: 1.0, assetValueRate: 0,
      coverages: [
        { name: "Hospitalization", limit: 500000, description: "Inpatient hospital stays" },
        { name: "Surgery", limit: 300000, description: "Surgical procedures" },
        { name: "Critical Illness", limit: 1000000, description: "Cancer, heart attack, stroke" },
        { name: "Day Care", limit: 50000, description: "Day-care treatments" },
      ],
      availableAddOns: [
        { name: "Dental Coverage", extraPremiumRate: 0.15, description: "Dental treatment & surgery" },
        { name: "Vision Coverage", extraPremiumRate: 0.10, description: "Eye care and spectacles" },
        { name: "Mental Health", extraPremiumRate: 0.12, description: "Psychiatry & counselling" },
        { name: "Maternity Cover", extraPremiumRate: 0.20, description: "Pregnancy & delivery" },
      ],
      durationMonths:12, maxClaimAmount:1500000, deductible:5000, waitingPeriodDays:30, minAge:18, maxAge:65,
      isActive: true, isFeatured: true, tags: ["health","hospitalization","critical illness"],
      createdBy: adminId, createdAt: daysAgo(85), updatedAt: daysAgo(10),
    },
    {
      name: "AutoGuard Plus", slug: "autoguard-plus", category: "auto",
      description: "Full coverage vehicle insurance with zero depreciation, roadside assistance, and engine protection. Covers all four-wheelers and two-wheelers.",
      basePremium: 6200, ageFactor: 1.1, riskFactor: 1.2, assetValueRate: 0.002,
      coverages: [
        { name: "Own Damage", limit: 800000, description: "Damage to your vehicle" },
        { name: "Third Party Liability", limit: 1500000, description: "Legal liability to third party" },
        { name: "Personal Accident", limit: 1500000, description: "Owner-driver PA cover" },
      ],
      availableAddOns: [
        { name: "Zero Depreciation", extraPremiumRate: 0.18, description: "Full claim without depreciation" },
        { name: "Roadside Assistance", extraPremiumRate: 0.08, description: "24/7 emergency help" },
        { name: "Engine Protect", extraPremiumRate: 0.12, description: "Engine & gearbox damage" },
        { name: "NCB Protect", extraPremiumRate: 0.10, description: "Protect no-claim bonus" },
      ],
      durationMonths:12, maxClaimAmount:1000000, deductible:2000, waitingPeriodDays:0, minAge:18, maxAge:75,
      isActive: true, isFeatured: true, tags: ["auto","car","vehicle","collision"],
      createdBy: adminId, createdAt: daysAgo(82), updatedAt: daysAgo(8),
    },
    {
      name: "HomeSecure 360", slug: "homesecure-360", category: "home",
      description: "Complete home insurance protecting your property against fire, natural disasters, theft, and burglary. Covers structure and household contents.",
      basePremium: 4800, ageFactor: 1.0, riskFactor: 1.0, assetValueRate: 0.001,
      coverages: [
        { name: "Building Structure", limit: 5000000, description: "Walls, roof, floors" },
        { name: "Home Contents", limit: 500000, description: "Furniture, appliances, valuables" },
        { name: "Personal Liability", limit: 1000000, description: "Liability to third parties" },
      ],
      availableAddOns: [
        { name: "Flood Cover", extraPremiumRate: 0.20, description: "Flood & inundation damage" },
        { name: "Earthquake Cover", extraPremiumRate: 0.25, description: "Earthquake & tremor damage" },
        { name: "Tenant Liability", extraPremiumRate: 0.10, description: "Coverage for tenants" },
      ],
      durationMonths:12, maxClaimAmount:5000000, deductible:10000, waitingPeriodDays:14, minAge:18, maxAge:80,
      isActive: true, isFeatured: false, tags: ["home","property","fire","theft"],
      createdBy: adminId, createdAt: daysAgo(78), updatedAt: daysAgo(5),
    },
    {
      name: "LifeGuard Term", slug: "lifeguard-term", category: "life",
      description: "Pure term life insurance with high sum assured at affordable premiums. Tax benefits under 80C. Covers accidental death and terminal illness.",
      basePremium: 3200, ageFactor: 1.3, riskFactor: 1.0, assetValueRate: 0,
      coverages: [
        { name: "Death Benefit", limit: 10000000, description: "Lump sum on death" },
        { name: "Terminal Illness", limit: 2500000, description: "Advance payout on terminal illness" },
      ],
      availableAddOns: [
        { name: "Accidental Death Benefit", extraPremiumRate: 0.12, description: "Additional payout on accident" },
        { name: "Disability Waiver", extraPremiumRate: 0.08, description: "Premium waiver on disability" },
        { name: "Critical Illness Rider", extraPremiumRate: 0.15, description: "Lump sum on 36 illnesses" },
      ],
      durationMonths:240, maxClaimAmount:10000000, deductible:0, waitingPeriodDays:90, minAge:18, maxAge:60,
      isActive: true, isFeatured: true, tags: ["life","term","death","family"],
      createdBy: adminId, createdAt: daysAgo(75), updatedAt: daysAgo(3),
    },
    {
      name: "TravelSafe Global", slug: "travelsafe-global", category: "travel",
      description: "Comprehensive international travel insurance for individuals and families. Covers medical emergencies, trip cancellation, flight delays, and baggage loss.",
      basePremium: 1800, ageFactor: 1.0, riskFactor: 1.0, assetValueRate: 0,
      coverages: [
        { name: "Medical Emergency", limit: 750000, description: "Emergency treatment abroad" },
        { name: "Trip Cancellation", limit: 150000, description: "Pre-paid non-refundable costs" },
        { name: "Baggage Loss", limit: 50000, description: "Lost or delayed baggage" },
        { name: "Flight Delay", limit: 15000, description: "Delay over 6 hours" },
      ],
      availableAddOns: [
        { name: "Adventure Sports", extraPremiumRate: 0.30, description: "Skiing, trekking, scuba" },
        { name: "Cancel for Any Reason", extraPremiumRate: 0.40, description: "Full flexibility" },
        { name: "Business Equipment", extraPremiumRate: 0.20, description: "Laptop, camera protection" },
      ],
      durationMonths:1, maxClaimAmount:750000, deductible:1000, waitingPeriodDays:0, minAge:0, maxAge:75,
      isActive: true, isFeatured: false, tags: ["travel","international","medical","baggage"],
      createdBy: adminId, createdAt: daysAgo(70), updatedAt: daysAgo(2),
    },
    {
      name: "Business Shield Pro", slug: "business-shield-pro", category: "business",
      description: "Complete business insurance for SMEs covering property, liability, employee injury, and business interruption. Protect your enterprise from unforeseen losses.",
      basePremium: 18000, ageFactor: 1.0, riskFactor: 1.2, assetValueRate: 0.003,
      coverages: [
        { name: "Commercial Property", limit: 10000000, description: "Office, warehouse, equipment" },
        { name: "Public Liability", limit: 5000000, description: "Third-party injury/property" },
        { name: "Business Interruption", limit: 3000000, description: "Lost revenue during shutdown" },
        { name: "Employee Injury", limit: 2000000, description: "Workers compensation" },
      ],
      availableAddOns: [
        { name: "Cyber Liability", extraPremiumRate: 0.15, description: "Data breach & cyber attacks" },
        { name: "Professional Indemnity", extraPremiumRate: 0.18, description: "Errors & omissions" },
        { name: "Directors & Officers", extraPremiumRate: 0.20, description: "Management liability" },
      ],
      durationMonths:12, maxClaimAmount:10000000, deductible:25000, waitingPeriodDays:7, minAge:18, maxAge:80,
      isActive: true, isFeatured: true, tags: ["business","commercial","SME","liability"],
      createdBy: adminId, createdAt: daysAgo(65), updatedAt: daysAgo(1),
    },
    {
      name: "HealthShield Basic", slug: "healthshield-basic", category: "health",
      description: "Affordable basic health plan for individuals and families. Covers hospitalization, pre & post hospitalization expenses with no sub-limits on room rent.",
      basePremium: 4200, ageFactor: 1.0, riskFactor: 1.0, assetValueRate: 0,
      coverages: [
        { name: "Hospitalization", limit: 200000, description: "Inpatient hospital stay" },
        { name: "Pre-Hospitalization", limit: 30000, description: "30 days pre-hospital expenses" },
        { name: "Post-Hospitalization", limit: 50000, description: "60 days post-hospital expenses" },
      ],
      availableAddOns: [
        { name: "OPD Cover", extraPremiumRate: 0.20, description: "Out-patient consultations" },
        { name: "Top-Up Cover", extraPremiumRate: 0.25, description: "Additional sum insured" },
      ],
      durationMonths:12, maxClaimAmount:300000, deductible:3000, waitingPeriodDays:30, minAge:5, maxAge:70,
      isActive: true, isFeatured: false, tags: ["health","basic","affordable","family"],
      createdBy: adminId, createdAt: daysAgo(60), updatedAt: daysAgo(7),
    },
  ]);

  const pHealthPro = policiesRes.insertedIds[0];
  const pAuto      = policiesRes.insertedIds[1];
  const pHome      = policiesRes.insertedIds[2];
  const pLife      = policiesRes.insertedIds[3];
  const pTravel    = policiesRes.insertedIds[4];
  const pBusiness  = policiesRes.insertedIds[5];
  const pHealthBasic = policiesRes.insertedIds[6];
  console.log("Created 7 policies");

  // ── PURCHASED POLICIES ────────────────────────────────────────
  const mkPurchased = (customer, policy, policyName, cat, premium, paid, age, risk, asset, addOnNames, start, max, remaining, totalClaimed, claimsCount, status = "active") => ({
    customer, policy,
    policySnapshot: {
      name: policyName, category: cat,
      maxClaimAmount: max, deductible: 5000, waitingPeriodDays: 30, durationMonths: 12,
    },
    customerAge: age, riskLevel: risk, assetValue: asset,
    selectedAddOns: addOnNames.map((n) => ({ name: n, extraPremiumRate: 0.1, premiumContribution: parseFloat((premium * 0.1).toFixed(2)) })),
    premiumDetails: {
      basePremium: premium, ageFactor: 1.0, riskFactor: risk === "high" ? 1.4 : risk === "medium" ? 1.0 : 0.9,
      assetValueRate: 0, addOnsTotal: parseFloat((premium * 0.1 * addOnNames.length).toFixed(2)),
      calculatedMonthlyPremium: parseFloat((premium * 1.1).toFixed(2)),
      totalPremiumPaid: paid,
    },
    startDate: start,
    endDate: new Date(start.getTime() + 365 * 86400000),
    claimsAllowedFrom: new Date(start.getTime() + 30 * 86400000),
    status,
    remainingCoverageAmount: remaining,
    totalClaimedAmount: totalClaimed,
    totalClaimsCount: claimsCount,
    paymentReference: null,
    createdAt: start, updatedAt: now,
  });

  const ppRes = await db.collection("purchasedpolicies").insertMany([
    mkPurchased(c1, pHealthPro,  "HealthShield Pro",   "health",  8500,  102000, 28, "low",    0,       ["Dental Coverage","Mental Health"],  daysAgo(55), 1500000, 1450000, 50000,  1),
    mkPurchased(c1, pAuto,       "AutoGuard Plus",     "auto",    6200,  74400,  28, "low",    450000,  ["Zero Depreciation"],               daysAgo(40), 1000000, 1000000, 0,      0),
    mkPurchased(c2, pHealthPro,  "HealthShield Pro",   "health",  8500,  102000, 34, "medium", 0,       ["Maternity Cover"],                  daysAgo(50), 1500000, 1320000, 180000, 2),
    mkPurchased(c2, pHome,       "HomeSecure 360",     "home",    4800,  57600,  34, "low",    2500000, ["Flood Cover"],                      daysAgo(48), 5000000, 5000000, 0,      0),
    mkPurchased(c3, pAuto,       "AutoGuard Plus",     "auto",    6200,  74400,  42, "high",   800000,  ["Zero Depreciation","Engine Protect"],daysAgo(35), 1000000, 820000,  180000, 3),
    mkPurchased(c3, pLife,       "LifeGuard Term",     "life",    3200,  38400,  42, "medium", 0,       ["Critical Illness Rider"],           daysAgo(60), 10000000,10000000, 0,      0),
    mkPurchased(c4, pHealthBasic,"HealthShield Basic", "health",  4200,  50400,  55, "medium", 0,       ["OPD Cover"],                        daysAgo(30), 300000,  245000,  55000,  1),
    mkPurchased(c4, pTravel,     "TravelSafe Global",  "travel",  1800,  21600,  55, "low",    0,       ["Adventure Sports"],                 daysAgo(25), 750000,  750000,  0,      0),
    mkPurchased(c5, pBusiness,   "Business Shield Pro","business",18000, 216000, 38, "high",   5000000, ["Cyber Liability","Professional Indemnity"], daysAgo(45), 10000000, 9200000, 800000, 2),
    mkPurchased(c6, pHealthPro,  "HealthShield Pro",   "health",  8500,  102000, 22, "low",    0,       [],                                   daysAgo(20), 1500000, 1500000, 0,      0),
    mkPurchased(c6, pAuto,       "AutoGuard Plus",     "auto",    6200,  74400,  22, "medium", 350000,  ["Roadside Assistance"],              daysAgo(18), 1000000, 950000,  50000,  1),
    mkPurchased(c7, pHealthBasic,"HealthShield Basic", "health",  4200,  50400,  48, "high",   0,       [],                                   daysAgo(60), 300000,  300000,  0,      0, "expired"),
  ]);

  const pp = (i) => ppRes.insertedIds[i];
  console.log("Created 12 purchased policies");

  // ── CLAIMS ────────────────────────────────────────────────────
  let claimNum = 1;
  const mkClaim = (num, customer, pp, title, desc, amount, status, incident, created, adjuster, approved, rejected, note, flagged, riskScore) => ({
    claimNumber: `CLM-${now.getFullYear()}-${String(num).padStart(6,"0")}`,
    customer, purchasedPolicy: pp,
    title, description: desc,
    incidentDate: incident,
    claimAmount: amount,
    status,
    ...(approved != null ? { approvedAmount: approved, deductibleApplied: 5000 } : {}),
    ...(rejected ? { rejectionReason: rejected } : {}),
    ...(note ? { adjusterNote: note } : {}),
    ...(adjuster ? { assignedAdjuster: adjuster } : {}),
    incidentLocation: { city: "Mumbai", state: "Maharashtra", country: "India" },
    attachments: [],
    fraudCheck: { riskScore: riskScore || 10, isFlagged: flagged || false, checkedAt: created, rules: [] },
    statusHistory: buildHistory(status, created, adjuster),
    isDeleted: false,
    createdAt: created, updatedAt: now,
  });

  function buildHistory(status, created, adjuster) {
    const h = [{ status:"submitted", changedAt: created, note:"Claim submitted by customer" }];
    if (["under_review","approved","rejected"].includes(status))
      h.push({ status:"under_review", changedAt: new Date(created.getTime()+2*86400000), note: adjuster ? "Assigned to adjuster":"Under review" });
    if (status === "approved")
      h.push({ status:"approved", changedAt: new Date(created.getTime()+5*86400000), note:"Claim approved after verification" });
    if (status === "rejected")
      h.push({ status:"rejected", changedAt: new Date(created.getTime()+4*86400000), note:"Claim rejected" });
    if (status === "withdrawn")
      h.push({ status:"withdrawn", changedAt: new Date(created.getTime()+1*86400000), note:"Withdrawn by customer" });
    return h;
  }

  await db.collection("claims").insertMany([
    // Customer 1 - Health claims
    mkClaim(claimNum++, c1, pp(0), "Emergency Appendectomy Surgery", "Underwent emergency appendectomy at Lilavati Hospital Mumbai. Surgery lasted 3 hours and required 4-day ICU stay. All medical bills and discharge summary attached.", 85000, "approved", daysAgo(50), daysAgo(49), adjId, 75000, null, "Verified with hospital records. Approved after deductible deduction.", false, 12),
    mkClaim(claimNum++, c1, pp(0), "Cardiology Consultation & ECG Tests", "Multiple cardiology consultations following episodes of chest pain and shortness of breath. Underwent ECG, echocardiogram, and treadmill test at Kokilaben Hospital.", 28500, "under_review", daysAgo(18), daysAgo(17), adjId, null, null, "Awaiting additional reports from cardiologist.", false, 18),
    mkClaim(claimNum++, c1, pp(1), "Vehicle Rear-End Collision Damage", "Car was rear-ended at Bandra signal by a truck. Rear bumper, boot lid and tail lamps severely damaged. Police FIR filed. Repair estimate from authorized service center attached.", 68000, "approved", daysAgo(35), daysAgo(34), adj2Id, 63000, null, "Repair bill verified with workshop. Approved with zero depreciation cover.", false, 8),

    // Customer 2 - Health & home claims
    mkClaim(claimNum++, c2, pp(2), "Normal Delivery Maternity Claim", "Hospitalization for normal delivery at Breach Candy Hospital. Total stay of 3 days including pre and post natal care. Newborn covered under family floater.", 95000, "approved", daysAgo(45), daysAgo(44), adjId, 90000, null, "All maternity documents verified. Approved as per maternity rider terms.", false, 5),
    mkClaim(claimNum++, c2, pp(2), "Dengue Fever Hospitalization", "Hospitalized for 5 days due to dengue fever with platelet count drop below 50,000. Treated at Hinduja Hospital with IVIG therapy. Blood reports and discharge summary enclosed.", 42000, "approved", daysAgo(28), daysAgo(27), adj2Id, 37000, null, "Dengue confirmed with NS1 antigen test. Approved.", false, 10),
    mkClaim(claimNum++, c2, pp(3), "Flood Damage to Home", "Flash floods on July 15th caused 3 feet water logging in ground floor apartment. Sofa set, refrigerator, washing machine and flooring completely damaged. Municipal flood report attached.", 185000, "under_review", daysAgo(10), daysAgo(9), adjId, null, null, "Site inspection scheduled. Awaiting surveyor report.", false, 22),

    // Customer 3 - Auto claims (flagged)
    mkClaim(claimNum++, c3, pp(4), "Engine Hydrostatic Lock - Flood Damage", "Vehicle engine seized due to hydrostatic lock after attempting to drive through flooded underpass. Engine completely damaged requiring full replacement.", 180000, "under_review", daysAgo(30), daysAgo(29), adjId, null, null, "Suspicious claim - engine damage pattern inconsistent with reported incident. Fraud check triggered.", true, 65),
    mkClaim(claimNum++, c3, pp(4), "Front Bumper & Hood Damage", "Vehicle collided with a divider on the expressway. Front bumper, hood, headlamps, and radiator damaged. CCTV footage unavailable at that location.", 95000, "approved", daysAgo(28), daysAgo(27), adj2Id, 88000, null, "Damage pattern consistent with reported accident. Approved.", false, 15),
    mkClaim(claimNum++, c3, pp(4), "Windshield & Roof Damage - Hailstorm", "Severe hailstorm on highway caused multiple cracks in windshield and dents across roof and bonnet. Claimed within 24 hours of previous claim.", 78000, "under_review", daysAgo(27), daysAgo(26), adjId, null, null, "Multiple claims in short window. Flagged for investigation.", true, 72),

    // Customer 4 - Health basic
    mkClaim(claimNum++, c4, pp(6), "Knee Replacement Surgery", "Total knee replacement surgery for severe osteoarthritis Grade 4. Pre-authorization obtained. Surgery done at Fortis Hospital. Includes physiotherapy sessions post-surgery.", 155000, "rejected", daysAgo(22), daysAgo(21), adjId, null, "Knee replacement exceeds the maximum claim limit of ₹3,00,000 under Basic plan. Please upgrade to HealthShield Pro for higher coverage.", "Claim amount exceeds policy limit.", false, 8),

    // Customer 5 - Business claims
    mkClaim(claimNum++, c5, pp(8), "Cyber Attack - Data Breach", "Company servers were compromised in a ransomware attack on March 5th. Customer data of 12,000 users was exfiltrated. Legal fees, forensic investigation, and notification costs claimed.", 420000, "approved", daysAgo(40), daysAgo(39), adj2Id, 380000, null, "Cyber incident confirmed by IT forensics firm. Legal expenses verified. Approved.", false, 20),
    mkClaim(claimNum++, c5, pp(8), "Office Fire - Equipment Damage", "Electrical short circuit caused fire in server room. 12 servers, networking equipment and office furniture destroyed. Fire brigade report and FIR attached.", 380000, "under_review", daysAgo(12), daysAgo(11), adjId, null, null, "Fire investigation report pending from surveyor.", false, 18),

    // Customer 6 - Auto claim
    mkClaim(claimNum++, c6, pp(10), "Side Swipe Damage - Parking Lot", "Vehicle was side-swiped by unknown vehicle in parking lot at night. Left door, fender and mirror damaged. No CCTV coverage in that area.", 52000, "submitted", daysAgo(5), daysAgo(5), null, null, null, null, false, 25),

    // Withdrawn claim
    mkClaim(claimNum++, c1, pp(0), "Minor OPD Consultation", "Routine check-up consultation fees. Withdrew claim as amount was below deductible.", 2500, "withdrawn", daysAgo(15), daysAgo(15), null, null, null, null, false, 5),

    // More submitted claims
    mkClaim(claimNum++, c2, pp(2), "Typhoid Fever Treatment", "Hospitalized for 4 days with enteric fever. IV antibiotics administered. Complete blood count and Widal test reports enclosed with discharge summary from Nanavati Hospital.", 38000, "submitted", daysAgo(3), daysAgo(3), null, null, null, null, false, 12),
    mkClaim(claimNum++, c4, pp(7), "Medical Emergency Abroad - Dubai", "Severe food poisoning requiring emergency hospitalization at Mediclinic City Hospital, Dubai. 2 days ICU stay. All original bills converted to INR at applicable rate.", 185000, "submitted", daysAgo(7), daysAgo(7), null, null, null, null, false, 14),
  ]);

  console.log(`Created ${claimNum - 1} claims`);

  // ── FRAUD LOGS ────────────────────────────────────────────────
  await db.collection("fraudlogs").insertMany([
    {
      claim: (await db.collection("claims").findOne({ claimNumber: `CLM-${now.getFullYear()}-000007` }))?._id,
      riskScore: 65, isFlagged: true, status: "open",
      ruleDetails: [
        { rule: "checkMultipleClaimsShortWindow", triggered: true, score: 30, description: "3 claims submitted within 30 days" },
        { rule: "checkHighClaimAmount", triggered: true, score: 20, description: "Claim amount exceeds 80% of max coverage" },
        { rule: "checkWaitingPeriodViolation", triggered: false, score: 0, description: "Within waiting period" },
      ],
      createdAt: daysAgo(29), updatedAt: daysAgo(29),
    },
    {
      claim: (await db.collection("claims").findOne({ claimNumber: `CLM-${now.getFullYear()}-000009` }))?._id,
      riskScore: 72, isFlagged: true, status: "open",
      ruleDetails: [
        { rule: "checkMultipleClaimsShortWindow", triggered: true, score: 30, description: "3 claims submitted within 30 days" },
        { rule: "checkRapidSequentialClaims", triggered: true, score: 20, description: "Claim filed within 24h of previous claim" },
        { rule: "checkDuplicateIncidentDate", triggered: true, score: 22, description: "Incident date overlaps with prior claim" },
      ],
      createdAt: daysAgo(26), updatedAt: daysAgo(26),
    },
  ]);
  console.log("Created 2 fraud logs");

  console.log("\n✅ Seed complete!");
  console.log("─────────────────────────────────────────");
  console.log("  Admin:      admin@insurex.com  / Admin@123");
  console.log("  Agent:      agent@demo.com     / Demo@1234");
  console.log("  Adjuster:   adjuster@demo.com  / Demo@1234");
  console.log("  Customer:   customer@demo.com  / Demo@1234");
  console.log("─────────────────────────────────────────");
  console.log(`  Users: 12 | Policies: 7 | Purchased: 12 | Claims: ${claimNum-1} | FraudLogs: 2`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => { console.error("Seed failed:", err.message); process.exit(1); });
