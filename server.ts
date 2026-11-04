import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { authRouter } from './server/routes/auth.ts';
import { smsRouter } from './server/routes/sms.ts';
import { campaignsRouter } from './server/routes/campaigns.ts';
import { contactsRouter } from './server/routes/contacts.ts';
import { walletRouter } from './server/routes/wallet.ts';
import { senderIdsRouter } from './server/routes/senderIds.ts';
import { notificationsRouter } from './server/routes/notifications.ts';
import { adminRouter } from './server/routes/admin.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Route registrations
  app.use('/api/auth', authRouter);
  app.use('/api/sms', smsRouter);
  app.use('/api/campaigns', campaignsRouter);
  app.use('/api/contacts', contactsRouter);
  app.use('/api/wallet', walletRouter);
  app.use('/api/sender-ids', senderIdsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/admin', adminRouter);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      platform: 'ICON SEND UG',
      operator: 'The Eagle Icon Developers UG',
      time: new Date().toISOString(),
    });
  });

  if (!isProd) {
    // Mount Vite dev server in development
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ICON SEND UG] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting ICON SEND UG server:', err);
  process.exit(1);
});
