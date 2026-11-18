export interface QuoteItem {
  id: string;
  author: string;
  source: string;
  text: string;
  category: 'wisdom' | 'literature' | 'science' | 'productivity';
}

export interface CodeSnippetItem {
  id: string;
  language: 'Python' | 'TypeScript' | 'C++' | 'Rust';
  title: string;
  code: string;
}

export const COMMON_WORDS_200: string[] = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
  'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
  'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so',
  'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
  'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people',
  'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
  'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'system',
  'program', 'question', 'work', 'government', 'number', 'night', 'point', 'home', 'water', 'room',
  'mother', 'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study', 'book',
  'eye', 'job', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service',
  'friend', 'father', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car',
  'city', 'community', 'name', 'president', 'team', 'minute', 'idea', 'kid', 'body', 'information',
  'nothing', 'ago', 'lead', 'social', 'understand', 'whether', 'watch', 'together', 'follow', 'around',
  'parent', 'only', 'stop', 'face', 'anything', 'create', 'public', 'already', 'speak', 'others',
  'read', 'level', 'allow', 'add', 'office', 'spend', 'door', 'health', 'person', 'art',
  'sure', 'such', 'war', 'history', 'party', 'within', 'grow', 'result', 'open', 'change',
  'morning', 'walk', 'reason', 'low', 'win', 'research', 'girl', 'guy', 'early', 'food',
];

export const COMMON_WORDS_EXTENDED: string[] = [
  ...COMMON_WORDS_200,
  'moment', 'himself', 'air', 'teacher', 'force', 'offer', 'enough', 'education', 'across', 'although',
  'remember', 'foot', 'second', 'boy', 'maybe', 'toward', 'able', 'age', 'policy', 'everything',
  'love', 'process', 'music', 'including', 'consider', 'appear', 'actually', 'buy', 'probably', 'human',
  'wait', 'serve', 'market', 'die', 'send', 'expect', 'sense', 'build', 'stay', 'fall',
  'oh', 'nation', 'plan', 'cut', 'college', 'interest', 'death', 'course', 'someone', 'experience',
  'behind', 'reach', 'local', 'kill', 'six', 'remain', 'effect', 'use', 'yeah', 'suggest',
  'class', 'control', 'raise', 'care', 'perhaps', 'little', 'late', 'hard', 'field', 'else',
  'pass', 'former', 'sell', 'major', 'sometimes', 'require', 'along', 'development', 'themselves', 'report',
  'role', 'better', 'economic', 'effort', 'decide', 'rate', 'strong', 'possible', 'heart', 'drug',
  'show', 'leader', 'light', 'voice', 'wife', 'whole', 'police', 'mind', 'finally', 'pull',
  'return', 'free', 'military', 'price', 'report', 'less', 'according', 'decision', 'explain', 'son',
  'hope', 'even', 'develop', 'view', 'relationship', 'carry', 'town', 'road', 'drive', 'arm',
  'true', 'federal', 'break', 'better', 'difference', 'thank', 'receive', 'value', 'international', 'building',
  'action', 'full', 'model', 'join', 'season', 'society', 'because', 'tax', 'director', 'early',
  'position', 'player', 'agree', 'especially', 'record', 'pick', 'wear', 'paper', 'special', 'space',
  'ground', 'form', 'support', 'event', 'official', 'whose', 'matter', 'everyone', 'center', 'couple',
  'site', 'end', 'project', 'hit', 'base', 'activity', 'star', 'table', 'need', 'court',
  'produce', 'eat', 'teach', 'oil', 'half', 'situation', 'easy', 'cost', 'industry', 'figure',
  'street', 'image', 'itself', 'phone', 'either', 'data', 'cover', 'quite', 'picture', 'clear',
  'practice', 'piece', 'land', 'recent', 'describe', 'product', 'doctor', 'wall', 'patient', 'worker',
];

export const NGRAM_DRILLS: { id: string; title: string; description: string; words: string[] }[] = [
  {
    id: 'bigrams-top',
    title: 'Top English Bigrams (th, he, in, er, an, re, on)',
    description: 'High-frequency two-letter transitions that make up 35% of all English text.',
    words: [
      'the', 'there', 'their', 'then', 'them', 'other', 'mother', 'father', 'weather', 'gather',
      'here', 'heart', 'heavy', 'into', 'inside', 'inter', 'inner', 'since', 'point', 'train',
      'under', 'water', 'after', 'never', 'better', 'letter', 'center', 'answer', 'ander', 'plan',
      'stand', 'grand', 'brand', 'reach', 'ready', 'reason', 'really', 'upon', 'only', 'long',
    ],
  },
  {
    id: 'trigrams-top',
    title: 'Top English Trigrams (the, and, ing, ion, ent, for)',
    description: 'Build automatic 3-finger chord transitions for common prefixes and suffixes.',
    words: [
      'thinking', 'working', 'learning', 'building', 'morning', 'nothing', 'everything', 'something',
      'action', 'nation', 'station', 'motion', 'question', 'education', 'information', 'position',
      'moment', 'element', 'present', 'different', 'student', 'parent', 'government', 'movement',
      'before', 'forever', 'forward', 'forest', 'forget', 'forgive', 'format', 'force',
    ],
  },
  {
    id: 'alternating-hands',
    title: 'Alternating Hand Flow',
    description: 'Words that alternate rapidly between left and right hands for peak rhythm.',
    words: [
      'island', 'auditor', 'fiesta', 'handle', 'panel', 'visual', 'signal', 'formal', 'normal',
      'social', 'ritual', 'mutual', 'actual', 'world', 'right', 'light', 'sight', 'fight', 'tight',
      'giant', 'chant', 'plant', 'grant', 'slant', 'flame', 'frame', 'blame', 'shame', 'claim',
    ],
  },
];

