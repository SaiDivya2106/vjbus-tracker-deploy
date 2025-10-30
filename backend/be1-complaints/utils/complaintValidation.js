// // utils/complaintValidation.js
// const natural = require("natural");
// const validWords = new Set(require("an-array-of-english-words"));
// const stopwords = natural.stopwords;

// function isMeaningful(text) {
//   const tokenizer = new natural.WordTokenizer();
//   const words = tokenizer.tokenize(text.toLowerCase());

//   const meaningfulWords = words.filter(
//     (word) => validWords.has(word) && !stopwords.includes(word)
//   );

//   // Must have at least 3 meaningful words and at least 50% of words meaningful
//   if (meaningfulWords.length < 3) return false;
//   if (meaningfulWords.length / words.length < 0.5) return false;

//   // Reject gibberish
//   if (/^[a-z]+$/i.test(text) && !validWords.has(text.toLowerCase())) return false;
//   if (/(.)\1{3,}/.test(text)) return false;

//   return true;
// }

// function isActionableComplaint(fullText) {
//   return isMeaningful(fullText);
// }

// // Simple category relevance check (free solution using keyword overlap)
// function isRelevantToCategory(category, fullText) {
//   const tokenizer = new natural.WordTokenizer();
//   const words = tokenizer.tokenize(fullText.toLowerCase());

//   // Normalize category
//   const categoryWords = category.toLowerCase().split(/\s+/);

//   // Count overlap
//   const overlap = words.filter((w) => categoryWords.includes(w));

//   // Require at least 1-2 category words in text
//   return overlap.length >= 1;
// }

// module.exports = { isActionableComplaint, isRelevantToCategory };




// // complaintValidation.js
// const natural = require("natural");
// const tokenizer = new natural.WordTokenizer();

// // Safe POS Tagger initialization
// let tagger;
// try {
//   tagger = new natural.BrillPOSTagger(
//     natural.BrillPOSTagger.defaultLexicon,
//     natural.BrillPOSTagger.defaultRuleSet
//   );
// } catch (err) {
//   console.warn("POS Tagger initialization failed:", err);
//   tagger = null;
// }

// // Offensive words list
// const offensiveWords = [
//   "idiot",
//   "stupid",
//   "shit",
//   "fuck",
//   "damn",
//   "hell",
//   "bastard",
//   "bloody",
//   "offensive",
//   "abusive",
//   "hate",
// ];

// // ------------------ Utility: Safe Tagging ------------------
// function safeTag(text) {
//   try {
//     const words = tokenizer.tokenize(text);
//     if (tagger) return tagger.tag(words).taggedWords;
//     return words.map((w) => ({ token: w, tag: "NN" })); // fallback: mark as noun
//   } catch (err) {
//     console.warn("POS tagging failed:", err);
//     const words = tokenizer.tokenize(text);
//     return words.map((w) => ({ token: w, tag: "NN" }));
//   }
// }

// // ------------------ Check Offensive Language ------------------
// function containsOffensive(text) {
//   if (!text) return false;
//   const lower = text.toLowerCase();
//   return offensiveWords.some((word) => lower.includes(word));
// }

// // ------------------ Check Meaningful Complaint ------------------
// function isMeaningful(text) {
//   if (!text || typeof text !== "string") return false;

//   const cleaned = text.trim();
//   if (cleaned.length < 10) return false; // too short
//   if (/(.)\1{3,}/.test(cleaned)) return false; // repeated chars

//   const tags = safeTag(cleaned);

//   const nounCount = tags.filter((t) => t.tag && t.tag.startsWith("NN")).length;
//   const verbCount = tags.filter((t) => t.tag && t.tag.startsWith("VB")).length;

//   // Require at least 1 noun OR 1 verb
//   if (nounCount < 1 && verbCount < 1) return false;

//   return true;
// }

// // ------------------ Actionable Complaint ------------------
// function isActionableComplaint(text) {
//   if (!text || typeof text !== "string") return false;
//   if (!isMeaningful(text)) return false;
//   if (containsOffensive(text)) return false;
//   return true;
// }

// // ------------------ Category Relevance ------------------
// function isRelevantToCategory(category, text) {
//   if (!category || !text) return false;

