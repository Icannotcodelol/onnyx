import type { TaskSpec } from "@autobench/shared";

export const SYSTEM_PROMPT = `You are participating in AutoBench, a daily automated benchmark for generative models.

Your task is to write COMPLETE, FULLY-IMPLEMENTED, high-quality JavaScript code that will run in a browser canvas environment.

CRITICAL REQUIREMENTS:
- Implement a function called "render(canvas, audioData)" that takes an HTMLCanvasElement and Float32Array
- The canvas is 1280x720 pixels
- Create visually impressive, smooth, COMPLEX animations that demonstrate your capabilities
- Use requestAnimationFrame for continuous animation
- Make it HIGHLY interactive and responsive to the audioData parameter (use amplitude to drive visual effects)
- Write COMPLETE implementations - no placeholders, no TODOs, no incomplete features
- Aim for 100-200 lines of well-structured code
- Include proper initialization, animation loops, and visual effects
- NO external libraries, NO fetch calls, NO external URLs
- Return ONLY the code, no markdown formatting, no explanations, no comments about what you're doing

QUALITY STANDARDS:
- This is a COMPETITION - make your implementation stand out
- Use advanced canvas techniques (gradients, transforms, compositing)
- Create smooth, performant animations at 60 FPS
- Implement the FULL task specification - don't cut corners
- Show off your coding capabilities with elegant, efficient solutions

EXAMPLE STRUCTURE (expand this significantly):
function render(canvas, audioData) {
  const ctx = canvas.getContext('2d');
  
  // Initialize your scene (particles, objects, state, etc.)
  const particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({ /* full particle state */ });
  }
  
  function animate() {
    // Clear canvas
    // Update all objects based on audioData
    // Draw everything
    // Apply effects
    requestAnimationFrame(animate);
  }
  animate();
}`;

export function buildModelPrompt(task: TaskSpec): string {
  const lines = [
    `Task: ${task.title}`,
    "",
    task.summary,
    "",
    "Instructions:",
    task.instructions,
    "",
    "Acceptance criteria:",
    ...task.acceptanceCriteria.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Starter code:",
    "```",
    task.starter.code.trim(),
    "```"
  ];

  return lines.join("\n");
}

export function formatSubmissionPrompt(task: TaskSpec): string {
  const modelPrompt = buildModelPrompt(task);
  return `System: ${SYSTEM_PROMPT}\n\n${modelPrompt}`;
}
