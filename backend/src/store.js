import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { defaults } from './catalog.js';
export function openStore(dataDir) {
  mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });
  const secretPath = path.join(dataDir, 'secret.key');
  let key = process.env.DATA_ENCRYPTION_KEY;
  if (!key) {
    if (!existsSync(secretPath))
      writeFileSync(secretPath, randomBytes(32).toString('hex'), { mode: 0o600 });
    key = readFileSync(secretPath, 'utf8').trim();
  }
  if (!/^[a-f0-9]{64}$/i.test(key)) throw Error('DATA_ENCRYPTION_KEY 应为 64 位十六进制字符串');
  const db = new DatabaseSync(path.join(dataDir, 'smartfit.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE,password TEXT,demo INTEGER DEFAULT 0,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS metrics(user_id TEXT PRIMARY KEY REFERENCES users(id),encrypted TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS designs(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),name TEXT NOT NULL,config TEXT NOT NULL,price INTEGER NOT NULL,version INTEGER DEFAULT 1,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),design_id TEXT,snapshot TEXT NOT NULL,amount INTEGER NOT NULL,address TEXT NOT NULL,status TEXT NOT NULL,idempotency_key TEXT NOT NULL,created TEXT NOT NULL,UNIQUE(user_id,idempotency_key));
 CREATE TABLE IF NOT EXISTS payment_events(id TEXT PRIMARY KEY,order_id TEXT REFERENCES orders(id),outcome TEXT NOT NULL,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY,order_id TEXT REFERENCES orders(id),status TEXT NOT NULL,note TEXT,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS tracking(id INTEGER PRIMARY KEY,order_id TEXT REFERENCES orders(id),status TEXT,location TEXT,created TEXT);
 CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),caption TEXT NOT NULL,category TEXT NOT NULL,config TEXT NOT NULL,image_url TEXT,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS likes(post_id TEXT REFERENCES posts(id),user_id TEXT REFERENCES users(id),PRIMARY KEY(post_id,user_id));
 CREATE TABLE IF NOT EXISTS comments(id TEXT PRIMARY KEY,post_id TEXT REFERENCES posts(id),user_id TEXT REFERENCES users(id),content TEXT NOT NULL,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS uploads(url TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id));
 CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY,user_id TEXT REFERENCES users(id),order_id TEXT,text TEXT NOT NULL,created TEXT NOT NULL);
 `);
  if (!db.prepare('SELECT id FROM users WHERE id=?').get('seed')) {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO users(id,name,email,created) VALUES(?,?,?,?)').run(
      'seed',
      'SmartFit 编辑部',
      'editor@smartfit.example',
      now
    );
    const posts = [
      [
        'seed-1',
        '把周末穿成喜欢的样子。鼠尾草绿与天然亚麻，是我给自己的小小留白。',
        'daily',
        { ...defaults },
      ],
      [
        'seed-2',
        '周一的好状态，从一件合身的丝质上装开始。',
        'work',
        {
          ...defaults,
          garmentType: 'top',
          length: 'short',
          fabricId: 'silk',
          colorHex: '#D8B4A6',
          silhouette: 'straight',
          collar: 'v-neck',
        },
      ],
      [
        'seed-3',
        '日落之前，赴一场属于自己的约会。',
        'occasion',
        {
          ...defaults,
          fabricId: 'silk',
          colorHex: '#73566D',
          length: 'maxi',
          sleeve: 'sleeveless',
          collar: 'square',
        },
      ],
      [
        'seed-4',
        '柔软有机棉，让每一次出门都轻一点。',
        'daily',
        { ...defaults, fabricId: 'cotton', colorHex: '#B7C5D3', sleeve: 'long' },
      ],
    ];
    for (const [id, caption, category, config] of posts)
      db.prepare('INSERT INTO posts VALUES(?,?,?,?,?,?,?)').run(
        id,
        'seed',
        caption,
        category,
        JSON.stringify(config),
        null,
        now
      );
  }
  return { db, key };
}