//   const lowerText = text.toLowerCase();
//   const lowerCategory = category.toLowerCase();

//   // Accept if category name appears in text
//   if (lowerText.includes(lowerCategory)) return true;

//   // Fallback: at least one noun in text
//   const tags = safeTag(text);
//   const nouns = tags.filter((t) => t.tag && t.tag.startsWith("NN"));
//   return nouns.length >= 1;
// }

// module.exports = {
//   isActionableComplaint,
//   isRelevantToCategory,
//   isMeaningful,
//   containsOffensive,
// };



// // complaintValidation.js
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();

let tagger;
try {
  tagger = new natural.BrillPOSTagger(
    natural.BrillPOSTagger.defaultLexicon,
    natural.BrillPOSTagger.defaultRuleSet
  );
} catch (err) {
  console.warn("POS Tagger initialization failed:", err);
  tagger = null;
}

// ------------------ Lists ------------------
const offensiveWords = [
  "idiot",
  "stupid",
  "shit",
  "fuck",
  "damn",
  "hell",
  "bastard",
  "bloody",
  "offensive",
  "abusive",
  "hate",
];

const collegeKeywords = [
  "college",
  "class",
  "student",
  "faculty",
  "professor",
  "canteen",
  "hostel",
  "lab",
  "exam",
  "marks",
  "infrastructure",
  "maintenance",
  "security",
  "library",
  "bus",
  "wifi",
  "department",
  "placement",
  "event",
  "workshop",
];

// ------------------ Safe POS Tagging ------------------
function safeTag(text) {
  try {
    const words = tokenizer.tokenize(text);
    if (tagger) return tagger.tag(words).taggedWords;
    return words.map((w) => ({ token: w, tag: "NN" }));
  } catch {
    const words = tokenizer.tokenize(text);
    return words.map((w) => ({ token: w, tag: "NN" }));
  }
}

// ------------------ Offensive Words ------------------
function containsOffensive(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return offensiveWords.some((w) => lower.includes(w));
}

// ------------------ Gibberish Detection (Less Strict) ------------------
function containsGibberish(text) {
  if (!text) return false;

  const words = tokenizer.tokenize(text).filter((w) => /^[a-zA-Z]+$/.test(w));
  if (words.length === 0) return true;

  // Very short or no vowels — gibberish
  const vowelRegex = /[aeiou]/i;
  const vowelWords = words.filter((w) => vowelRegex.test(w));
  if (vowelWords.length < 1) return true;

  // Average word length too small (random chars)
  const avgLen = words.reduce((a, w) => a + w.length, 0) / words.length;
  if (avgLen < 3) return true;

  // If most words are 2 letters or less, likely meaningless
  const shortCount = words.filter((w) => w.length <= 2).length;
  if (shortCount > words.length / 2) return true;

  return false;
}

// ------------------ Meaningful Text ------------------
function isMeaningful(text) {
  if (!text || typeof text !== "string") return false;
  const cleaned = text.trim();

  if (cleaned.length < 10) return false;
  if (/(.)\1{3,}/.test(cleaned)) return false;
  if (containsGibberish(cleaned)) return false;

  const tags = safeTag(cleaned);
  const nounCount = tags.filter((t) => t.tag && t.tag.startsWith("NN")).length;
  const verbCount = tags.filter((t) => t.tag && t.tag.startsWith("VB")).length;

  return nounCount >= 1 || verbCount >= 1;
}

// ------------------ Category Relevance ------------------
function isRelevantToCategory(category, text) {
  if (!category || !text) return false;

  const lowerText = text.toLowerCase();
  const lowerCategory = category.toLowerCase();

  // Match category name or general college keywords
  if (lowerText.includes(lowerCategory)) return true;

  const related = collegeKeywords.some((kw) => lowerText.includes(kw));
  return related;
}

// ------------------ Main Check ------------------
function isActionableComplaint(text, category) {
  if (!text || typeof text !== "string") return false;

  if (containsOffensive(text)) return false;
  if (!isMeaningful(text)) return false;
  if (!isRelevantToCategory(category, text)) return false;

  return true;
}

