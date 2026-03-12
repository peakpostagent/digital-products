// parser.test.js -- Comprehensive tests for DotEnv Preview parser
// Uses Vitest with jsdom environment

import { describe, it, expect } from 'vitest';

const DotEnvPreview = require('../src/lib/parser.js');

// ============================================================
// parseEnvContent() Tests
// ============================================================
describe('parseEnvContent', () => {

  // ---- Simple KEY=VALUE ----
  describe('simple KEY=VALUE pairs', () => {
    it('should parse KEY=value', () => {
      const result = DotEnvPreview.parseEnvContent('DATABASE_URL=postgres://localhost:5432/mydb');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('variable');
      expect(result[0].key).toBe('DATABASE_URL');
      expect(result[0].value).toBe('postgres://localhost:5432/mydb');
      expect(result[0].lineNumber).toBe(1);
    });

    it('should parse simple string value', () => {
      const result = DotEnvPreview.parseEnvContent('APP_NAME=MyApp');
      expect(result[0].key).toBe('APP_NAME');
      expect(result[0].value).toBe('MyApp');
    });

    it('should parse numeric value', () => {
      const result = DotEnvPreview.parseEnvContent('PORT=3000');
      expect(result[0].key).toBe('PORT');
      expect(result[0].value).toBe('3000');
    });

    it('should parse boolean value', () => {
      const result = DotEnvPreview.parseEnvContent('DEBUG=true');
      expect(result[0].key).toBe('DEBUG');
      expect(result[0].value).toBe('true');
    });
  });

  // ---- Quoted values ----
  describe('quoted values', () => {
    it('should parse double-quoted value', () => {
      const result = DotEnvPreview.parseEnvContent('APP_NAME="My Application"');
      expect(result[0].key).toBe('APP_NAME');
      expect(result[0].value).toBe('My Application');
    });

    it('should parse single-quoted value', () => {
      const result = DotEnvPreview.parseEnvContent("APP_NAME='My Application'");
      expect(result[0].key).toBe('APP_NAME');
      expect(result[0].value).toBe('My Application');
    });

    it('should handle escaped quotes in double-quoted value', () => {
      const result = DotEnvPreview.parseEnvContent('MSG="He said \\"hello\\""');
      expect(result[0].key).toBe('MSG');
      expect(result[0].value).toBe('He said \\"hello\\"');
    });

    it('should parse value with equals sign in quotes', () => {
      const result = DotEnvPreview.parseEnvContent('CONNECTION="host=localhost port=5432"');
      expect(result[0].key).toBe('CONNECTION');
      expect(result[0].value).toBe('host=localhost port=5432');
    });
  });

  // ---- export prefix ----
  describe('export keyword', () => {
    it('should parse export KEY=VALUE', () => {
      const result = DotEnvPreview.parseEnvContent('export API_KEY=abc123');
      expect(result[0].type).toBe('variable');
      expect(result[0].key).toBe('API_KEY');
      expect(result[0].value).toBe('abc123');
    });

    it('should parse export with quoted value', () => {
      const result = DotEnvPreview.parseEnvContent('export APP_NAME="My App"');
      expect(result[0].key).toBe('APP_NAME');
      expect(result[0].value).toBe('My App');
    });
  });

  // ---- Empty values ----
  describe('empty values', () => {
    it('should parse KEY= (empty value)', () => {
      const result = DotEnvPreview.parseEnvContent('SECRET_KEY=');
      expect(result[0].type).toBe('variable');
      expect(result[0].key).toBe('SECRET_KEY');
      expect(result[0].value).toBe('');
    });

    it('should parse KEY="" (empty quoted value)', () => {
      const result = DotEnvPreview.parseEnvContent('SECRET_KEY=""');
      expect(result[0].key).toBe('SECRET_KEY');
      expect(result[0].value).toBe('');
    });
  });

  // ---- Comments ----
  describe('comments', () => {
    it('should parse comment lines', () => {
      const result = DotEnvPreview.parseEnvContent('# This is a comment');
      expect(result[0].type).toBe('comment');
      expect(result[0].rawLine).toBe('# This is a comment');
    });

    it('should strip inline comments from unquoted values', () => {
      const result = DotEnvPreview.parseEnvContent('PORT=3000 # server port');
      expect(result[0].key).toBe('PORT');
      expect(result[0].value).toBe('3000');
    });

    it('should NOT strip comments inside quoted values', () => {
      const result = DotEnvPreview.parseEnvContent('MSG="hello # world"');
      expect(result[0].value).toBe('hello # world');
    });
  });

  // ---- Blank lines ----
  describe('blank lines', () => {
    it('should parse blank lines', () => {
      const result = DotEnvPreview.parseEnvContent('KEY=value\n\nKEY2=value2');
      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('variable');
      expect(result[1].type).toBe('blank');
      expect(result[2].type).toBe('variable');
    });
  });

  // ---- Multiline values ----
  describe('multiline values', () => {
    it('should parse multiline double-quoted value', () => {
      const input = 'PRIVATE_KEY="line1\nline2\nline3"';
      const result = DotEnvPreview.parseEnvContent(input);
      expect(result[0].key).toBe('PRIVATE_KEY');
      expect(result[0].value).toContain('line1');
      expect(result[0].value).toContain('line2');
    });
  });

  // ---- Mixed content ----
  describe('mixed content', () => {
    it('should parse a complete env file', () => {
      const input = [
        '# Database Configuration',
        'DB_HOST=localhost',
        'DB_PORT=5432',
        'DB_NAME=myapp',
        '',
        '# API Keys',
        'API_KEY=abc123def456',
        'API_SECRET="my secret value"',
        '',
        'export NODE_ENV=production'
      ].join('\n');

      const result = DotEnvPreview.parseEnvContent(input);
      expect(result).toHaveLength(10);
      expect(result[0].type).toBe('comment');
      expect(result[1].type).toBe('variable');
      expect(result[1].key).toBe('DB_HOST');
      expect(result[4].type).toBe('blank');
      expect(result[9].type).toBe('variable');
      expect(result[9].key).toBe('NODE_ENV');
    });
  });

  // ---- Line numbers ----
  describe('line numbers', () => {
    it('should assign correct line numbers', () => {
      const input = 'A=1\nB=2\nC=3';
      const result = DotEnvPreview.parseEnvContent(input);
      expect(result[0].lineNumber).toBe(1);
      expect(result[1].lineNumber).toBe(2);
      expect(result[2].lineNumber).toBe(3);
    });
  });

  // ---- Edge cases ----
  describe('edge cases', () => {
    it('should return empty array for null input', () => {
      expect(DotEnvPreview.parseEnvContent(null)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(DotEnvPreview.parseEnvContent('')).toEqual([]);
    });

    it('should handle line without = as comment', () => {
      const result = DotEnvPreview.parseEnvContent('this is not a variable');
      expect(result[0].type).toBe('comment');
    });

    it('should handle key with underscores', () => {
      const result = DotEnvPreview.parseEnvContent('MY_LONG_VAR_NAME=value');
      expect(result[0].key).toBe('MY_LONG_VAR_NAME');
    });

    it('should handle value with special characters', () => {
      const result = DotEnvPreview.parseEnvContent('URL=https://example.com/path?q=1&b=2');
      expect(result[0].value).toBe('https://example.com/path?q=1&b=2');
    });

    it('should handle unicode values', () => {
      const result = DotEnvPreview.parseEnvContent('GREETING="Hello World"');
      expect(result[0].value).toBe('Hello World');
    });

    it('should reject invalid key names', () => {
      const result = DotEnvPreview.parseEnvContent('123BAD=value');
      expect(result[0].type).toBe('comment'); // treated as non-parseable
    });

    it('should handle Windows line endings (\\r\\n)', () => {
      const result = DotEnvPreview.parseEnvContent('A=1\r\nB=2');
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('A');
      expect(result[1].key).toBe('B');
    });
  });
});

// ============================================================
// groupByPrefix() Tests
// ============================================================
describe('groupByPrefix', () => {

  it('should group DB_ variables together', () => {
    const vars = [
      { key: 'DB_HOST', value: 'localhost' },
      { key: 'DB_PORT', value: '5432' },
      { key: 'DB_NAME', value: 'mydb' }
    ];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(groups['Database (DB_)']).toHaveLength(3);
  });

  it('should group API_ variables together', () => {
    const vars = [
      { key: 'API_KEY', value: 'abc' },
      { key: 'API_SECRET', value: 'def' }
    ];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(groups['API (API_)']).toHaveLength(2);
  });

  it('should group AWS_ variables together', () => {
    const vars = [
      { key: 'AWS_ACCESS_KEY_ID', value: 'key' },
      { key: 'AWS_SECRET_ACCESS_KEY', value: 'secret' },
      { key: 'AWS_REGION', value: 'us-east-1' }
    ];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(groups['AWS (AWS_)']).toHaveLength(3);
  });

  it('should group NEXT_PUBLIC_ variables together', () => {
    const vars = [
      { key: 'NEXT_PUBLIC_API_URL', value: 'https://api.example.com' },
      { key: 'NEXT_PUBLIC_GA_ID', value: 'GA-123' }
    ];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(groups['Next.js Public (NEXT_PUBLIC_)']).toHaveLength(2);
  });

  it('should group REACT_APP_ variables together', () => {
    const vars = [
      { key: 'REACT_APP_API_URL', value: 'https://api.example.com' }
    ];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(groups['React (REACT_APP_)']).toHaveLength(1);
  });

  it('should group VUE_APP_ variables together', () => {
    const vars = [
      { key: 'VUE_APP_TITLE', value: 'My App' }
    ];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(groups['Vue (VUE_APP_)']).toHaveLength(1);
  });

  it('should put PORT in Server group', () => {
    const vars = [{ key: 'PORT', value: '3000' }];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(groups['Server (PORT)']).toHaveLength(1);
  });

  it('should put unknown prefixes in custom groups', () => {
    const vars = [
      { key: 'CUSTOM_VAR', value: 'hello' },
      { key: 'CUSTOM_OTHER', value: 'world' }
    ];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(groups['CUSTOM (CUSTOM_)']).toHaveLength(2);
  });

  it('should put variables without prefix in Other', () => {
    const vars = [{ key: 'DEBUG', value: 'true' }];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(groups['Other']).toHaveLength(1);
  });

  it('should handle mixed groups', () => {
    const vars = [
      { key: 'DB_HOST', value: 'localhost' },
      { key: 'API_KEY', value: 'abc' },
      { key: 'PORT', value: '3000' },
      { key: 'DEBUG', value: 'true' }
    ];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(Object.keys(groups)).toHaveLength(4);
    expect(groups['Database (DB_)']).toHaveLength(1);
    expect(groups['API (API_)']).toHaveLength(1);
    expect(groups['Server (PORT)']).toHaveLength(1);
    expect(groups['Other']).toHaveLength(1);
  });

  it('should group SMTP_ as Email', () => {
    const vars = [{ key: 'SMTP_HOST', value: 'smtp.gmail.com' }];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(groups['Email (SMTP_)']).toHaveLength(1);
  });

  it('should group REDIS_ variables', () => {
    const vars = [{ key: 'REDIS_URL', value: 'redis://localhost:6379' }];
    const groups = DotEnvPreview.groupByPrefix(vars);
    expect(groups['Redis (REDIS_)']).toHaveLength(1);
  });
});

// ============================================================
// classifyValue() Tests
// ============================================================
describe('classifyValue', () => {

  // ---- Sensitive values ----
  describe('sensitive values', () => {
    it('should flag long random strings as sensitive', () => {
      expect(DotEnvPreview.classifyValue('API_KEY', 'rk_prod_9xW2mN4pQ7vR3tY6uB8cD1eF'))
        .toBe('sensitive');
    });

    it('should flag base64-like tokens as sensitive', () => {
      expect(DotEnvPreview.classifyValue('AUTH_TOKEN', 'eyJhbGciOiJIUzI1NiJ9.eyJ0ZXN0IjoiZGF0YSJ9.abc123'))
        .toBe('sensitive');
    });

    it('should flag AWS access keys as sensitive', () => {
      expect(DotEnvPreview.classifyValue('AWS_ACCESS_KEY_ID', 'AKIAIOSFODNN7EXAMPLE'))
        .toBe('sensitive');
    });

    it('should flag password keys with real values as sensitive', () => {
      expect(DotEnvPreview.classifyValue('DB_PASSWORD', 'myRealP@ssw0rd'))
        .toBe('sensitive');
    });

    it('should flag secret keys with non-trivial values as sensitive', () => {
      expect(DotEnvPreview.classifyValue('JWT_SECRET', 'a1b2c3d4e5f6g7h8'))
        .toBe('sensitive');
    });

    it('should flag token keys with long values as sensitive', () => {
      expect(DotEnvPreview.classifyValue('GITHUB_TOKEN', 'ghp_ABCDEFghijklmnopqrstuvwxyz1234567890'))
        .toBe('sensitive');
    });
  });

  // ---- Placeholder values ----
  describe('placeholder values', () => {
    it('should flag empty value as placeholder', () => {
      expect(DotEnvPreview.classifyValue('API_KEY', '')).toBe('placeholder');
    });

    it('should flag "changeme" as placeholder', () => {
      expect(DotEnvPreview.classifyValue('PASSWORD', 'changeme')).toBe('placeholder');
    });

    it('should flag "your_xxx_here" as placeholder', () => {
      expect(DotEnvPreview.classifyValue('API_KEY', 'your_api_key_here')).toBe('placeholder');
    });

    it('should flag "xxx" as placeholder', () => {
      expect(DotEnvPreview.classifyValue('SECRET', 'xxx')).toBe('placeholder');
    });

    it('should flag "TODO" as placeholder', () => {
      expect(DotEnvPreview.classifyValue('API_KEY', 'TODO')).toBe('placeholder');
    });

    it('should flag "<your-key>" as placeholder', () => {
      expect(DotEnvPreview.classifyValue('API_KEY', '<your-key>')).toBe('placeholder');
    });

    it('should flag "[your-key]" as placeholder', () => {
      expect(DotEnvPreview.classifyValue('API_KEY', '[your-key]')).toBe('placeholder');
    });

    it('should flag "{your-key}" as placeholder', () => {
      expect(DotEnvPreview.classifyValue('API_KEY', '{your-key}')).toBe('placeholder');
    });

    it('should flag "example_value" as placeholder', () => {
      expect(DotEnvPreview.classifyValue('KEY', 'example_value')).toBe('placeholder');
    });

    it('should flag null value as placeholder', () => {
      expect(DotEnvPreview.classifyValue('KEY', null)).toBe('placeholder');
    });

    it('should flag undefined value as placeholder', () => {
      expect(DotEnvPreview.classifyValue('KEY', undefined)).toBe('placeholder');
    });

    it('should flag "sk_test_..." as placeholder (test key)', () => {
      expect(DotEnvPreview.classifyValue('STRIPE_KEY', 'sk_test_abc123')).toBe('placeholder');
    });
  });

  // ---- Normal values ----
  describe('normal values', () => {
    it('should classify URL as normal', () => {
      expect(DotEnvPreview.classifyValue('APP_URL', 'https://myapp.com')).toBe('normal');
    });

    it('should classify port number as normal', () => {
      expect(DotEnvPreview.classifyValue('PORT', '3000')).toBe('normal');
    });

    it('should classify hostname as normal', () => {
      expect(DotEnvPreview.classifyValue('DB_HOST', 'localhost')).toBe('normal');
    });

    it('should classify boolean as normal', () => {
      expect(DotEnvPreview.classifyValue('DEBUG', 'true')).toBe('normal');
    });

    it('should classify simple string as normal', () => {
      expect(DotEnvPreview.classifyValue('APP_NAME', 'MyApplication')).toBe('normal');
    });

    it('should classify environment name as normal', () => {
      expect(DotEnvPreview.classifyValue('NODE_ENV', 'production')).toBe('normal');
    });

    it('should classify localhost URL even with sensitive key name as normal', () => {
      expect(DotEnvPreview.classifyValue('AUTH_URL', 'http://localhost:3000')).toBe('normal');
    });

    it('should classify "true" even with sensitive key name as normal', () => {
      expect(DotEnvPreview.classifyValue('AUTH_ENABLED', 'true')).toBe('normal');
    });

    it('should classify port even with sensitive key name as normal', () => {
      expect(DotEnvPreview.classifyValue('AUTH_PORT', '8080')).toBe('normal');
    });
  });
});

// ============================================================
// detectEnvFile() Tests
// ============================================================
describe('detectEnvFile', () => {

  // ---- URL detection ----
  describe('URL-based detection', () => {
    it('should detect .env in GitHub blob URL', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://github.com/user/repo/blob/main/.env', null
      )).toBe(true);
    });

    it('should detect .env.example in GitHub blob URL', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://github.com/user/repo/blob/main/.env.example', null
      )).toBe(true);
    });

    it('should detect .env.local in GitHub blob URL', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://github.com/user/repo/blob/main/.env.local', null
      )).toBe(true);
    });

    it('should detect .env.production in GitHub blob URL', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://github.com/user/repo/blob/main/.env.production', null
      )).toBe(true);
    });

    it('should detect .env.development in GitHub blob URL', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://github.com/user/repo/blob/main/.env.development', null
      )).toBe(true);
    });

    it('should detect .env.staging in GitHub blob URL', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://github.com/user/repo/blob/main/.env.staging', null
      )).toBe(true);
    });

    it('should detect .env.test in GitHub blob URL', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://github.com/user/repo/blob/main/.env.test', null
      )).toBe(true);
    });

    it('should detect .env on raw.githubusercontent.com', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://raw.githubusercontent.com/user/repo/main/.env.example', null
      )).toBe(true);
    });

    it('should detect .env.sample', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://github.com/user/repo/blob/main/.env.sample', null
      )).toBe(true);
    });

    it('should detect .env.template', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://github.com/user/repo/blob/main/.env.template', null
      )).toBe(true);
    });

    it('should NOT detect a regular JS file', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://github.com/user/repo/blob/main/index.js', null
      )).toBe(false);
    });

    it('should NOT detect a README', () => {
      expect(DotEnvPreview.detectEnvFile(
        'https://github.com/user/repo/blob/main/README.md', null
      )).toBe(false);
    });
  });

  // ---- Content detection ----
  describe('content-based detection', () => {
    it('should detect env content from KEY=VALUE lines', () => {
      const content = 'DB_HOST=localhost\nDB_PORT=5432\nDB_NAME=myapp';
      expect(DotEnvPreview.detectEnvFile(null, content)).toBe(true);
    });

    it('should detect env content with comments', () => {
      const content = '# Config\nDB_HOST=localhost\nDB_PORT=5432';
      expect(DotEnvPreview.detectEnvFile(null, content)).toBe(true);
    });

    it('should NOT detect regular text as env content', () => {
      const content = 'This is just a paragraph.\nIt has no key=value pairs.';
      expect(DotEnvPreview.detectEnvFile(null, content)).toBe(false);
    });

    it('should NOT detect code as env content', () => {
      const content = 'function foo() {\n  return bar;\n}\nconst x = 5;';
      expect(DotEnvPreview.detectEnvFile(null, content)).toBe(false);
    });

    it('should detect env content with export prefix', () => {
      const content = 'export DB_HOST=localhost\nexport DB_PORT=5432';
      expect(DotEnvPreview.detectEnvFile(null, content)).toBe(true);
    });
  });
});

