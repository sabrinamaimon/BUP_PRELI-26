// Bengali numeral map
const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Converts Western digits to Bengali numerals if language is 'bn'
 * @param {string|number} input
 * @param {string} lang 'en' | 'bn'
 * @returns {string}
 */
export function formatNumber(input, lang = 'en') {
  if (input === null || input === undefined) return '';
  const str = input.toString();
  if (lang !== 'bn') return str;

  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

/**
 * Formats a currency value in BDT
 * @param {number} amount
 * @param {string} lang
 * @returns {string}
 */
export function formatCurrency(amount, lang = 'en') {
  const rounded = Math.round(amount).toLocaleString('en-US');
  const localized = formatNumber(rounded, lang);
  return lang === 'bn' ? `৳ ${localized}` : `BDT ${localized}`;
}

export const translations = {
  en: {
    brandName: "GridWise",
    brandSubtitle: "Smart Campus Energy Dispatch & Autonomous Directive Engine",
    liveStatus: "Active 24-Hour Horizon",
    optimalDispatch: "Optimal Dispatch Confirmed",
    autonomousMode: "Autonomous Engine",
    connectedBackend: "Live API Connected",
    backendOffline: "Client Engine Active",

    // Navigation Tabs
    tabOverview: "Dispatch Overview",
    tabDirectives: "Operator Studio",
    tabSchedule: "Hourly Schedule",
    tabPassport: "Digital Passport",
    tabHarness: "API & Judge Tester",

    // Metrics Bar
    metricTotalDemand: "Total Demand",
    metricTotalGrid: "Grid Procurement",
    metricSolarUsed: "Solar Energy Used",
    metricTotalCost: "Net Electricity Cost",
    metricPeakLoad: "Peak Grid Load",
    metricBatteryNeutrality: "Battery Neutrality",
    neutralityBalanced: "100% Balanced",
    neutralityImbalance: "Imbalanced",

    // Scenario Selector
    scenarioLabel: "Active Scenario",
    selectScenario: "Select Scenario",
    runOptimization: "Re-Optimize Schedule",
    optimizing: "Solving Constraints...",
    recalculate: "Recalculate",

    // Directive Studio
    operatorStudioTitle: "Operator Directives & Natural Language Input",
    operatorStudioDesc: "Input real-time maintenance or grid advisory notes. The engine parses them into deterministic constraints.",
    voiceInputPrompt: "Speak directive (English or Bengali)...",
    voiceListening: "Listening... speak clearly into mic",
    voiceNotSupported: "Speech recognition not available in this browser",
    listenSummary: "Listen to Strategy",
    speaking: "Audio Playing...",
    notesHeading: "Active Operator Notes (Max 3)",
    addNote: "Add Note",
    removeNote: "Remove",
    parsedDirectivesTitle: "Interpreted Machine Directives",
    appliesBadge: "Applies",
    noOpBadge: "No-Op (Distractor)",
    guardrailsPassed: "All Canonical Guardrails Passed",
    affectedHours: "Affected Hours",

    // Chart & Table
    energyFlowTitle: "24-Hour Dispatch & Energy Equilibrium",
    batterySocTitle: "Battery State-of-Charge (SOC) Progression",
    tariffCurveTitle: "Hourly Grid Tariff (BDT/kWh)",
    gridEnergy: "Grid Import",
    solarEnergy: "Solar Output",
    solarCurtailed: "Curtailed Solar",
    batteryCharge: "Battery Charge",
    batteryDischarge: "Battery Discharge",
    batterySoc: "Stored Energy (kWh)",
    demandCurve: "Campus Demand",

    // Schedule Table
    hourCol: "Hour",
    demandCol: "Demand (kWh)",
    solarCol: "Solar (kWh)",
    effectiveSolarCol: "Usable Solar",
    tariffCol: "Tariff (BDT)",
    actionCol: "BESS Action",
    batteryKwhCol: "Battery Δ (kWh)",
    socAfterCol: "SOC After (kWh)",
    gridImportCol: "Grid Import (kWh)",
    costCol: "Cost (BDT)",

    // Emergency & Footer
    emergencyTitle: "Campus Energy Control Helpline",
    emergencySubtitle: "24/7 Grid Operations Dispatch Desk",
    callOperator: "Emergency Dispatch Hot-Dial",
    allRightsReserved: "GridWise Energy Systems. Enterprise Smart Grid Intelligence.",
    versionInfo: "Autonomous Dispatch Engine v2.6.0 | Production Tier"
  },
  bn: {
    brandName: "গ্রিডওয়াইজ",
    brandSubtitle: "স্মার্ট ক্যাম্পাস এনার্জি ডিসপ্যাচ ও স্বয়ংক্রিয় নির্দেশিকা ইঞ্জিন",
    liveStatus: "সক্রিয় ২৪-ঘণ্টা দিগন্ত",
    optimalDispatch: "সর্বোচ্চ অনুকূলিত সময়সূচি নিশ্চিত",
    autonomousMode: "স্বয়ংক্রিয় ক্লায়েন্ট ইঞ্জিন",
    connectedBackend: "সরাসরি ব্যাকএন্ড যুক্ত",
    backendOffline: "ক্লায়েন্ট ইঞ্জিন সক্রিয়",

    // Navigation Tabs
    tabOverview: "ডিসপ্যাচ সারসংক্ষেপ",
    tabDirectives: "অপারেটর স্টুডিও",
    tabSchedule: "ঘণ্টাভিত্তিক শিডিউল",
    tabPassport: "ডিজিটাল পাসপোর্ট",
    tabHarness: "এপিআই ও জাজ টেস্টার",

    // Metrics Bar
    metricTotalDemand: "মোট বিদ্যুৎ চাহিদা",
    metricTotalGrid: "গ্রিড থেকে ক্রয়",
    metricSolarUsed: "ব্যবহৃত সৌরশক্তি",
    metricTotalCost: "বিদ্যুৎ ক্রয়ের মোট খরচ",
    metricPeakLoad: "সর্বোচ্চ গ্রিড লোড",
    metricBatteryNeutrality: "ব্যাটারি নিরপেক্ষতা",
    neutralityBalanced: "১০০% সামঞ্জস্যপূর্ণ",
    neutralityImbalance: "অসামঞ্জস্যপূর্ণ",

    // Scenario Selector
    scenarioLabel: "বর্তমান দৃশ্যপট",
    selectScenario: "দৃশ্যপট নির্বাচন করুন",
    runOptimization: "পুনরায় শিডিউল তৈরি করুন",
    optimizing: "সমাধান বের করা হচ্ছে...",
    recalculate: "পুনঃগণনা",

    // Directive Studio
    operatorStudioTitle: "অপারেটর নির্দেশিকা ও ভয়েস কন্ট্রোল",
    operatorStudioDesc: "রক্ষণাবেক্ষণ বা অপারেশনাল বার্তা লিখুন বা মুখে বলুন। ইঞ্জিন স্বয়ংক্রিয়ভাবে নিয়ম অনুযায়ী প্রয়োগ করবে।",
    voiceInputPrompt: "নির্দেশনা মুখে বলুন (ইংরেজি বা বাংলা)...",
    voiceListening: "শুনছি... পরিষ্কারভাবে কথা বলুন",
    voiceNotSupported: "এই ব্রাউজারে ভয়েস সাপোর্ট নেই",
    listenSummary: "কৌশলটি শুনুন",
    speaking: "অডিও বাজছে...",
    notesHeading: "সক্রিয় অপারেটর নোটস (সর্বোচ্চ ৩টি)",
    addNote: "নোট যুক্ত করুন",
    removeNote: "মুছুন",
    parsedDirectivesTitle: "ব্যাখ্যাকৃত মেশিন নির্দেশিকা",
    appliesBadge: "প্রযোজ্য",
    noOpBadge: "প্রযোজ্য নয় (বাতিল)",
    guardrailsPassed: "সকল ক্যানোনিকাল গার্ডরেইল সন্তুষ্ট",
    affectedHours: "প্রভাবিত ঘণ্টাসমূহ",

    // Chart & Table
    energyFlowTitle: "২৪-ঘণ্টার বিদ্যুৎ প্রবাহ ও ভারসাম্য",
    batterySocTitle: "ব্যাটারি স্টেট-অব-চার্জ (SOC) রূপরেখা",
    tariffCurveTitle: "প্রতি ঘণ্টার গ্রিড ট্যারিফ (BDT/kWh)",
    gridEnergy: "গ্রিড বিদ্যুৎ",
    solarEnergy: "সৌর বিদ্যুৎ",
    solarCurtailed: "অব্যবহৃত সৌরশক্তি",
    batteryCharge: "ব্যাটারি চার্জিং",
    batteryDischarge: "ব্যাটারি ডিসচার্জ",
    batterySoc: "সঞ্চিত শক্তি (kWh)",
    demandCurve: "ক্যাম্পাস চাহিদা",

    // Schedule Table
    hourCol: "ঘণ্টা",
    demandCol: "চাহিদা (kWh)",
    solarCol: "সৌরশক্তি (kWh)",
    effectiveSolarCol: "ব্যবহারযোগ্য সৌর",
    tariffCol: "ট্যারিফ (BDT)",
    actionCol: "ব্যাটারি অবস্থা",
    batteryKwhCol: "ব্যাটারি পরিবর্তন (kWh)",
    socAfterCol: "অবশিষ্ট SOC (kWh)",
    gridImportCol: "গ্রিড আমদানি (kWh)",
    costCol: "খরচ (BDT)",

    // Emergency & Footer
    emergencyTitle: "ক্যাম্পাস এনার্জি কন্ট্রোল হেল্পলাইন",
    emergencySubtitle: "২৪/৭ গ্রিড অপারেশন কন্ট্রোল ডেস্ক",
    callOperator: "জরুরি কল করুন",
    allRightsReserved: "গ্রিডওয়াইজ এনার্জি সিস্টেমস। এন্টারপ্রাইজ স্মার্ট গ্রিড ইন্টেলিজেন্স।",
    versionInfo: "স্বয়ংক্রিয় ডিসপ্যাচ ইঞ্জিন v২.৬.০ | প্রোডাকশন সংস্করণ"
  }
};
