import { KnapsackItem, KnapsackResult } from "../types";

/**
 * 0/1 Knapsack Problem Solver using Dynamic Programming
 *
 * Given a set of items, each with a weight and value, select the maximum
 * value subset such that total weight does not exceed capacity.
 *
 * Time Complexity: O(n × W) where W is the scaled capacity
 * Space Complexity: O(n × W) for the DP table
 */
class KnapsackSolver {
  /**
   * Solves the 0/1 knapsack problem and returns selected item indices and solution details
   *
   * @param items - Array of items with weight and value
   * @param capacity - Maximum weight capacity
   * @returns Object containing selected indices, total value, and total weight
   */
  solve(items: KnapsackItem[], capacity: number): KnapsackResult {
    if (items.length === 0 || capacity <= 0) {
      return {
        selectedIndices: [],
        totalValue: 0,
        totalWeight: 0,
      };
    }

    const n = items.length;

    // Scale capacity and weights by 10 to handle decimals (e.g., 1.5 hours)
    // This preserves 0.1 (0.5 hour) precision
    const scaledCapacity = Math.floor(capacity * 10);

    // Initialize DP table: dp[i][w] represents max value using first i items with capacity w
    const dp: number[][] = Array(n + 1)
      .fill(null)
      .map(() => Array(scaledCapacity + 1).fill(0));

    // Fill the DP table
    for (let i = 1; i <= n; i++) {
      const scaledWeight = Math.round(items[i - 1].weight * 10);
      const value = items[i - 1].value;

      for (let w = 0; w <= scaledCapacity; w++) {
        // Option 1: Don't take item i-1
        dp[i][w] = dp[i - 1][w];

        // Option 2: Take item i-1 (if it fits)
        if (scaledWeight <= w) {
          dp[i][w] = Math.max(
            dp[i][w],
            dp[i - 1][w - scaledWeight] + value
          );
        }
      }
    }

    // Backtrack to find which items were selected
    const selectedIndices: number[] = [];
    let w = scaledCapacity;

    for (let i = n; i > 0 && w > 0; i--) {
      // If value comes from taking item i-1
      if (dp[i][w] !== dp[i - 1][w]) {
        selectedIndices.push(i - 1);
        const scaledWeight = Math.round(items[i - 1].weight * 10);
        w -= scaledWeight;
      }
    }

    // Reverse to get correct order
    selectedIndices.reverse();

    // Calculate total weight and value
    let totalWeight = 0;
    let totalValue = 0;
    for (const idx of selectedIndices) {
      totalWeight += items[idx].weight;
      totalValue += items[idx].value;
    }

    return {
      selectedIndices,
      totalValue,
      totalWeight,
    };
  }

  /**
   * Solves knapsack for multiple independent problems (one per depot)
   * Useful for processing multiple depots in parallel
   *
   * @param problems - Array of { items, capacity } tuples
   * @returns Array of KnapsackResult, one per problem
   */
  solveMultiple(
    problems: Array<{ items: KnapsackItem[]; capacity: number }>
  ): KnapsackResult[] {
    return problems.map((problem) => this.solve(problem.items, problem.capacity));
  }
}

export const knapsackSolver = new KnapsackSolver();
