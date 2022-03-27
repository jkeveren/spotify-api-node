export function testNumberRange(expect, actual: number, expected: number, allowedDeviation: number) {
	const min = expected - allowedDeviation;
	const max = expected + allowedDeviation;
	expect(actual).toBeGreaterThan(min);
	expect(actual).toBeLessThan(max);
}