export const QUOTES_POOL: QuoteItem[] = [
  {
    id: 'q1',
    author: 'Marcus Aurelius',
    source: 'Meditations',
    category: 'wisdom',
    text: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
  },
  {
    id: 'q2',
    author: 'Richard Feynman',
    source: 'Surely You\'re Joking, Mr. Feynman!',
    category: 'science',
    text: 'The first principle is that you must not fool yourself, and you are the easiest person to fool.',
  },
  {
    id: 'q3',
    author: 'Cal Newport',
    source: 'Deep Work',
    category: 'productivity',
    text: 'Clarity about what matters provides clarity about what does not. Deep work is the superpower of the twenty-first century.',
  },
  {
    id: 'q4',
    author: 'James Clear',
    source: 'Atomic Habits',
    category: 'productivity',
    text: 'Every action you take is a vote for the type of person you wish to become. Small habits don\'t add up; they compound.',
  },
  {
    id: 'q5',
    author: 'Carl Sagan',
    source: 'Cosmos',
    category: 'science',
    text: 'Somewhere, something incredible is waiting to be known. We are a way for the cosmos to know itself.',
  },
  {
    id: 'q6',
    author: 'J.R.R. Tolkien',
    source: 'The Fellowship of the Ring',
    category: 'literature',
    text: 'All we have to decide is what to do with the time that is given us. Even the smallest person can change the course of the future.',
  },
  {
    id: 'q7',
    author: 'Linus Torvalds',
    source: 'Open Source Essays',
    category: 'science',
    text: 'Talk is cheap. Show me the code. Given enough eyeballs, all bugs are shallow when software is free and open.',
  },
  {
    id: 'q8',
    author: 'Seneca',
    source: 'Letters from a Stoic',
    category: 'wisdom',
    text: 'It is not that we have a short time to live, but that we waste a lot of it. Life is long if you know how to use it.',
  },
];

export const CODE_SNIPPETS_POOL: CodeSnippetItem[] = [
  {
    id: 'code-py-1',
    language: 'Python',
    title: 'Binary Search Algorithm',
    code: `def binary_search(items: list[int], target: int) -> int:\n    low, high = 0, len(items) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if items[mid] == target:\n            return mid\n        elif items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1`,
  },
  {
    id: 'code-ts-1',
    language: 'TypeScript',
    title: 'Debounce Utility Function',
    code: `export function debounce<T extends (...args: unknown[]) => void>(\n  fn: T,\n  delayMs: number\n): (...args: Parameters<T>) => void {\n  let timer: ReturnType<typeof setTimeout> | null = null;\n  return (...args: Parameters<T>) => {\n    if (timer) clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delayMs);\n  };\n}`,
  },
  {
    id: 'code-cpp-1',
    language: 'C++',
    title: 'Fast Vector Sum & Filter',
    code: `#include <vector>\n#include <numeric>\n\nint sumPositiveValues(const std::vector<int>& nums) {\n    int total = 0;\n    for (int val : nums) {\n        if (val > 0) {\n            total += val;\n        }\n    }\n    return total;\n}`,
  },
  {
    id: 'code-rs-1',
    language: 'Rust',
    title: 'Word Frequency Counter',
    code: `use std::collections::HashMap;\n\npub fn count_words(text: &str) -> HashMap<&str, usize> {\n    let mut counts = HashMap::new();\n    for word in text.split_whitespace() {\n        *counts.entry(word).or_insert(0) += 1;\n    }\n    counts\n}`,
  },
];

export function generateWordTestText(
  wordCount: number,
  poolType: 'top200' | 'top1000' | 'bigrams' | 'trigrams' | 'alternating',
  includePunctuation: boolean = false,
  includeNumbers: boolean = false
): string {
  let baseWords: string[] = COMMON_WORDS_200;
  if (poolType === 'top1000') baseWords = COMMON_WORDS_EXTENDED;
  if (poolType === 'bigrams') baseWords = NGRAM_DRILLS[0].words;
  if (poolType === 'trigrams') baseWords = NGRAM_DRILLS[1].words;
  if (poolType === 'alternating') baseWords = NGRAM_DRILLS[2].words;

  const result: string[] = [];
  let prev = '';

  for (let i = 0; i < wordCount; i++) {
    if (includeNumbers && i > 0 && i % 9 === 0) {
      result.push(String(10 + Math.floor(Math.random() * 980)));
      continue;
    }

    let word = baseWords[Math.floor(Math.random() * baseWords.length)];
    if (word === prev && baseWords.length > 1) {
      word = baseWords[(baseWords.indexOf(word) + 1) % baseWords.length];
    }
    prev = word;

    if (includePunctuation) {
      if (i === 0 || (i > 0 && result[i - 1]?.endsWith('.'))) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (i > 2 && i % 7 === 0) {
        word += '.';
      } else if (i > 1 && i % 5 === 0) {
        word += ',';
      }
    }

    result.push(word);
  }

  return result.join(' ');
}
