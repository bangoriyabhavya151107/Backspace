export type CategorySlug =
  | 'git'
  | 'terminal'
  | 'docker'
  | 'sql'
  | 'code'
  | 'prompts'
  | 'symbols'
  | 'weak-keys';

export type StandardCategorySlug = Exclude<CategorySlug, 'weak-keys'>;

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type CodeLanguage = 'js' | 'python';
export type TestDuration = 30 | 60 | 120 | 300;

export interface CategoryMeta {
  slug: CategorySlug;
  name: string;
  shortName: string;
  promptPrefix: '$' | '>' | '';
  keycapLabel: string;
  description: string;
  sampleLine: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'git',
    name: 'Git',
    shortName: 'Git',
    promptPrefix: '$',
    keycapLabel: 'git',
    description: 'Commits, branches, rebases, stashes, and history flags.',
    sampleLine: 'git commit --amend --no-edit',
  },
  {
    slug: 'terminal',
    name: 'Terminal',
    shortName: 'Terminal',
    promptPrefix: '$',
    keycapLabel: 'sh',
    description: 'Pipes, grep, find, awk, permissions, and SSH flags.',
    sampleLine: 'grep -rn "TODO" src/ | wc -l',
  },
  {
    slug: 'docker',
    name: 'Docker',
    shortName: 'Docker',
    promptPrefix: '$',
    keycapLabel: 'dkr',
    description: 'Containers, port mappings, volumes, Compose, and buildx.',
    sampleLine: 'docker compose up -d --build',
  },
  {
    slug: 'sql',
    name: 'SQL',
    shortName: 'SQL',
    promptPrefix: '',
    keycapLabel: 'SQL',
    description: 'PostgreSQL queries, joins, window functions, and indexes.',
    sampleLine: 'SELECT u.name, COUNT(o.id) FROM users u;',
  },
  {
    slug: 'code',
    name: 'Code',
    shortName: 'Code',
    promptPrefix: '',
    keycapLabel: '{ }',
    description: 'Idiomatic TypeScript, JavaScript, and Python one-liners.',
    sampleLine: 'const doubled = numbers.map((n) => n * 2);',
  },
  {
    slug: 'prompts',
    name: 'AI Prompts',
    shortName: 'AI Prompts',
    promptPrefix: '>',
    keycapLabel: 'AI',
    description: 'Structured engineering prompts, constraints, and reviews.',
    sampleLine: 'Review this pull request and list the top 3 risks.',
  },
  {
    slug: 'symbols',
    name: 'Symbols',
    shortName: 'Symbols',
    promptPrefix: '',
    keycapLabel: '!=',
    description: 'Pure brackets, operators, regex, and shell expansions.',
    sampleLine: 'if (a !== b && (c || !d)) { g(); }',
  },
  {
    slug: 'weak-keys',
    name: 'My weak keys',
    shortName: 'My weak keys',
    promptPrefix: '',
    keycapLabel: 'Δms',
    description: 'Adaptive drill weighted toward your slowest and most error-prone characters.',
    sampleLine: 'Adaptive practice built from your keystroke latency.',
  },
];

export interface ContentBank {
  git: Record<DifficultyLevel, string[]>;
  terminal: Record<DifficultyLevel, string[]>;
  docker: Record<DifficultyLevel, string[]>;
  sql: Record<DifficultyLevel, string[]>;
  code: Record<CodeLanguage, Record<DifficultyLevel, string[]>>;
  prompts: Record<DifficultyLevel, string[]>;
  symbols: Record<DifficultyLevel, string[]>;
}

