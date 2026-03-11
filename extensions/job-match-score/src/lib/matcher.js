// matcher.js — Core keyword matching engine
// This file is loaded as a content script, so no ES module imports.
// Functions are attached to a global namespace for content.js to use.

const JobMatchScore = (() => {
  // Common stop words to filter out
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'must',
    'not', 'no', 'nor', 'so', 'if', 'then', 'than', 'too', 'very',
    'just', 'about', 'above', 'after', 'again', 'all', 'also', 'am',
    'any', 'as', 'because', 'before', 'between', 'both', 'each', 'few',
    'get', 'got', 'he', 'her', 'here', 'him', 'his', 'how', 'i', 'into',
    'it', 'its', 'let', 'me', 'more', 'most', 'my', 'new', 'now', 'off',
    'old', 'once', 'one', 'only', 'other', 'our', 'out', 'over', 'own',
    'per', 'put', 'said', 'same', 'she', 'some', 'such', 'take', 'tell',
    'that', 'their', 'them', 'these', 'they', 'this', 'those', 'through',
    'under', 'until', 'up', 'upon', 'us', 'use', 'used', 'using', 'want',
    'we', 'well', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
    'why', 'work', 'working', 'you', 'your', 'ability', 'able', 'across',
    'including', 'within', 'without', 'strong', 'excellent', 'good',
    'great', 'best', 'like', 'make', 'way', 'years', 'year',
    'required', 'preferred', 'minimum', 'plus', 'bonus', 'etc', 'role',
    'position', 'company', 'join', 'looking', 'seeking', 'ideal',
    'candidate', 'responsibilities', 'qualifications', 'requirements',
    'description', 'overview', 'summary', 'apply', 'equal', 'opportunity',
    'employer', 'benefits', 'salary', 'compensation', 'location',
    'hybrid', 'onsite', 'full', 'time', 'part'
  ]);

  // Common tech skill synonyms (maps variations to canonical form)
  const SYNONYMS = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'cpp': 'c++',
    'csharp': 'c#',
    'golang': 'go',
    'k8s': 'kubernetes',
    'postgres': 'postgresql',
    'mongo': 'mongodb',
    'react.js': 'react',
    'reactjs': 'react',
    'node': 'nodejs',
    'node.js': 'nodejs',
    'vue.js': 'vue',
    'vuejs': 'vue',
    'next.js': 'nextjs',
    'nuxt.js': 'nuxtjs',
    'express.js': 'express',
    'expressjs': 'express',
    'angular.js': 'angular',
    'angularjs': 'angular',
    'ml': 'machine learning',
    'ai': 'artificial intelligence',
    'dl': 'deep learning',
    'nlp': 'natural language processing',
    'cv': 'computer vision',
    'ci/cd': 'cicd',
    'ci': 'cicd',
    'cd': 'cicd',
    'aws': 'amazon web services',
    'gcp': 'google cloud platform',
    'devops': 'devops',
    'qa': 'quality assurance',
    'ui': 'user interface',
    'ux': 'user experience',
    'ui/ux': 'ui ux',
    'api': 'api',
    'rest': 'restful',
    'restful': 'restful',
    'graphql': 'graphql',
    'sql': 'sql',
    'nosql': 'nosql',
    'saas': 'saas',
    'agile': 'agile',
    'scrum': 'scrum',
    'dotnet': 'dotnet',
    '.net': 'dotnet',
    'azure': 'microsoft azure',
    'tf': 'terraform',
    'mysql': 'mysql',
    'mariadb': 'mysql',
    // Additional tech variations
    'django': 'django',
    'flask': 'flask',
    'ansible': 'ansible',
    'redis': 'redis',
    'rabbitmq': 'rabbitmq',
    'kafka': 'kafka',
    'jenkins': 'jenkins',
    'gh': 'github',
    'gitlab': 'gitlab',
    'bitbucket': 'bitbucket'
  };

  // Multi-word terms to detect as single keywords
  const MULTI_WORD_TERMS = [
    'machine learning', 'deep learning', 'natural language processing',
    'computer vision', 'artificial intelligence', 'data science',
    'data engineering', 'data analytics', 'business intelligence',
    'project management', 'product management', 'software engineering',
    'web development', 'mobile development', 'cloud computing',
    'version control', 'unit testing', 'integration testing',
    'continuous integration', 'continuous deployment',
    'user experience', 'user interface', 'front end', 'back end',
    'full stack', 'cross functional', 'problem solving',
    'amazon web services', 'google cloud platform', 'microsoft azure',
    'ruby on rails', 'spring boot', 'object oriented',
    'design patterns', 'system design', 'technical leadership',
    'code review', 'pair programming', 'test driven development',
    'domain driven design'
  ];

  /**
   * Strip HTML tags from text
   */
  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Normalize a single word/term
   */
  function normalize(word) {
    const lower = word.toLowerCase().trim();
    return SYNONYMS[lower] || lower;
  }

  /**
   * Extract meaningful keywords from text
   * @param {string} text - Resume or job description text
   * @returns {string[]} - Array of normalized keywords (deduplicated)
   */
  function extractKeywords(text) {
    if (!text || typeof text !== 'string') return [];

    // Strip HTML if present
    let clean = text.includes('<') ? stripHtml(text) : text;

    // Lowercase
    clean = clean.toLowerCase();

    // Extract multi-word terms first
    const found = [];
    for (const term of MULTI_WORD_TERMS) {
      if (clean.includes(term)) {
        found.push(term);
      }
    }

    // Split on whitespace and punctuation, keeping meaningful chars
    const words = clean
      .split(/[\s,;:()\[\]{}"'|/\\]+/)
      .map(w => w.replace(/^[^a-z0-9#+-]+|[^a-z0-9#+-]+$/g, ''))
      .filter(w => w.length > 1)
      .map(normalize)
      .filter(w => !STOP_WORDS.has(w));

    // Combine single words and multi-word terms, deduplicate
    const all = [...found, ...words];
    return [...new Set(all)].sort();
  }

  // Pairs that should NOT be treated as partial matches
  const FALSE_PARTIAL_MATCHES = [
    ['java', 'javascript'],
    ['sql', 'nosql'],
    ['sql', 'mysql'],
    ['sql', 'postgresql'],
    ['go', 'golang'],
    ['c', 'c++'],
    ['c', 'c#'],
    ['r', 'ruby'],
    ['r', 'react'],
    ['css', 'scss']
  ];

  /**
   * Check if two keywords are a known false positive for partial matching
   */
  function isKnownMismatch(a, b) {
    for (const [x, y] of FALSE_PARTIAL_MATCHES) {
      if ((a === x && b === y) || (a === y && b === x)) return true;
    }
    return false;
  }

  /**
   * Calculate match score between resume and job description
   * @param {string[]} resumeKeywords - Keywords from user's resume
   * @param {string[]} jobKeywords - Keywords from job description
   * @returns {{ score: number, matched: string[], missing: string[] }}
   */
  function calculateMatch(resumeKeywords, jobKeywords) {
    if (!jobKeywords || jobKeywords.length === 0) {
      return { score: 0, matched: [], missing: [] };
    }
    if (!resumeKeywords || resumeKeywords.length === 0) {
      return { score: 0, matched: [], missing: [...jobKeywords] };
    }

    const resumeSet = new Set(resumeKeywords.map(normalize));
    const matched = [];
    const missing = [];

    for (const keyword of jobKeywords) {
      const norm = normalize(keyword);
      if (resumeSet.has(norm)) {
        matched.push(keyword);
      } else {
        // Check partial matches with safeguards against false positives
        let partialMatch = false;
        for (const rk of resumeSet) {
          // Both strings must be 4+ chars to allow partial matching
          if (rk.length < 4 || norm.length < 4) continue;
          // Skip known false positives
          if (isKnownMismatch(rk, norm)) continue;
          if (rk.includes(norm) || norm.includes(rk)) {
            matched.push(keyword);
            partialMatch = true;
            break;
          }
        }
        if (!partialMatch) {
          missing.push(keyword);
        }
      }
    }

    const score = Math.round((matched.length / jobKeywords.length) * 100);
    return { score, matched, missing };
  }

  // Expose functions globally for content script access
  return { extractKeywords, calculateMatch, stripHtml, normalize };
})();
