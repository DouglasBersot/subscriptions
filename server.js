import express from 'express';
import webpush from 'web-push';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const VAPID_PUBLIC_KEY = 'BOrSJv2UdflHTrqdYwffAE2uX4fgCmS0katvn7Sn1hh9wePoqsWA7kXCQyIOnCP1RT9KFsL8xg4OHZr-OzUjGOk';
const VAPID_PRIVATE_KEY = 'WLBbIyDokZPBFiV5KReGN1HiFDV495MHns4N_T8QryA';
const CONTACT_EMAIL = 'mailto:douglasbersot18@gmail.com';

webpush.setVapidDetails(CONTACT_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const SUBSCRIPTIONS_URL = 'https://playflixtv.online/api/subscriptions_notifications_push/subscriptions.json';

app.post('/send-push', async (req, res) => {
    const { title, body, icon, badge, image, url, actions } = req.body;

    if (!title || !body) {
        return res.status(400).json({ error: 'title e body são obrigatórios' });
    }

    let subscriptions;
    try {
        const response = await fetch(SUBSCRIPTIONS_URL);
        subscriptions = await response.json();
    } catch (error) {
        console.error('Erro ao buscar subscriptions.json:', error);
        return res.status(500).json({ error: 'Falha ao buscar subscriptions.json' });
    }

    if (!Array.isArray(subscriptions)) {
        return res.status(500).json({ error: 'Formato inválido do subscriptions.json' });
    }

    const payload = JSON.stringify({ title, body, icon, badge, image, url, actions });

    let success = 0;
    const results = [];

    await Promise.all(subscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification(sub, payload);
            success++;
            results.push({ endpoint: sub.endpoint, status: 'ok' });
        } catch (err) {
            console.warn('Erro ao enviar para um usuário:', err.statusCode, err.body || '');
            results.push({ endpoint: sub.endpoint, status: 'fail', code: err.statusCode });
        }
    }));

    res.json({ sent: success, total: subscriptions.length, details: results });
});

app.listen(process.env.PORT || 3000, () => console.log('Push API rodando'));
