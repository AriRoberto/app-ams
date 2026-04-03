import bcrypt from 'bcryptjs';
import { query } from '../services/db.js';
import { generateAccessToken, generateRefreshToken, revokeRefreshToken, verifyRefreshToken } from '../services/tokenService.js';

export async function loginController(req, res, next) {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rowCount) return res.status(401).json({ message: 'Credenciais inválidas.' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ message: 'Credenciais inválidas.' });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role }
    });
  } catch (error) {
    return next(error);
  }
}

export async function refreshController(req, res, next) {
  try {
    const refreshToken = String(req.body?.refreshToken || '');
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken é obrigatório.' });

    const payload = await verifyRefreshToken(refreshToken);
    const result = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    if (!result.rowCount) return res.status(401).json({ message: 'Usuário inválido.' });

    await revokeRefreshToken(refreshToken);

    const user = result.rows[0];
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Refresh token inválido.' });
  }
}

export async function logoutController(req, res, next) {
  try {
    const refreshToken = String(req.body?.refreshToken || '');
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken é obrigatório.' });

    await revokeRefreshToken(refreshToken);
    return res.json({ success: true, message: 'Logout realizado com sucesso.' });
  } catch (error) {
    return next(error);
  }
}
