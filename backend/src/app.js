import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import sharp from 'sharp';
import bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { openStore } from './store.js';
import { encrypt, decrypt, sign, safeEqual } from './security.js';
import {
  fabrics,
  options,
  labels,
  defaults,
  metricRanges,
  validMetrics,
  validateConfig,
  estimatePrice,
  statusLabels,
} from './catalog.js';
import { recommendations, caption, nearby, providers } from './adapters.js';
import { editorialById } from '../../shared/editorial.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const now = () => new Date().toISOString();
const fail = (status, message) => Object.assign(new Error(message), { status });
const text = (s, min, max) =>
  typeof s === 'string' && s.trim().length >= min && s.trim().length <= max;
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, demo: !!u.demo });
export function createApp({
  dataDir = process.env.DATA_DIR || path.join(root, 'backend/data'),
  serveFrontend = true,
  httpsOnly = process.env.NODE_ENV === 'production',
} = {}) {
  const app = express(),
    { db, key } = openStore(dataDir);
  app.locals.db = db;
  app.locals.close = () => db.close();
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          // Safari upgrades http://localhost resources when this default is enabled.
          // Local HTTP must remain HTTP; deployed HTTPS retains the upgrade policy.
          upgradeInsecureRequests: httpsOnly ? [] : null,
          workerSrc: ["'self'", 'blob:'],
        },
      },
    })
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/api', (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin) {
      let origin;
      try {
        origin = new URL(req.headers.origin).host;
      } catch {
        return next(fail(403, '无效来源'));
      }
      if (origin !== req.headers.host) return next(fail(403, '不允许跨站提交'));
    }
    next();
  });
  app.use(
    '/api',
    rateLimit({
      windowMs: 60000,
      limit: 300,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: '请求过于频繁，请稍后再试' },
    })
  );
  const authLimiter = rateLimit({
    windowMs: 60000,
    limit: 30,
    legacyHeaders: false,
    message: { error: '登录尝试过多，请稍后再试' },
  });
  app.use('/api', (req, res, next) => {
    const raw = req.cookies.sf_session || '',
      i = raw.lastIndexOf('.');
    if (i > 0) {
      const token = raw.slice(0, i);
      if (safeEqual(sign(token, key), raw.slice(i + 1))) {
        const s = db
          .prepare(
            'SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?'
          )
          .get(token, Date.now());
        if (s) req.user = s;
      }
    }
    next();
  });
  const requireAuth = (req, res, next) =>
    req.user ? next() : next(fail(401, '请先登录或开启演示体验'));
  const login = (res, user) => {
    db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    const token = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(token, user.id, Date.now() + 7200000);
    res.cookie('sf_session', token + '.' + sign(token, key), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 7200000,
      path: '/',
    });
    return publicUser(user);
  };
  const designRow = (r) => (r ? { ...r, config: JSON.parse(r.config), user_id: undefined } : null);
  const getDesign = (id, user) => {
    const r = db.prepare('SELECT * FROM designs WHERE id=? AND user_id=?').get(id, user);
    if (!r) throw fail(404, '设计不存在或无权访问');
    return designRow(r);
  };
  const orderRow = (r) => ({
    ...r,
    user_id: undefined,
    address: JSON.parse(r.address),
    snapshot: JSON.parse(r.snapshot),
    history: db
      .prepare('SELECT status,note,created FROM history WHERE order_id=? ORDER BY id')
      .all(r.id),
    tracking: db
      .prepare('SELECT status,location,created FROM tracking WHERE order_id=? ORDER BY id')
      .all(r.id),
    currency: 'HKD',
  });
  const getOrder = (id, user) => {
    const r = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(id, user);
    if (!r) throw fail(404, '订单不存在或无权访问');
    return orderRow(r);
  };
  const transaction = (fn) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      db.exec('COMMIT');
      return result;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  };
  const postRow = (r, user) => ({
    ...r,
    user_id: undefined,
    config: JSON.parse(r.config),
    imageUrl: r.image_url,
    ...(r.user_id === 'seed' && editorialById[r.id]
      ? {
          editorial: true,
          credit: editorialById[r.id].credit,
          captionEn: editorialById[r.id].captionEn,
          title: editorialById[r.id].title,
          kicker: editorialById[r.id].kicker,
        }
      : {}),
    author: db.prepare('SELECT name FROM users WHERE id=?').get(r.user_id)?.name || 'SmartFit 用户',
    likes: db.prepare('SELECT count(*) n FROM likes WHERE post_id=?').get(r.id).n,
    liked: !!db.prepare('SELECT 1 FROM likes WHERE post_id=? AND user_id=?').get(r.id, user || ''),
    commentCount: db.prepare('SELECT count(*) n FROM comments WHERE post_id=?').get(r.id).n,
  });
  const requirePost = (id) => {
    const p = db.prepare('SELECT * FROM posts WHERE id=?').get(id);
    if (!p) throw fail(404, '帖子不存在');
    return p;
  };
  const configFrom = (body) => {
    const err = validateConfig(body?.config);
    if (err) throw fail(400, err);
    return Object.fromEntries(
      [...Object.keys(options), 'fabricId', 'colorHex'].map((k) => [k, body.config[k]])
    );
  };
  app.get('/api/health', (req, res) =>
    res.json({ ok: true, mode: 'demo', storage: 'sqlite', version: '2.0.1' })
  );
  app.get('/api/catalog', (req, res) =>
    res.json({ fabrics, options, labels, defaults, metricRanges, statusLabels, providers })
  );
  app.get('/api/auth/me', (req, res) => res.json({ user: req.user ? publicUser(req.user) : null }));
  app.post('/api/auth/demo', authLimiter, (req, res) => {
    const user = {
      id: randomUUID(),
      name: '体验设计师',
      email: `demo-${randomUUID()}@smartfit.example`,
      demo: 1,
      created: now(),
    };
    db.prepare('INSERT INTO users(id,name,email,demo,created) VALUES(?,?,?,?,?)').run(
      user.id,
      user.name,
      user.email,
      1,
      user.created
    );
    res.json({ user: login(res, user) });
  });
  app.post('/api/auth/register', authLimiter, async (req, res) => {
    const { name, email, password } = req.body;
    if (
      !text(name, 1, 40) ||
      !text(email, 3, 254) ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      !text(password, 10, 72) ||
      Buffer.byteLength(password) > 72
    )
      throw fail(400, '请输入姓名、有效邮箱和 10–72 字节密码');
    const normalized = email.trim().toLowerCase();
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(normalized))
      throw fail(409, '该邮箱已注册');
    const hash = await bcrypt.hash(password, 10);
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(normalized))
      throw fail(409, '该邮箱已注册');
    const u = { id: randomUUID(), name: name.trim(), email: normalized, demo: 0 };
    db.prepare('INSERT INTO users(id,name,email,password,created) VALUES(?,?,?,?,?)').run(
      u.id,
      u.name,
      u.email,
      hash,
      now()
    );
    res.status(201).json({ user: login(res, u) });
  });
  app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!text(email, 3, 254) || !text(password, 1, 72)) throw fail(401, '邮箱或密码不正确');
    const u = db.prepare('SELECT * FROM users WHERE email=?').get(email.trim().toLowerCase());
    if (!u?.password || !(await bcrypt.compare(password, u.password)))
      throw fail(401, '邮箱或密码不正确');
    res.json({ user: login(res, u) });
  });
  app.post('/api/auth/logout', (req, res) => {
    const token = (req.cookies.sf_session || '').split('.')[0];
    db.prepare('DELETE FROM sessions WHERE token=?').run(token);
    res.clearCookie('sf_session', { path: '/' }).json({ ok: true });
  });
  app.get('/api/designs', requireAuth, (req, res) =>
    res.json({
      designs: db
        .prepare('SELECT * FROM designs WHERE user_id=? ORDER BY created DESC')
        .all(req.user.id)
        .map(designRow),
    })
  );
  app.get('/api/designs/:id', requireAuth, (req, res) =>
    res.json(getDesign(req.params.id, req.user.id))
  );
  app.post('/api/designs', requireAuth, (req, res) => {
    const config = configFrom(req.body),
      name = req.body.name || '我的专属设计';
    if (!text(name, 1, 60)) throw fail(400, '设计名称应为 1–60 字');
    const id = randomUUID();
    db.prepare('INSERT INTO designs(id,user_id,name,config,price,created) VALUES(?,?,?,?,?,?)').run(
      id,
      req.user.id,
      name.trim(),
      JSON.stringify(config),
      estimatePrice(config),
      now()
    );
    res.status(201).json(getDesign(id, req.user.id));
  });
  app.put('/api/designs/:id', requireAuth, (req, res) => {
    getDesign(req.params.id, req.user.id);
    const config = configFrom(req.body);
    if (!text(req.body.name, 1, 60)) throw fail(400, '设计名称应为 1–60 字');
    db.prepare('UPDATE designs SET name=?,config=?,price=?,version=version+1 WHERE id=?').run(
      req.body.name.trim(),
      JSON.stringify(config),
      estimatePrice(config),
      req.params.id
    );
    res.json(getDesign(req.params.id, req.user.id));
  });
  app.delete('/api/designs/:id', requireAuth, (req, res) => {
    getDesign(req.params.id, req.user.id);
    db.prepare('DELETE FROM designs WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  });
  app.get('/api/metrics', requireAuth, (req, res) => {
    const row = db.prepare('SELECT encrypted FROM metrics WHERE user_id=?').get(req.user.id);
    res.json({ metrics: row ? decrypt(row.encrypted, key) : null });
  });
  app.put('/api/metrics', requireAuth, (req, res) => {
    if (req.body.consent !== true) throw fail(400, '请先同意保存身体数据');
    if (!validMetrics(req.body.metrics)) throw fail(400, '身体尺寸需为允许范围内的数字');
    const metrics = Object.fromEntries(
      Object.keys(metricRanges).map((k) => [k, req.body.metrics[k]])
    );
    db.prepare(
      'INSERT INTO metrics VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET encrypted=excluded.encrypted'
    ).run(req.user.id, encrypt(metrics, key));
    res.json({ metrics });
  });
  app.delete('/api/metrics', requireAuth, (req, res) => {
    db.prepare('DELETE FROM metrics WHERE user_id=?').run(req.user.id);
    res.json({ ok: true });
  });
  app.get('/api/homepage-recommendations', (req, res) =>
    res.json(recommendations(req.query.city, req.query.simulateFailure === '1'))
  );
  app.post('/api/captions', requireAuth, (req, res) =>
    res.json(caption(req.body.config, !!req.body.simulateFailure, req.body.locale))
  );
  app.get('/api/partners', (req, res) => {
    const { lat, lon, city } = req.query;
    const geo = lat !== undefined || lon !== undefined;
    if (
      geo &&
      (lat === undefined ||
        lon === undefined ||
        lat === '' ||
        lon === '' ||
        !Number.isFinite(Number(lat)) ||
        !Number.isFinite(Number(lon)) ||
        Math.abs(Number(lat)) > 90 ||
        Math.abs(Number(lon)) > 180)
    )
      throw fail(400, '无效的经纬度');
    res.json(
      nearby({ city, lat: geo ? Number(lat) : undefined, lon: geo ? Number(lon) : undefined })
    );
  });
  const postSearchText = (p) => {
    const config = JSON.parse(p.config),
      edit = editorialById[p.id];
    return [
      p.caption,
      config.fabricId,
      fabrics.find((f) => f.id === config.fabricId)?.name,
      edit?.captionEn,
      edit?.title,
      edit?.kicker,
      db.prepare('SELECT name FROM users WHERE id=?').get(p.user_id)?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  };
  app.get('/api/search', (req, res) => {
    const q = String(req.query.q || '')
      .trim()
      .slice(0, 100)
      .toLowerCase();
    if (!q) return res.json({ source: 'demo', results: [] });
    const all = db.prepare('SELECT * FROM posts ORDER BY created DESC LIMIT 100').all();
    const results = all
      .filter((p) => postSearchText(p).includes(q))
      .slice(0, 12)
      .map((p) => ({
        id: p.id,
        title: p.caption.slice(0, 45),
        type: 'post',
        config: JSON.parse(p.config),
      }));
    res.json({ source: 'demo', results });
  });
  app.get('/api/posts', (req, res) => {
    const q = String(req.query.q || '')
        .trim()
        .toLowerCase()
        .slice(0, 100),
      category = req.query.category;
    let rows = db.prepare('SELECT * FROM posts ORDER BY created DESC LIMIT 200').all();
    if (category && category !== 'all') rows = rows.filter((p) => p.category === category);
    if (q) rows = rows.filter((p) => postSearchText(p).includes(q));
    res.json({ posts: rows.map((p) => postRow(p, req.user?.id)), source: 'demo' });
  });
  app.get('/api/posts/:id', (req, res) => {
    const p = requirePost(req.params.id);
    res.json({
      ...postRow(p, req.user?.id),
      comments: db
        .prepare(
          'SELECT c.id,c.content,c.created,u.name AS author FROM comments c JOIN users u ON c.user_id=u.id WHERE post_id=? ORDER BY c.created'
        )
        .all(p.id),
    });
  });
  app.post('/api/posts', requireAuth, (req, res) => {
    const { caption: content, designId, imageUrl, category = 'daily' } = req.body;
    if (!text(content, 1, 1000) || !['daily', 'work', 'occasion'].includes(category))
      throw fail(400, '请输入 1–1000 字文案并选择有效分类');
    let config = defaults;
    if (designId) config = getDesign(designId, req.user.id).config;
    else if (req.body.config) config = configFrom(req.body);
    if (
      imageUrl &&
      !db.prepare('SELECT 1 FROM uploads WHERE url=? AND user_id=?').get(imageUrl, req.user.id)
    )
      throw fail(400, '请上传属于自己的图片');
    const id = randomUUID();
    db.prepare('INSERT INTO posts VALUES(?,?,?,?,?,?,?)').run(
      id,
      req.user.id,
      content.trim(),
      category,
      JSON.stringify(config),
      imageUrl || null,
      now()
    );
    res.status(201).json(postRow(requirePost(id), req.user.id));
  });
  app.post('/api/posts/:id/like', requireAuth, (req, res) => {
    requirePost(req.params.id);
    const p = req.params.id,
      u = req.user.id;
    const liked = !!db.prepare('SELECT 1 FROM likes WHERE post_id=? AND user_id=?').get(p, u);
    if (liked) db.prepare('DELETE FROM likes WHERE post_id=? AND user_id=?').run(p, u);
    else db.prepare('INSERT INTO likes VALUES(?,?)').run(p, u);
    res.json({
      liked: !liked,
      likes: db.prepare('SELECT count(*) n FROM likes WHERE post_id=?').get(p).n,
    });
  });
  app.post('/api/posts/:id/comments', requireAuth, (req, res) => {
    requirePost(req.params.id);
    if (!text(req.body.content, 1, 500)) throw fail(400, '评论应为 1–500 字');
    const id = randomUUID();
    db.prepare('INSERT INTO comments VALUES(?,?,?,?,?)').run(
      id,
      req.params.id,
      req.user.id,
      req.body.content.trim(),
      now()
    );
    res.status(201).json({ id, content: req.body.content.trim(), author: req.user.name });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) =>
      cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
  });
  app.post('/api/uploads', requireAuth, upload.single('image'), async (req, res) => {
    if (!req.file) throw fail(400, '请选择 JPEG、PNG 或 WebP 图片');
    let buffer;
    try {
      const decoder = sharp(req.file.buffer, { limitInputPixels: 20000000 });
      const meta = await decoder.metadata();
      if (!['jpeg', 'png', 'webp'].includes(meta.format)) throw Error();
      buffer = await decoder
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw fail(400, '图片内容无效或尺寸过大');
    }
    const filename = randomUUID() + '.webp',
      url = '/media/' + filename;
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path.join(dataDir, 'uploads', filename), buffer);
    db.prepare('INSERT INTO uploads VALUES(?,?)').run(url, req.user.id);
    res.status(201).json({ url, source: 'demo' });
  });
  app.use(
    '/media',
    express.static(path.join(dataDir, 'uploads'), {
      dotfiles: 'deny',
      setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
    })
  );
  app.post('/api/orders', requireAuth, (req, res) => {
    const { designId, address, idempotencyKey } = req.body;
    if (
      !address ||
      !text(address.name, 1, 60) ||
      !text(address.phone, 6, 30) ||
      !text(address.line, 5, 250) ||
      !text(idempotencyKey, 1, 100)
    )
      throw fail(400, '请填写完整收货信息');
    const old = db
      .prepare('SELECT * FROM orders WHERE user_id=? AND idempotency_key=?')
      .get(req.user.id, idempotencyKey);
    if (old) return res.json(orderRow(old));
    const d = getDesign(designId, req.user.id),
      id = randomUUID();
    const m = db.prepare('SELECT encrypted FROM metrics WHERE user_id=?').get(req.user.id);
    const snapshot = {
      name: d.name,
      config: d.config,
      price: d.price,
      version: d.version,
      measurementSource: m ? 'consented_profile' : 'standard_reference',
    };
    transaction(() => {
      db.prepare(
        'INSERT INTO orders(id,user_id,design_id,snapshot,amount,address,status,idempotency_key,created) VALUES(?,?,?,?,?,?,?,?,?)'
      ).run(
        id,
        req.user.id,
        d.id,
        JSON.stringify(snapshot),
        estimatePrice(d.config),
        JSON.stringify({
          name: address.name.trim(),
          phone: address.phone.trim(),
          line: address.line.trim(),
        }),
        'pending_payment',
        idempotencyKey,
        now()
      );
      db.prepare('INSERT INTO history(order_id,status,note,created) VALUES(?,?,?,?)').run(
        id,
        'pending_payment',
        '定制订单已创建，等待演示支付',
        now()
      );
    });
    res.status(201).json(getOrder(id, req.user.id));
  });
  app.get('/api/orders', requireAuth, (req, res) =>
    res.json({
      orders: db
        .prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created DESC')
        .all(req.user.id)
        .map(orderRow),
    })
  );
  app.get('/api/orders/:id', requireAuth, (req, res) =>
    res.json(getOrder(req.params.id, req.user.id))
  );
  app.post('/api/orders/:id/pay', requireAuth, (req, res) => {
    const o = getOrder(req.params.id, req.user.id),
      { outcome = 'success', eventId = `demo-${o.id}-${outcome}` } = req.body;
    if (!['success', 'failed'].includes(outcome) || !text(eventId, 1, 120))
      throw fail(400, '无效支付事件');
    const prior = db.prepare('SELECT * FROM payment_events WHERE id=?').get(eventId);
    if (prior) {
      if (prior.order_id !== o.id || prior.outcome !== outcome)
        throw fail(409, '支付事件与当前订单不一致');
      return res.json(o);
    }
    if (o.status !== 'pending_payment') throw fail(409, '当前订单不可支付');
    transaction(() => {
      db.prepare('INSERT INTO payment_events VALUES(?,?,?,?)').run(eventId, o.id, outcome, now());
      if (outcome === 'success') {
        db.prepare('UPDATE orders SET status=? WHERE id=?').run('paid', o.id);
        db.prepare('INSERT INTO history(order_id,status,note,created) VALUES(?,?,?,?)').run(
          o.id,
          'paid',
          '演示支付成功；未产生真实扣款',
          now()
        );
        db.prepare('INSERT INTO notifications(user_id,order_id,text,created) VALUES(?,?,?,?)').run(
          req.user.id,
          o.id,
          '模拟通知：订单付款成功，等待制作。',
          now()
        );
      } else
        db.prepare('INSERT INTO history(order_id,status,note,created) VALUES(?,?,?,?)').run(
          o.id,
          'pending_payment',
          '演示支付失败，可重新尝试',
          now()
        );
    });
    res.json(getOrder(o.id, req.user.id));
  });
  app.post('/api/orders/:id/advance', requireAuth, (req, res) => {
    const o = getOrder(req.params.id, req.user.id),
      next = { paid: 'in_production', in_production: 'shipped', shipped: 'delivered' }[o.status];
    if (!next) throw fail(409, '当前状态无法推进');
    transaction(() => {
      db.prepare('UPDATE orders SET status=? WHERE id=?').run(next, o.id);
      db.prepare('INSERT INTO history(order_id,status,note,created) VALUES(?,?,?,?)').run(
        o.id,
        next,
        '演示操作：' + statusLabels[next],
        now()
      );
      if (next === 'shipped' || next === 'delivered')
        db.prepare('INSERT INTO tracking(order_id,status,location,created) VALUES(?,?,?,?)').run(
          o.id,
          next === 'shipped' ? '包裹已由演示承运商揽收' : '包裹已签收（演示）',
          next === 'shipped' ? '香港 · 制作工坊' : '香港 · 收货地址',
          now()
        );
      db.prepare('INSERT INTO notifications(user_id,order_id,text,created) VALUES(?,?,?,?)').run(
        req.user.id,
        o.id,
        '模拟通知：' + statusLabels[next],
        now()
      );
    });
    res.json(getOrder(o.id, req.user.id));
  });
  app.post('/api/orders/:id/cancel', requireAuth, (req, res) => {
    const o = getOrder(req.params.id, req.user.id);
    if (o.status !== 'pending_payment') throw fail(409, '仅待付款订单可取消');
    transaction(() => {
      db.prepare('UPDATE orders SET status=? WHERE id=?').run('cancelled', o.id);
      db.prepare('INSERT INTO history(order_id,status,note,created) VALUES(?,?,?,?)').run(
        o.id,
        'cancelled',
        '用户取消订单',
        now()
      );
    });
    res.json(getOrder(o.id, req.user.id));
  });
  app.get('/api/notifications', requireAuth, (req, res) =>
    res.json({
      notifications: db
        .prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50')
        .all(req.user.id),
      source: 'demo',
    })
  );
  app.get('/api/account/export', requireAuth, (req, res) => {
    const m = db.prepare('SELECT encrypted FROM metrics WHERE user_id=?').get(req.user.id);
    res.set('Content-Disposition', 'attachment; filename="smartfit-personal-data.json"').json({
      user: publicUser(req.user),
      metrics: m ? decrypt(m.encrypted, key) : null,
      designs: db.prepare('SELECT * FROM designs WHERE user_id=?').all(req.user.id).map(designRow),
      orders: db.prepare('SELECT * FROM orders WHERE user_id=?').all(req.user.id).map(orderRow),
      posts: db
        .prepare('SELECT * FROM posts WHERE user_id=?')
        .all(req.user.id)
        .map((p) => postRow(p, req.user.id)),
      comments: db
        .prepare('SELECT post_id,content,created FROM comments WHERE user_id=?')
        .all(req.user.id),
      likes: db.prepare('SELECT post_id FROM likes WHERE user_id=?').all(req.user.id),
    });
  });
  app.use('/api', (req, res) => res.status(404).json({ error: '接口不存在' }));
  if (serveFrontend && existsSync(path.join(root, 'dist/index.html'))) {
    app.use(express.static(path.join(root, 'dist')));
    app.get('/{*path}', (req, res) => res.sendFile(path.join(root, 'dist/index.html')));
  }
  app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: '图片不能超过 5 MB' });
    const status = err.status || (err instanceof multer.MulterError ? 400 : 500);
    if (status === 500) console.error(err.message);
    res.status(status).json({ error: status === 500 ? '服务暂时不可用，请稍后重试' : err.message });
  });
  return app;
}
