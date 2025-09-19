import { Router } from 'express';
import { Request, Response } from 'express';
import { AIService } from '../services/aiService';

const router = Router();

// Stream research analysis endpoint
router.post('/stream-analysis', async (req: Request, res: Response) => {
  try {
    const { topic, provider = 'anthropic' } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required and must be a string' });
    }

    if (!['openai', 'anthropic'].includes(provider)) {
      return res.status(400).json({ error: 'Provider must be either "openai" or "anthropic"' });
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const stream = await AIService.streamResearchAnalysis(topic, provider);

    for await (const partialObject of stream.partialObjectStream) {
      res.write(`data: ${JSON.stringify(partialObject)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Error in stream analysis:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate analysis' })}\n\n`);
    res.end();
  }
});

// Generate research plan endpoint
router.post('/research-plan', async (req: Request, res: Response) => {
  try {
    const { topic, provider = 'anthropic' } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required and must be a string' });
    }

    if (!['openai', 'anthropic'].includes(provider)) {
      return res.status(400).json({ error: 'Provider must be either "openai" or "anthropic"' });
    }

    const plan = await AIService.generateResearchPlan(topic, provider);

    res.json({
      topic,
      provider,
      plan,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating research plan:', error);
    res.status(500).json({ error: 'Failed to generate research plan' });
  }
});

// Generate keywords endpoint
router.post('/keywords', async (req: Request, res: Response) => {
  try {
    const { topic, articles = [], provider = 'anthropic' } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required and must be a string' });
    }

    if (!['openai', 'anthropic'].includes(provider)) {
      return res.status(400).json({ error: 'Provider must be either "openai" or "anthropic"' });
    }

    const keywords = await AIService.generateKeywords(topic, articles, provider);

    res.json({
      topic,
      provider,
      keywords,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating keywords:', error);
    res.status(500).json({ error: 'Failed to generate keywords' });
  }
});

export default router;