// import validWordsSet from "an-array-of-english-words";
// import natural from "natural";

// // Check if text is meaningful (replaces isMeaningless)
// export function isMeaningful(text) {
//   if (!text || typeof text !== "string") return false;

//   const cleaned = text.trim().toLowxerCase();

//   if (cleaned.length < 10) return false; // too short
//   if (/(.)\1{3,}/.test(cleaned)) return false; // repeated chars
//   if (!cleaned.includes(" ") && !validWordsSet.has(cleaned)) return false; // gibberish

//   const tokenizer = new natural.WordTokenizer();
//   const words = tokenizer.tokenize(cleaned);

//   if (words.length === 0) return false;

//   const meaningful = words.filter(
//     (w) => validWordsSet.has(w) && !natural.stopwords.includes(w)
//   );

//   const ratio = meaningful.length / words.length;

//   if (meaningful.length < 2 || ratio < 0.3) return false;

//   return true;
// }

// // Check if complaint is actionable
// export function isActionableComplaint(text) {
//   if (!text || typeof text !== "string") return false;

//   const actionableKeywords = [
//     "fix", "improve", "change", "report", "update", "resolve", "add", "remove"
//   ];

//   const lowerText = text.toLowerCase();
//   return actionableKeywords.some((kw) => lowerText.includes(kw));
// }

// // Check if complaint is relevant to selected category
// export function isRelevantToCategory(category, text) {
//   if (!category || !text) return false;

//   const categoryKeywords = {
//     "Infrastructure": ["road", "building", "facility", "repair", "maintenance"],
//     "Academics": ["exam", "course", "teacher", "syllabus", "subject"],
//     "Events": ["event", "program", "seminar", "competition", "workshop"],
//     "IT": ["website", "app", "login", "bug", "software", "system"]
//   };

//   const keywords = categoryKeywords[category] || [];
//   const lowerText = text.toLowerCase();

//   return keywords.some((kw) => lowerText.includes(kw));
// }