module.exports = {
  isActionableComplaint,
  isRelevantToCategory,
  isMeaningful,
  containsOffensive,
  containsGibberish,
};



// backend/utils/complaintValidation.js







// utils/complaintValidation.js
// const natural = require("natural");
// const validWords = new Set(require("an-array-of-english-words"));
// const stopwords = natural.stopwords;

// // Simple list of offensive words (free solution)
// const offensiveWords = [
//   "idiot", "stupid", "damn", "hell", "shit", "fuck", "bitch", "asshole"
// ];

// function isMeaningful(text) {
//   const tokenizer = new natural.WordTokenizer();
//   const words = tokenizer.tokenize(text.toLowerCase());

//   const meaningfulWords = words.filter(
//     (w) => validWords.has(w) && !stopwords.includes(w)
//   );

//   if (meaningfulWords.length < 3) return false;       // too few meaningful words
//   if (meaningfulWords.length / words.length < 0.5) return false; // mostly gibberish

//   if (/^[a-z]+$/i.test(text) && !validWords.has(text.toLowerCase())) return false;
//   if (/(.)\1{3,}/.test(text)) return false;

//   return true;
// }

// function containsOffensive(text) {
//   const lower = text.toLowerCase();
//   return offensiveWords.some((word) => lower.includes(word));
// }

// // Check if complaint is actionable (not fun / meaningless / offensive)
// function isActionableComplaint(text) {
//   return isMeaningful(text) && !containsOffensive(text);
// }

// // Free category relevance check (loose semantic similarity)
// function isRelevantToCategory(category, text) {
//   const tokenizer = new natural.WordTokenizer();
//   const words = tokenizer.tokenize(text.toLowerCase());
//   const cat = category.toLowerCase();

//   if (words.includes(cat)) return true;

//   const categoryHints = {
//     infrastructure: [
//       "lab","classroom","projector","sound","building","electricity","light","fan","air conditioner","ac",
//       "window","door","roof","floor","maintenance","repairs","facility"
//     ],
//     canteen: [
//       "food","meal","hygiene","staff","utensil","menu","water","beverage","snacks",
//       "breakfast","lunch","dinner","canteen","cleanliness","queue","service","quality"
//     ],
//     hostel: [
//       "room","bed","bathroom","mess","water","electricity","light","fan","ac","toilet",
//       "cleanliness","facility","maintenance","hostel","windows","doors"
//     ],
//     "hostel food": [
//       "food","meal","quality","hygiene","mess","staff","menu","taste","breakfast","lunch","dinner"
//     ],
//     examination: [
//       "exam","paper","question","results","marks","timetable","hall","seating","schedule","grades"
//     ],
//     security: [
//       "guard","gate","safety","entry","check","id","theft","harassment","camera","security","lock"
//     ],
//     library: [
//       "book","reading","seat","computer","system","library","availability","study","desk","chair"
//     ],
//     transport: [
//       "bus","driver","route","pickup","timing","travel","shuttle","stop","schedule","vehicle"
//     ],
//     sports: [
//       "ground","equipment","tournament","practice","games","sports","coach","team","field","players"
//     ],
//     "fee payments and accounts": [
//       "fee","payment","account","balance","due","semester","receipt","fine","tuition","transaction"
//     ],
//     "extracurricular and events": [
//       "event","activity","extracurricular","festival","competition","program","club","cultural","sports"
//     ],
//     housekeeping: [
//       "cleaning","dust","garbage","sweep","mop","washroom","maintenance","janitor","facility","hygiene"
//     ],
//     "audio-visual equipment": [
//       "projector","screen","microphone","sound","speaker","audio","visual","presentation","equipment","mic"
//     ],
//     parking: [
//       "parking","slot","vehicle","bike","car","space","ticket","entry","exit","gate"
//     ],
//     it: [
//       "computer","network","internet","wifi","system","software","hardware","printer","login","password","server"
//     ],
//     others: []
//   };

//   const hints = categoryHints[cat] || [];
//   const overlap = words.filter((w) => hints.includes(w));

//   return overlap.length >= 1;
// }

// module.exports = { isActionableComplaint, isRelevantToCategory };