// ============================================================
// detectValueType() Tests
// ============================================================
describe('detectValueType', () => {
  it('should detect number', () => {
    expect(DotEnvPreview.detectValueType('3000')).toBe('number');
  });

  it('should detect negative number', () => {
    expect(DotEnvPreview.detectValueType('-1')).toBe('number');
  });

  it('should detect decimal number', () => {
    expect(DotEnvPreview.detectValueType('3.14')).toBe('number');
  });

  it('should detect boolean true', () => {
    expect(DotEnvPreview.detectValueType('true')).toBe('boolean');
  });

  it('should detect boolean false', () => {
    expect(DotEnvPreview.detectValueType('false')).toBe('boolean');
  });

  it('should detect boolean yes', () => {
    expect(DotEnvPreview.detectValueType('yes')).toBe('boolean');
  });

  it('should detect boolean no', () => {
    expect(DotEnvPreview.detectValueType('no')).toBe('boolean');
  });

  it('should detect boolean on', () => {
    expect(DotEnvPreview.detectValueType('on')).toBe('boolean');
  });

  it('should detect boolean off', () => {
    expect(DotEnvPreview.detectValueType('off')).toBe('boolean');
  });

  it('should detect URL', () => {
    expect(DotEnvPreview.detectValueType('https://example.com')).toBe('url');
  });

  it('should detect http URL', () => {
    expect(DotEnvPreview.detectValueType('http://localhost:3000')).toBe('url');
  });

  it('should detect string', () => {
    expect(DotEnvPreview.detectValueType('hello')).toBe('string');
  });

  it('should detect empty', () => {
    expect(DotEnvPreview.detectValueType('')).toBe('empty');
  });

  it('should detect null as empty', () => {
    expect(DotEnvPreview.detectValueType(null)).toBe('empty');
  });

  it('should detect undefined as empty', () => {
    expect(DotEnvPreview.detectValueType(undefined)).toBe('empty');
  });
});

