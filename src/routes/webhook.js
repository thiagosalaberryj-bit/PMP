import { Router } from 'express';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import pool from '../config/database.js';

const router = Router();

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

router.post('/mp', async (req, res) => {
  try {
    const { action, data } = req.body;
    const mpPaymentId = data?.id || req.query.id;

    if (!mpPaymentId) {
      return res.status(400).send('Missing payment ID');
    }

    const payment = new Payment(mpClient);
    const mpPayment = await payment.get({ id: mpPaymentId });

    if (mpPayment.status === 'approved') {
      const userId = mpPayment.metadata?.user_id;
      const paymentId = mpPayment.metadata?.payment_id;

      if (paymentId) {
        await pool.query(
          `UPDATE payments
           SET status = 'approved',
               mp_payment_id = ?,
               payer_email = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [mpPayment.id.toString(), mpPayment.payer?.email || null, paymentId]
        );

        console.log(`Payment ${paymentId} approved by user ${mpPayment.payer?.email}`);
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(200).send('OK');
  }
});

export default router;
