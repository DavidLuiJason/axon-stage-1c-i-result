/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BuildNode {
  id: string;
  name: string;
  status: 'complete' | 'pending';
  children?: BuildNode[];
}

/**
 * Plain, human-editable nested data structure tracking what's actually
 * built vs. pending across AXON's interfaces.
 *
 * Seeded with status = 'pending' (0%) by default for every single item.
 * Edit this file directly to update interface completion.
 */
export const buildStatusData: BuildNode[] = [
  {
    id: 'main-chat',
    name: 'Main Chat',
    status: 'pending',
    children: [],
  },
  {
    id: 'axon-source',
    name: 'AXON Source',
    status: 'pending',
    children: [],
  },
  {
    id: 'axon-tools',
    name: 'AXON Tools',
    status: 'pending',
    children: [],
  },
  {
    id: 'interface-capture',
    name: 'Interface Capture',
    status: 'pending',
    children: [],
  },
  {
    id: 'settings',
    name: 'Settings',
    status: 'pending',
    children: [],
  },
];

/**
 * Computes completion statistics for a node.
 * If a node has children, progress is dynamically calculated from its children.
 * If a node has no children, its status determines whether it is 0/1 or 1/1.
 */
export function calculateNodeProgress(node: BuildNode): {
  completed: number;
  total: number;
  percent: number;
} {
  if (!node.children || node.children.length === 0) {
    const isDone = node.status === 'complete';
    return {
      completed: isDone ? 1 : 0,
      total: 1,
      percent: isDone ? 100 : 0,
    };
  }

  let completed = 0;
  let total = 0;

  for (const child of node.children) {
    if (child.children && child.children.length > 0) {
      const childProg = calculateNodeProgress(child);
      completed += childProg.completed;
      total += childProg.total;
    } else {
      total += 1;
      if (child.status === 'complete') {
        completed += 1;
      }
    }
  }

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}