// ============================================================
// detectPrefixLabel() Tests
// ============================================================
describe('detectPrefixLabel', () => {
  it('should return correct label for DB_ prefix', () => {
    expect(DotEnvPreview.detectPrefixLabel('DB_HOST')).toBe('Database (DB_)');
  });

  it('should return correct label for API_ prefix', () => {
    expect(DotEnvPreview.detectPrefixLabel('API_KEY')).toBe('API (API_)');
  });

  it('should return correct label for AWS_ prefix', () => {
    expect(DotEnvPreview.detectPrefixLabel('AWS_REGION')).toBe('AWS (AWS_)');
  });

  it('should return correct label for NEXT_PUBLIC_ prefix', () => {
    expect(DotEnvPreview.detectPrefixLabel('NEXT_PUBLIC_URL')).toBe('Next.js Public (NEXT_PUBLIC_)');
  });

  it('should return Other for keys without underscore', () => {
    expect(DotEnvPreview.detectPrefixLabel('DEBUG')).toBe('Other');
  });

  it('should return Server for PORT', () => {
    expect(DotEnvPreview.detectPrefixLabel('PORT')).toBe('Server (PORT)');
  });

  it('should create custom label for unknown prefixes', () => {
    expect(DotEnvPreview.detectPrefixLabel('MYAPP_SETTING')).toBe('MYAPP (MYAPP_)');
  });

  it('should handle null key', () => {
    expect(DotEnvPreview.detectPrefixLabel(null)).toBe('Other');
  });
});

