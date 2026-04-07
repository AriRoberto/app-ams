import { query } from '../services/db.js';
import { verifyAccessToken } from '../services/tokenService.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Token ausente.' });
    }

    const payload = verifyAccessToken(token);
    const user = await query('SELECT id, nome, email, role FROM users WHERE id = $1', [payload.sub]);

    if (!user.rowCount) {
      return res.status(401).json({ message: 'Usuário inválido.' });
    }

    req.user = user.rows[0];
    return next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}
