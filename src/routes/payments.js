import { Router } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import authMiddleware from '../middleware/auth.js';
import pool from '../config/database.js';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { transaction_amount, description } = req.body;

    if (!transaction_amount || !description) {
      return res.status(400).json({ error: 'Monto y descripción requeridos' });
    }
    if (Number(transaction_amount) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    const [users] = await pool.query(
      'SELECT mp_access_token FROM users WHERE id = ?',
      [req.userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userToken = users[0].mp_access_token;
    if (!userToken) {
      return res.status(400).json({
        error: 'Primero conecta tu cuenta de Mercado Pago',
        need_mp_connect: true,
      });
    }

    const [result] = await pool.query(
      'INSERT INTO payments (user_id, transaction_amount, description, status) VALUES (?, ?, ?, ?)',
      [req.userId, transaction_amount, description, 'pending']
    );
    const paymentId = result.insertId;

    const mpClient = new MercadoPagoConfig({ accessToken: userToken });
    const preference = new Preference(mpClient);
    const mpResponse = await preference.create({
      body: {
        items: [
          {
            title: description,
            quantity: 1,
            unit_price: Number(transaction_amount),
            currency_id: 'ARS',
          },
        ],
        notification_url: `${process.env.BASE_URL}/api/webhook/mp`,
        auto_return: 'approved',
        back_urls: {
          success: `${process.env.BASE_URL}/?payment=${paymentId}`,
          failure: `${process.env.BASE_URL}/?payment=${paymentId}`,
          pending: `${process.env.BASE_URL}/?payment=${paymentId}`,
        },
      },
    });

    await pool.query(
      'UPDATE payments SET preference_id = ?, init_point = ? WHERE id = ?',
      [mpResponse.id, mpResponse.init_point, paymentId]
    );

    res.status(201).json({
      id: paymentId,
      init_point: mpResponse.init_point,
      preference_id: mpResponse.id,
    });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: 'Error al crear el pago en Mercado Pago' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(payments);
  } catch (err) {
    console.error('List payments error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (payments.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    res.json(payments[0]);
  } catch (err) {
    console.error('Get payment error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
