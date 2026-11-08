import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from 'node:crypto';
export const sign = (s, key) => createHmac('sha256', key).update(s).digest('hex');
export function safeEqual(a, b) {
  return (
    typeof a === 'string' &&
    typeof b === 'string' &&
    a.length === b.length &&
    timingSafeEqual(Buffer.from(a), Buffer.from(b))
  );
}
export function encrypt(data, key) {
  const iv = randomBytes(12),
    c = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const v = Buffer.concat([c.update(JSON.stringify(data), 'utf8'), c.final()]);
  return JSON.stringify({
    iv: iv.toString('hex'),
    tag: c.getAuthTag().toString('hex'),
    value: v.toString('hex'),
  });
}
export function decrypt(data, key) {
  const v = JSON.parse(data),
    d = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(v.iv, 'hex'));
  d.setAuthTag(Buffer.from(v.tag, 'hex'));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(v.value, 'hex')), d.final()]).toString());
}
