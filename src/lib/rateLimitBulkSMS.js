/**
 * Rate-limited batch processor for bulk SMS
 * Processes items in batches with configurable concurrency
 */
export async function processBatchWithConcurrency(items, processor, batchSize = 5) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}