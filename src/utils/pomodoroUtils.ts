/** Remove a task's completed pomodoro count and persist. */
export function withoutTaskPomodoroCount(
  counts: Record<string, number>,
  taskId: string
): Record<string, number> {
  if (!counts[taskId]) return counts;
  const { [taskId]: _, ...rest } = counts;
  localStorage.setItem('pomodoroCounts', JSON.stringify(rest));
  return rest;
}
