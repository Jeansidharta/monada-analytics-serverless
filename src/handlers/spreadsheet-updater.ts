import { APIGatewayProxyHandler } from 'aws-lambda';
import { readAllSubmissions } from '../dynamo/submissions';
import { ServerResponse } from '../lib/response';
import { Submission } from '../models/submission';
import { writeRangeToSpreadsheet } from '../spreadsheet';

const sheetsColumnsName = [
	'id',
	'creationDate',
	'userEmail',
	{
		keyName: 'data',
		columns: [
			'message',
			{
				keyName: 'exclusionCategories',
				columns: [
					'Acesso e participação',
					'Aprendizado e crescimento',
					'Elogio',
					'Equilíbrio entre vida pessoal e profissional',
					'Interações no trabalho',
					'Oportunidades de carreira',
					'Reconhecimento',
					'Respeito',
					'Uso de habilidades e tarefas',
					'Outro',
				],
			},
			{
				keyName: 'exclusionSources',
				columns: [
					'Clientes / Parceiros',
					'Colaboradores',
					'Lideranças',
					'Outro',
					'Políticas da Empresa',
					'Recursos Humanos',
				],
			},
		],
	},
];

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

function numberToLetters(num: number) {
	const letters: string[] = [];

	for (; num >= 0; num -= lettersArray.length) {
		letters.push(lettersArray[num]!);
	}

	return letters.join('');
}

function extractObjectIntoArray(object: any, keys: any[]) {
	const values: any[] = [];
	keys.forEach(key => {
		if (typeof key === 'object') {
			const { keyName, columns } = key;
			extractObjectIntoArray(object[keyName], columns).forEach(elem => values.push(elem));
		} else {
			const value = object[key];
			if (typeof value === 'boolean') values.push({ bool_value: value });
			else values.push(value);
		}
	});
	return values;
}

function parseSubmissionIntoColumn(submission: Submission) {
	return extractObjectIntoArray(submission, sheetsColumnsName) as string[];
}

export const hello: APIGatewayProxyHandler = async () => {
	let submissions: Submission[];
	try {
		const response = await readAllSubmissions();
		if (!response) throw new Error('Could not read submissions from the table');
		submissions = response;
	} catch (e) {
		console.error(e);
		return ServerResponse.internalError();
	}

	const rows = submissions.map(parseSubmissionIntoColumn);

	await writeRangeToSpreadsheet(
		`Submissoes!A3:${numberToLetters(rows[0]!.length)}${rows.length + 2}`,
		rows,
	);

	return ServerResponse.success(rows);
};
