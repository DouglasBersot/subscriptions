import express from 'express';
import webpush from 'web-push';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const VAPID_PUBLIC_KEY = 'BEQw0Df6M_OIXw6EzkjGHNzbQ305CiGg4mMn0N1w_K7oPewxQlWta_VFVt-vsasoPieDUX2seTpIIMrhSS2sCOM';
const VAPID_PRIVATE_KEY = 'xBkMusdJcY5CzGRdNNcJbnwCmHpai0INiHPKjBKwCMk';
const CONTACT_EMAIL = 'mailto:douglasbersot18@gmail.com';

webpush.setVapidDetails(CONTACT_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const SUBSCRIPTIONS_URL = 'https://playflixtv.online/api/subscriptions.json';

app.post('/send-push', async (req, res) => {
    const { title, body } = req.body;
    
    let subscriptions;
    try {
        const response = await fetch(SUBSCRIPTIONS_URL);
        subscriptions = await response.json();
    } catch (error) {
        return res.status(500).json({ error: 'Falha ao buscar subscriptions.json' });
    }

    const payload = JSON.stringify({ title, body });

    let success = 0;
    await Promise.all(subscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification(sub, payload);
            success++;
        } catch (err) {
            console.warn('Erro ao enviar para um usuário:', err.statusCode);
        }
    }));

    res.json({ sent: success, total: subscriptions.length });
});

app.listen(process.env.PORT || 3000, () => console.log('Push API rodando'));