export const content: ContentBank = {
  git: {
    easy: [
      'git status',
      'git add .',
      'git commit -m "fix typo"',
      'git pull origin main',
      'git push origin main',
      'git log --oneline',
      'git branch -a',
      'git diff',
      'git checkout main',
      'git fetch --all',
    ],
    medium: [
      'git checkout -b feature/login-form',
      'git stash pop',
      'git commit --amend --no-edit',
      'git diff --staged',
      'git merge --no-ff feature/login-form',
      'git reset --soft HEAD~1',
      'git cherry-pick a1b2c3d',
      'git branch -d feature/login-form',
      'git tag -a v1.2.0 -m "release 1.2.0"',
      'git remote -v',
    ],
    hard: [
      'git rebase -i HEAD~3',
      'git push --force-with-lease origin main',
      'git log --graph --oneline --decorate --all',
      'git reflog expire --expire=now --all',
      'git bisect start HEAD v1.0.0',
      'git submodule update --init --recursive',
      'git worktree add -b hotfix ../hotfix main',
      'git stash push -u -m "wip: refactor auth"',
      'git clean -fd',
    ],
  },
  terminal: {
    easy: [
      'ls -la',
      'cd ~/projects',
      'mkdir -p src/components',
      'cat package.json',
      'cp .env.example .env',
      'rm -rf node_modules',
      'pwd',
      'touch index.ts',
      'clear',
    ],
    medium: [
      'grep -rn "TODO" src/',
      'chmod +x deploy.sh',
      'find . -name "*.log" -type f',
      'tail -f logs/app.log',
      'ps aux | grep node',
      'curl -s https://api.example.com/health | jq .',
      'ssh -i ~/.ssh/id_ed25519 dev@192.168.1.10',
      'du -sh ./dist/*',
      'ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/',
    ],
    hard: [
      'find . -name "*.tmp" -print0 | xargs -0 rm -f',
      "awk -F',' '{ sum += $3 } END { print sum }' sales.csv",
      "sed -i 's/localhost:3000/api.example.com/g' .env",
      'tar -czvf backup-$(date +%F).tar.gz ./data',
      "lsof -i :3000 | awk 'NR>1 {print $2}' | xargs kill -9",
      'for f in *.png; do mv "$f" "img_$f"; done',
      'rsync -avz --delete ./build/ deploy@server:/var/www/app/',
    ],
  },
  docker: {
    easy: [
      'docker ps',
      'docker images',
      'docker pull node:20-alpine',
      'docker stop my-app',
      'docker logs my-app',
      'docker build -t my-app .',
      'docker rm my-app',
      'docker ps -a',
      'docker stats --no-stream',
    ],
    medium: [
      'docker run -d -p 3000:3000 --name my-app my-app',
      'docker exec -it my-app sh',
      'docker compose up -d --build',
      'docker volume ls',
      'docker run --rm -v $(pwd):/app -w /app node:20 npm test',
      'docker network create backend',
      'docker logs -f --tail 100 my-app',
      'docker compose down -v',
      'docker cp my-app:/app/logs ./logs',
    ],
    hard: [
      'docker build --no-cache --platform linux/amd64 -t registry.example.com/my-app:1.0.0 .',
      'docker system prune -af --volumes',
      'docker run -d --restart unless-stopped -e NODE_ENV=production -p 8080:80 nginx:alpine',
      'docker compose -f docker-compose.prod.yml up -d --remove-orphans',
      "docker inspect --format='{{.State.Status}}' my-app",
      'docker buildx build --push -t user/app:latest .',
      'docker image prune -a --filter "until=24h"',
    ],
  },
  sql: {
    easy: [
      'SELECT * FROM users;',
      'SELECT name, email FROM users LIMIT 10;',
      "INSERT INTO users (name, email) VALUES ('Asha', 'asha@example.com');",
      'UPDATE users SET active = true WHERE id = 1;',
      'DELETE FROM sessions WHERE expired = true;',
      'CREATE TABLE tasks (id INT PRIMARY KEY, title TEXT);',
      'SELECT COUNT(*) FROM orders;',
      'SELECT id, title FROM tasks ORDER BY id DESC;',
    ],
    medium: [
      'SELECT u.name, COUNT(o.id) FROM users u JOIN orders o ON o.user_id = u.id GROUP BY u.name;',
      'SELECT * FROM products WHERE price BETWEEN 10 AND 50 ORDER BY price DESC;',
      'ALTER TABLE users ADD COLUMN last_login TIMESTAMP;',
      'CREATE INDEX idx_users_email ON users (email);',
      'SELECT DISTINCT country FROM customers WHERE country IS NOT NULL;',
      'SELECT category, AVG(price) AS avg_price FROM products GROUP BY category HAVING AVG(price) > 100;',
      'UPDATE accounts SET balance = balance - 50 WHERE id = 7;',
    ],
    hard: [
      'SELECT id, ROW_NUMBER() OVER (PARTITION BY team ORDER BY score DESC) AS rank FROM players;',
      'SELECT u.id, COALESCE(SUM(o.total), 0) AS spend FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.id;',
      'CREATE UNIQUE INDEX CONCURRENTLY idx_orders_ref ON orders (reference) WHERE deleted_at IS NULL;',
      "SELECT * FROM events WHERE payload->>'type' = 'click' AND created_at >= CURRENT_DATE - 7;",
      "BEGIN; UPDATE stock SET qty = qty - 1 WHERE sku = 'A-100'; COMMIT;",
      'DELETE FROM logs WHERE id IN (SELECT id FROM logs ORDER BY created_at LIMIT 1000);',
    ],
  },
  code: {
    js: {
      easy: [
        'const total = items.length;',
        'console.log("Hello, world!");',
        'let isReady = false;',
        'function add(a, b) { return a + b; }',
        'const user = { name: "Asha", age: 25 };',
        'if (count > 0) { reset(); }',
        'import React from "react";',
        'export const MAX_RETRIES = 3;',
      ],
      medium: [
        'const doubled = numbers.map((n) => n * 2);',
        'const res = await fetch("/api/users");',
        'export default function App() { return <Home />; }',
        'const [count, setCount] = useState(0);',
        'items.filter((item) => item.active).forEach(render);',
        'try { await save(data); } catch (err) { console.error(err); }',
        'const sum = arr.reduce((acc, n) => acc + n, 0);',
      ],
      hard: [
        'const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };',
        'type Result<T> = { ok: true; value: T } | { ok: false; error: Error };',
        'const clean = Object.fromEntries(Object.entries(map).filter(([, v]) => v !== null));',
        'const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);',
        'useEffect(() => { const id = setInterval(tick, 1000); return () => clearInterval(id); }, []);',
        'export const selectUser = (s: RootState) => s.auth?.user ?? null;',
        'const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));',
      ],
    },
    python: {
      easy: [
        'print("Hello, world!")',
        'name = input("Name: ")',
        'for i in range(10):',
        'numbers = [1, 2, 3, 4, 5]',
        'def greet(name): return f"Hi, {name}"',
        'import os',
        'if x > 0: print(x)',
      ],
      medium: [
        'squares = [n ** 2 for n in range(10) if n % 2 == 0]',
        'with open("data.json") as f: data = json.load(f)',
        'def fetch(url: str, retries: int = 3) -> dict:',
        'user = {"id": 1, "tags": ["admin", "dev"]}',
        'from collections import defaultdict',
        'print(f"{name!r} scored {score:.2f}")',
        'if __name__ == "__main__": main()',
      ],
      hard: [
        'ranked = dict(sorted(scores.items(), key=lambda kv: kv[1], reverse=True))',
        '@functools.lru_cache(maxsize=None)',
        'async def main(): await asyncio.gather(*(fetch(u) for u in urls))',
        'matrix = [[row[i] for row in grid] for i in range(len(grid[0]))]',
        'values = sorted(set(items), key=lambda x: (-x.score, x.name))[:10]',
        'class Stack(Generic[T]):',
        'self._items: list[T] = []',
      ],
    },
  },
  prompts: {
    easy: [
      'Explain this function in simple terms.',
      'Write a unit test for this function.',
      'Summarize this error message and suggest a fix.',
      'Convert this code from JavaScript to TypeScript.',
      'Add comments to this code.',
      'Suggest a better variable name for this.',
    ],
    medium: [
      'You are a senior backend engineer. Review this pull request and list the top 3 risks.',
      'Refactor this React component to use hooks and keep the behavior identical.',
      'Write a Python script that reads a CSV file and prints the average of each numeric column.',
      'Explain the time complexity of this algorithm and suggest a faster approach.',
      'Design a REST API for a todo app with endpoints, methods and example responses.',
    ],
    hard: [
      'Act as a code reviewer. Think step by step, point out bugs and security issues, then output the fixed code in a single code block.',
      'Given the schema below, write an optimized PostgreSQL query, explain the indexes it needs, and list two edge cases that could break it.',
      'Return ONLY valid JSON with keys "title", "summary" and "tags". Do not include markdown, comments or any extra text.',
      'You are a staff engineer. Compare REST and GraphQL for a mobile app on a slow network, then give a recommendation in under 150 words.',
      'Write a migration plan to move this Express app to Fastify with zero downtime, listing risks and a rollback step for each stage.',
    ],
  },
  symbols: {
    easy: [
      '() => {}',
      '[0] [1] [2]',
      '<div></div>',
      '$HOME ~/.config /usr/local/bin',
      'a && b || !c',
      'x !== y ? 1 : 0',
      '{ "key": [1, 2, 3] }',
    ],
    medium: [
      '#!/usr/bin/env bash',
      '@media (max-width: 600px) { }',
      '${name} ${PORT:-3000}',
      'a |= b; c &= ~d; e ^= f;',
      'C:\\Users\\dev\\project\\src',
      'const re = /^[\\w.-]+@[\\w.-]+\\.\\w+$/;',
      '<T extends Record<string, unknown>>(x: T) => x',
    ],
    hard: [
      'if (a !== b && (c || !d) && (e ?? f)) { g(); }',
      '$(( (a + b) * c % d ))',
      '^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$',
      "cat *.log | grep -vE '^(#|$)' | sort -u > out.txt",
      'x = a ? b : c ? d : e; y ||= z; w ??= v;',
      '[[ -f "$file" && ! -L "$file" ]] || exit 1',
      'echo "$USER@$HOSTNAME:$PWD" >> ~/.session.log',
    ],
  },
};

export function getCategoryLines(
  category: StandardCategorySlug,
  level: DifficultyLevel,
  language: CodeLanguage = 'js'
): string[] {
  if (category === 'code') {
    return [...content.code[language][level]];
  }
  return [...content[category][level]];
}

export function getAllBankLines(): string[] {
  const all: string[] = [];
  const levels: DifficultyLevel[] = ['easy', 'medium', 'hard'];
  for (const level of levels) {
    all.push(...content.git[level]);
    all.push(...content.terminal[level]);
    all.push(...content.docker[level]);
    all.push(...content.sql[level]);
    all.push(...content.code.js[level]);
    all.push(...content.code.python[level]);
    all.push(...content.prompts[level]);
    all.push(...content.symbols[level]);
  }
  return Array.from(new Set(all));
}

export function getCategoryLineCount(slug: CategorySlug): number {
  if (slug === 'weak-keys') return getAllBankLines().length;
  if (slug === 'code') {
    return (
      content.code.js.easy.length +
      content.code.js.medium.length +
      content.code.js.hard.length +
      content.code.python.easy.length +
      content.code.python.medium.length +
      content.code.python.hard.length
    );
  }
  return (
    content[slug].easy.length +
    content[slug].medium.length +
    content[slug].hard.length
  );
}
