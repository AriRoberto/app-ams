import bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { query } from '../services/db.js';
import { generateAccessToken, generateRefreshToken, revokeRefreshToken, verifyRefreshToken } from '../services/tokenService.js';
import { sendInstitutionalEmail } from '../services/emailTransport.js';
import { validateRegistrationPayload } from '../utils/validators.js';

function hashVerificationToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function verificationExpiry(hours = 24) {
  return new Date(Date.now() + hours * 3600000);
}

async function sendVerificationEmail({ email, nome, token }) {
  const appUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3340';
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

  await sendInstitutionalEmail({
    to: email,
    subject: 'Confirmação de cadastro - Serviços Urbanos',
    text: `Olá ${nome}, confirme seu e-mail acessando: ${verifyUrl}`,
    html: `<p>Olá <strong>${nome}</strong>,</p><p>Confirme seu e-mail clicando no link abaixo:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>Se você não solicitou cadastro, ignore esta mensagem.</p>`
  });
}

export async function registerController(req, res, next) {
  try {
    const validation = validateRegistrationPayload(req.body || {});
    if (!validation.isValid) return res.status(400).json({ message: 'Dados inválidos.', errors: validation.errors });

    const { nome, email, cpf, password, role } = validation.data;
    const alreadyExists = await query(
      `SELECT id FROM users
       WHERE email = $1 OR cpf = $2
       LIMIT 1`,
      [email, cpf]
    );

    if (alreadyExists.rowCount) {
      return res.status(409).json({ message: 'Já existe usuário com este email ou CPF.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString('hex');

    const created = await query(
      `INSERT INTO users (
        id, nome, email, cpf, role, password_hash, email_verification_token_hash, email_verification_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nome, email, cpf, role, email_verified_at`,
      [
        randomUUID(),
        nome,
        email,
        cpf,
        role,
        passwordHash,
        hashVerificationToken(verificationToken),
        verificationExpiry(24)
      ]
    );

    try {
      await sendVerificationEmail({ email, nome, token: verificationToken });
    } catch (mailError) {
      // fallback amigável para ambiente local sem SMTP configurado
      return res.status(201).json({
        message: 'Cadastro realizado, porém o envio de e-mail falhou neste ambiente.',
        user: created.rows[0],
        verificationToken
      });
    }

    return res.status(201).json({
      message: 'Cadastro realizado. Confirme o e-mail para concluir a ativação.',
      user: created.rows[0]
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyEmailController(req, res, next) {
  try {
    const token = String(req.body?.token || req.query?.token || '').trim();
    if (!token) return res.status(400).json({ message: 'token é obrigatório.' });

    const result = await query(
      `UPDATE users
       SET email_verified_at = NOW(),
           email_verification_token_hash = NULL,
           email_verification_expires_at = NULL
       WHERE email_verification_token_hash = $1
         AND email_verification_expires_at > NOW()
         AND email_verified_at IS NULL
       RETURNING id, nome, email, role, email_verified_at`,
      [hashVerificationToken(token)]
    );

    if (!result.rowCount) {
      return res.status(400).json({ message: 'Token inválido, expirado ou já utilizado.' });
    }

    return res.json({ success: true, message: 'E-mail confirmado com sucesso.', user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function loginController(req, res, next) {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rowCount) return res.status(401).json({ message: 'Credenciais inválidas.' });

    const user = result.rows[0];
    if (!user.email_verified_at) {
      return res.status(403).json({ message: 'E-mail ainda não confirmado. Verifique sua caixa de entrada.' });
    }
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
