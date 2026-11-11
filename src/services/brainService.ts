export interface BrainGenerateParams {
  type: 'generate_subtasks' | 'summarize_task' | 'write_description' | 'sprint_standup' | 'ask_brain';
  taskTitle?: string;
  taskDescription?: string;
  contextData?: any;
  userPrompt?: string;
}

export interface BrainSubtaskResult {
  title: string;
  estimatedHours: number;
}

export async function requestBrainAI(params: BrainGenerateParams): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const res = await fetch('/api/brain/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn('ClickUp Brain client request error, using fallback:', err);
    // Client-side fallback if network or server issue
    return getClientFallback(params);
  }
}

function getClientFallback(params: BrainGenerateParams) {
  if (params.type === 'generate_subtasks') {
    const title = params.taskTitle || 'Feature';
    return {
      success: true,
      result: [
        { title: `Technical discovery & interface definitions for ${title}`, estimatedHours: 2 },
        { title: `Implement core logic, state management, and edge cases`, estimatedHours: 4 },
        { title: `Write end-to-end integration tests & verify cross-browser compatibility`, estimatedHours: 2 },
        { title: `Deploy to staging environment and request code review`, estimatedHours: 1 },
      ],
    };
  }

  if (params.type === 'write_description') {
    return {
      success: true,
      result: `### Objective\nDeliver a robust, performant implementation of **${params.taskTitle || 'this feature'}** that enhances user velocity.\n\n### User Story\nAs a product user, I want a seamless experience so that I can organize and execute my team's initiatives with zero friction.\n\n### Key Acceptance Criteria\n- [ ] Immediate UI state update with optimistic feedback\n- [ ] Error boundary with fallback retry mechanics\n- [ ] Keyboard accessible navigation\n- [ ] Clean visual hierarchy adhering to ClickUp 3.0 guidelines`,
    };
  }

  if (params.type === 'summarize_task') {
    return {
      success: true,
      result: `• **Core Goal**: Complete ${params.taskTitle || 'this item'} within active sprint parameters.\n• **Status**: Active development in progress; key milestones tracked.\n• **Next Step**: Complete pending acceptance criteria checklist.`,
    };
  }

  if (params.type === 'sprint_standup') {
    return {
      success: true,
      result: `**Yesterday:** Shipped high-priority performance improvements and refined dark mode contrast.\n**Today:** Focus on "${params.taskTitle || 'Sprint goals'}" and completing in-review tickets.\n**Blockers:** None identified. Cross-functional team alignment is on schedule.`,
    };
  }

  return {
    success: true,
    result: `ClickUp Brain analyzed your request for "${params.taskTitle || 'Task'}". All systems operational and on track.`,
  };
}
