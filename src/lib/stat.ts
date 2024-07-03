export function groupNumbers(nums: number[]) {
	// First, sort the numbers in ascending order
	const sortedNums: number[] = nums.toSorted((a, b) => a - b);

	const result = [];
	let currentGroup: number[] = [];

	for (let i = 0; i < sortedNums.length; i++) {
		// If current group is empty, start a new group
		if (currentGroup.length === 0) {
			currentGroup.push(sortedNums[i]);
		} else {
			// Check the difference between the current number and the last number in the current group
			if (sortedNums[i] - currentGroup[currentGroup.length - 1] < 3) {
				currentGroup.push(sortedNums[i]);
			} else {
				// If the difference is 2 or more, push the current group to the result and start a new group
				result.push(currentGroup);
				currentGroup = [nums[i]];
			}
		}
	}
	// Push the last group to the result
	if (currentGroup.length > 0) {
		result.push(currentGroup);
	}

	return result;
}

export function findOutlierIndexes(uint8Array: Uint8Array) {
	const data = Array.from(uint8Array);
	const sortedDataWithIndexes = data
		.map((value, index) => ({ value, index }))
		.sort((a, b) => a.value - b.value);
	const sortedData = sortedDataWithIndexes.map((item) => item.value);

	const q1 = sortedData[Math.floor(sortedData.length / 4)];
	const q3 = sortedData[Math.floor(sortedData.length * (3 / 4))];
	const iqr = q3 - q1;
	const lowerBound = q1 - 30 * iqr;
	const upperBound = q3 + 30 * iqr;
	// upper and lower bound should usually both be zero
	// could be usefull to check for clipping
	return sortedDataWithIndexes
		.filter((item) => item.value < lowerBound || item.value > upperBound)
		.map((item) => item.index);
}
