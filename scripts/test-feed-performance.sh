#!/bin/bash

# Run performance tests
echo "Running Feed Cache Manager Performance Tests..."
jest src/feed/test/performance/feed-cache-manager.perf.spec.ts --verbose

echo "Running Feed Fallback Performance Tests..."
jest src/feed/test/performance/feed-fallback.perf.spec.ts --verbose

echo "Running Feed Recovery Tests..."
jest src/feed/test/recovery/feed-recovery.spec.ts --verbose

# Check test results
if [ $? -eq 0 ]; then
    echo "All tests passed successfully!"
    exit 0
else
    echo "Some tests failed. Please check the output above."
    exit 1
fi 