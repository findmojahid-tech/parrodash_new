import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini client if valid key is present
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10) {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
    }
  }

  // ClickUp Brain AI API Endpoint
  app.post('/api/brain/generate', async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, taskTitle, taskDescription, contextData, userPrompt } = req.body;

      if (!ai) {
        // High quality contextual fallback if Gemini API Key is not set in environment yet
        handleFallbackBrain(type, taskTitle, taskDescription, contextData, userPrompt, res);
        return;
      }

      let prompt = '';
      let systemInstruction = 'You are ClickUp Brain, the intelligent AI work assistant built into ClickUp. Provide crisp, high-velocity, structured output suitable for modern engineering and product teams.';

      if (type === 'generate_subtasks') {
        prompt = `Generate 4 to 6 specific, actionable subtasks for this task:
Task Title: "${taskTitle || 'Untitled Task'}"
Task Description: "${taskDescription || 'No description provided'}"

Return ONLY a valid JSON array of objects with the structure:
[
  { "title": "Subtask title", "estimatedHours": 2 },
  ...
]`;
      } else if (type === 'summarize_task') {
        prompt = `Summarize the state and goals of this task in 2-3 concise bullet points:
Task: ${taskTitle}
Details: ${taskDescription}
Context: ${JSON.stringify(contextData || {})}`;
      } else if (type === 'write_description') {
        prompt = `Write a professional user story and specification for a task titled "${taskTitle}".
Include:
- User Story (As a... I want... So that...)
- Acceptance Criteria (3-4 checklist items)
- Technical Notes & Edge Cases`;
      } else if (type === 'sprint_standup') {
        prompt = `Based on these workspace tasks: ${JSON.stringify(contextData || [])}, write a clean 3-part daily standup update:
- What was completed recently
- What is currently in progress / planned for today
- Blockers or items needing review`;
      } else {
        prompt = `User prompt: ${userPrompt || 'Help with project planning'}. Context: Task "${taskTitle}".`;
      }

      // Safe timeout wrapper (5 seconds)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), 5000)
      );

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const response: any = await Promise.race([generatePromise, timeoutPromise]);

      const text = response.text || '';

      if (type === 'generate_subtasks') {
        // Parse JSON array if returned
        try {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          res.json({ success: true, result: parsed });
          return;
        } catch {
          // If not strict JSON, parse lines
          const lines = text.split('\n')
            .map((l: string) => l.replace(/^[-*•\d.]+\s*/, '').trim())
            .filter((l: string) => l.length > 0 && !l.startsWith('[') && !l.startsWith(']'));
          res.json({
            success: true,
            result: lines.slice(0, 6).map((title: string) => ({ title, estimatedHours: 2 }))
          });
          return;
        }
      }

      res.json({ success: true, result: text });
    } catch (err: any) {
      console.error('ClickUp Brain AI error:', err);
      // Fallback gracefully on any API error
      const { type, taskTitle, taskDescription, contextData, userPrompt } = req.body;
      handleFallbackBrain(type, taskTitle, taskDescription, contextData, userPrompt, res);
    }
  });

  function handleFallbackBrain(
    type: string,
    taskTitle: string,
    taskDescription: string,
    contextData: any,
    userPrompt: string,
    res: Response
  ): void {
    if (type === 'generate_subtasks') {
      const titleLower = (taskTitle || '').toLowerCase();
      let subtasks = [
        { title: `Define specifications & technical architecture for ${taskTitle || 'feature'}`, estimatedHours: 2 },
        { title: `Implement core logic and UI interaction flows`, estimatedHours: 4 },
        { title: `Write unit and integration test coverage`, estimatedHours: 2 },
        { title: `Conduct peer code review and QA verification`, estimatedHours: 1 },
      ];

      if (titleLower.includes('auth') || titleLower.includes('login') || titleLower.includes('signup')) {
        subtasks = [
          { title: 'Create secure token session management and cookies', estimatedHours: 3 },
          { title: 'Design OAuth provider redirect and callback handling', estimatedHours: 3 },
          { title: 'Build responsive modal login & password reset UI', estimatedHours: 2 },
          { title: 'Add rate-limiting and audit log instrumentation', estimatedHours: 2 },
        ];
      } else if (titleLower.includes('api') || titleLower.includes('backend') || titleLower.includes('database')) {
        subtasks = [
          { title: 'Design DB schema indices and migration scripts', estimatedHours: 3 },
          { title: 'Implement REST/GraphQL endpoint handlers with validation', estimatedHours: 4 },
          { title: 'Configure cache layer and benchmark query performance', estimatedHours: 2 },
          { title: 'Update OpenAPI documentation and Postman collections', estimatedHours: 1 },
        ];
      }

      res.json({ success: true, result: subtasks, fallback: true });
      return;
    }

    if (type === 'write_description') {
      res.json({
        success: true,
        fallback: true,
        result: `### Overview\nAs a product team member, I want to deliver **${taskTitle || 'this feature'}** so that users experience streamlined workflows and higher productivity.\n\n### Acceptance Criteria\n- [ ] Core workflow passes end-to-end user verification\n- [ ] Responsive states verified across desktop and mobile screens\n- [ ] Edge cases (network timeouts, empty data) handled gracefully\n- [ ] Metrics and performance benchmarks met\n\n### Technical Architecture\n- Maintain clean separation of concerns and type-safe contracts.\n- Follow ClickUp 3.0 visual design system standards.`
      });
      return;
    }

    if (type === 'summarize_task') {
      res.json({
        success: true,
        fallback: true,
        result: `• **Goal**: Deliver "${taskTitle || 'Feature'}" on schedule.\n• **Current State**: Active in sprint cycle; technical prerequisites met.\n• **Next Action**: Complete pending subtasks and finalize QA checks.`
      });
      return;
    }

    if (type === 'sprint_standup') {
      res.json({
        success: true,
        fallback: true,
        result: `**Yesterday:** Completed 3 core tickets including layout refinement and schema validation.\n**Today:** Focusing on "${taskTitle || 'Sprint priorities'}" and real-time state synchronization.\n**Blockers:** None currently; waiting on design asset sign-off for secondary view.`
      });
      return;
    }

    res.json({
      success: true,
      fallback: true,
      result: `ClickUp Brain analysis complete for "${taskTitle || 'Task'}". All dependencies are mapped and ready for execution.`
    });
  }

  // Vite integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClickUp WorkOS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});
