const lettersArray = [
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z',
];

export function numberToLetters(num: number) {
	const letters: string[] = [];

	while (num >= lettersArray.length) {
		const div = Math.floor(num / lettersArray.length);
		letters.push(lettersArray[div]!);
		num -= div * lettersArray.length;
	}
	letters.push(lettersArray[num]!);

	return letters.join('');
}
