import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { query } from '../services/db.js';
import { generateAccessToken, generateRefreshToken, revokeRefreshToken, verifyRefreshToken } from '../services/tokenService.js';
import { isValidCpf, normalizeCpf } from '../utils/cpf.js';
import { sendVerificationEmail } from '../services/emailService.js';

export async function loginController(req, res, next) {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rowCount) return res.status(401).json({ message: 'Credenciais inválidas.' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ message: 'Credenciais inválidas.' });
    if (!user.email_verified) return res.status(403).json({ message: 'E-mail não confirmado. Verifique sua caixa de entrada.' });

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

export async function registerController(req, res, next) {
  try {
    const nome = String(req.body?.nome || '').trim();
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    const cpfRaw = String(req.body?.cpf || '');
    const cpf = normalizeCpf(cpfRaw);

    if (!nome || !email || !password || !cpf) {
      return res.status(400).json({ message: 'Nome, e-mail, senha e CPF são obrigatórios.' });
    }

    if (!isValidCpf(cpf)) {
      return res.status(400).json({ message: 'CPF inválido.' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1 OR cpf = $2', [email, cpf]);
    if (existing.rowCount) {
      return res.status(409).json({ message: 'E-mail ou CPF já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = randomUUID();

    await query(
      `INSERT INTO users (
         id, nome, email, cpf, role, password_hash,
         email_verified, email_verification_token, email_verification_sent_at
       ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, NOW())`,
      [randomUUID(), nome, email, cpf, 'cidadao', passwordHash, verificationToken]
    );

    try {
      await sendVerificationEmail({ to: email, name: nome, token: verificationToken });
    } catch (sendError) {
      // eslint-disable-next-line no-console
      console.error('[auth] erro ao enviar e-mail de confirmação', sendError);
      return res.status(201).json({
        success: true,
        message: 'Cadastro realizado. Não foi possível enviar o e-mail de confirmação, tente novamente mais tarde.'
      });
    }

    return res.status(201).json({ success: true, message: 'Cadastro realizado. Verifique seu e-mail para confirmar a conta.' });
  } catch (error) {
    return next(error);
  }
}

export async function confirmEmailController(req, res, next) {
  try {
    const token = String(req.query?.token || req.body?.token || '').trim();
    if (!token) return res.status(400).json({ message: 'Token de confirmação é obrigatório.' });

    const result = await query('SELECT id FROM users WHERE email_verification_token = $1', [token]);
    if (!result.rowCount) {
      return res.status(400).json({ message: 'Token de confirmação inválido ou expirado.' });
    }

    await query(
      `UPDATE users
       SET email_verified = TRUE,
           email_confirmed_at = NOW(),
           email_verification_token = NULL,
           email_verification_sent_at = NULL
       WHERE id = $1`,
      [result.rows[0].id]
    );

    return res.json({ success: true, message: 'E-mail confirmado com sucesso. Agora você pode fazer login.' });
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