// ============================================================
// Edge cases and integration
// ============================================================
describe('integration tests', () => {
  it('should correctly parse and group a real-world env file', () => {
    const envContent = [
      '# Application',
      'APP_NAME=MyApp',
      'APP_ENV=production',
      'APP_DEBUG=false',
      '',
      '# Database',
      'DB_HOST=db.example.com',
      'DB_PORT=5432',
      'DB_NAME=myapp_prod',
      'DB_PASSWORD=changeme',
      '',
      '# API Keys',
      'API_KEY=<your-api-key>',
      'STRIPE_SECRET_KEY=rk_prod_9xW2mN4pQ7vR3tY6uB8cD1eF',
      '',
      '# AWS',
      'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
      'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      'AWS_REGION=us-east-1'
    ].join('\n');

    const parsed = DotEnvPreview.parseEnvContent(envContent);
    const variables = parsed.filter(item => item.type === 'variable');
    const groups = DotEnvPreview.groupByPrefix(variables);

    // Check grouping
    expect(groups['Application (APP_)']).toHaveLength(3);
    expect(groups['Database (DB_)']).toHaveLength(4);
    expect(groups['API (API_)']).toHaveLength(1);
    expect(groups['AWS (AWS_)']).toHaveLength(3);

    // Check classifications
    expect(DotEnvPreview.classifyValue('DB_PASSWORD', 'changeme')).toBe('placeholder');
    expect(DotEnvPreview.classifyValue('API_KEY', '<your-api-key>')).toBe('placeholder');
    expect(DotEnvPreview.classifyValue('STRIPE_SECRET_KEY', 'rk_prod_9xW2mN4pQ7vR3tY6uB8cD1eF'))
      .toBe('sensitive');
    expect(DotEnvPreview.classifyValue('AWS_ACCESS_KEY_ID', 'AKIAIOSFODNN7EXAMPLE'))
      .toBe('sensitive');
    expect(DotEnvPreview.classifyValue('AWS_REGION', 'us-east-1')).toBe('normal');
  });

  it('should handle a file with only comments', () => {
    const input = '# Comment 1\n# Comment 2\n# Comment 3';
    const result = DotEnvPreview.parseEnvContent(input);
    expect(result).toHaveLength(3);
    expect(result.every(r => r.type === 'comment')).toBe(true);
  });

  it('should handle a file with only blank lines', () => {
    const input = '\n\n\n';
    const result = DotEnvPreview.parseEnvContent(input);
    expect(result.every(r => r.type === 'blank')).toBe(true);
  });

  it('should preserve raw line content', () => {
    const input = '  DB_HOST=localhost  ';
    const result = DotEnvPreview.parseEnvContent(input);
    expect(result[0].rawLine).toBe('  DB_HOST=localhost  ');
    expect(result[0].key).toBe('DB_HOST');
    expect(result[0].value).toBe('localhost');
  });
});
