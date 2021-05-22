import { APIGatewayProxyHandler, DynamoDBStreamHandler } from 'aws-lambda';
import { readAllSubmissions } from '../dynamo/submissions';
import { ServerResponse } from '../lib/response';
import { submissionToSpreadsheetRow } from '../spreadsheet/submission-to-row';
import { Submission } from '../models/submission';
import { withBody } from '../lib/with-body';
import { readFromEnvironment } from '../lib/environment';
import {
	appendToSpreadsheet,
	writeRangeToSpreadsheet,
} from '../spreadsheet/google-api-abstraction';
import { numberToLetters } from '../lib/number-to-letters';

export const copyWholeDatabaseToSpreadsheet: APIGatewayProxyHandler = withBody(async event => {
	const body = event.body as any as { secret: string };
	if (!body.secret) return ServerResponse.error(400, `Key 'secret' is required`);
	if (body.secret !== readFromEnvironment('SWEEP_DATABASE_KEY')) {
		return ServerResponse.error(400, 'Invalid Secret');
	}

	let submissions: Submission[];
	try {
		const response = await readAllSubmissions();
		if (!response) throw new Error('Could not read submissions from the table');
		submissions = response;
	} catch (e) {
		console.error(e);
		return ServerResponse.internalError();
	}

	const sheetRows = submissions.map(submission => submissionToSpreadsheetRow(submission, false));
	await writeRangeToSpreadsheet(
		`A3:${numberToLetters(sheetRows[0]!.length)}${sheetRows.length + 2}`,
		sheetRows,
	);
	return ServerResponse.success(undefined);
});

export const createRowFromNewEntry: DynamoDBStreamHandler = async event => {
	await Promise.all(
		event.Records.map(async record => {
			if (record.eventName !== 'INSERT') return;
			if (!record.dynamodb) {
				throw new Error('dynamodb object was not found on event.');
			}
			const submission = record.dynamodb.NewImage as Submission;
			const sheetRows = [submissionToSpreadsheetRow(submission, true)];
			await appendToSpreadsheet(`A3:${numberToLetters(sheetRows[0]!.length)}`, sheetRows);
			console.log('Created new row on spreadsheet for submission id', submission.id);
		}),
	);
};
