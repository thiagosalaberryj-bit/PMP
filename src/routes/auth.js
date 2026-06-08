import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hash]
    );

    const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: result.insertId, name, email, mp_connected: false },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, password, mp_access_token FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mp_connected: !!user.mp_access_token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, mp_access_token FROM users WHERE id = ?',
      [req.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = rows[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      mp_connected: !!user.mp_access_token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/mp-oauth-url', authMiddleware, async (req, res) => {
  try {
    const state = jwt.sign(
      { userId: req.userId, type: 'oauth_state' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    const redirectUri = `${process.env.BASE_URL}/api/auth/mp-oauth/callback`;
    const url = `https://auth.mercadopago.com.ar/authorization?client_id=${process.env.MP_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: 'Error al generar URL de OAuth' });
  }
});

router.get('/mp-oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(`${process.env.BASE_URL}/?mp_error=invalid_params`);
    }

    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_secret: process.env.MP_CLIENT_SECRET,
        client_id: process.env.MP_CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.BASE_URL}/api/auth/mp-oauth/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('MP OAuth error:', tokenData);
      return res.redirect(`${process.env.BASE_URL}/?mp_error=token_exchange_failed`);
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 15552000) * 1000);

    await pool.query(
      `UPDATE users SET mp_user_id = ?, mp_access_token = ?, mp_refresh_token = ?, mp_token_expires_at = ? WHERE id = ?`,
      [
        tokenData.user_id?.toString() || null,
        tokenData.access_token,
        tokenData.refresh_token || null,
        expiresAt,
        userId,
      ]
    );

    res.redirect(`${process.env.BASE_URL}/?mp_connected=true`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.BASE_URL}/?mp_error=server_error`);
  }
});

export default router;
