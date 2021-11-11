import { readAllSubmissions } from '../dynamo/submissions';
import { ServerResponse } from '../lib/server-response';
import { submissionToSpreadsheetRow } from '../spreadsheet/submission-to-row';
import { Submission } from '../models/submission';
import {
	appendToSpreadsheet,
	writeRangeToSpreadsheet,
} from '../spreadsheet/google-api-abstraction';
import { numberToLetters } from '../lib/number-to-letters';
import { makeDynamoDBStreamHandler, makeGatewayHandler } from '../lib/make-handler';
import { expectEnv } from '../lib/handler-validators/require-env';
import { expectBody } from '../lib/handler-validators/expect-body';
import { validateBody } from '../lib/handler-validators/validate-body';
import v8n from 'v8n';
import { HTTPStatusCode } from '../lib/server-response/status-codes';

export const copyWholeDatabaseToSpreadsheet = makeGatewayHandler()
	.use(expectEnv('SPREADSHEET_CLIENT_ID'))
	.use(expectEnv('SPREADSHEET_CLIENT_SECRET'))
	.use(expectEnv('SPREADSHEET_REDIRECT_URIS'))
	.use(expectEnv('SPREADSHEET_ACCESS_TOKEN'))
	.use(expectEnv('SPREADSHEET_REFRESH_TOKEN'))
	.use(expectEnv('SPREADSHEET_SCOPE'))
	.use(expectEnv('SPREADSHEET_TOKEN_TYPE'))
	.use(expectEnv('SPREADSHEET_EXPIRY_DATE'))
	.use(expectEnv('SPREADSHEET_DATABASE_ID'))

	.use(expectEnv('SWEEP_DATABASE_KEY'))
	.use(expectEnv('DYNAMODB_SUBMISSIONS_TABLE'))
	.use(expectBody())
	.use(
		validateBody<{ secret: string }>(
			v8n().schema({
				secret: v8n().string().not.empty(),
			}),
		),
	)
	.asHandler(async middlewareData => {
		const body = middlewareData.body as any as { secret: string };

		if (body.secret !== middlewareData.SWEEP_DATABASE_KEY) {
			return ServerResponse.error(HTTPStatusCode.CLIENT_ERROR.C400_BAD_REQUEST, 'Invalid Secret');
		}

		let submissions: Submission[];
		try {
			const response = await readAllSubmissions(middlewareData.DYNAMODB_SUBMISSIONS_TABLE);
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
			middlewareData,
		);
		return ServerResponse.success(undefined);
	});

export const createRowFromNewEntry = makeDynamoDBStreamHandler()
	.use(expectEnv('SPREADSHEET_CLIENT_ID'))
	.use(expectEnv('SPREADSHEET_CLIENT_SECRET'))
	.use(expectEnv('SPREADSHEET_REDIRECT_URIS'))
	.use(expectEnv('SPREADSHEET_ACCESS_TOKEN'))
	.use(expectEnv('SPREADSHEET_REFRESH_TOKEN'))
	.use(expectEnv('SPREADSHEET_SCOPE'))
	.use(expectEnv('SPREADSHEET_TOKEN_TYPE'))
	.use(expectEnv('SPREADSHEET_EXPIRY_DATE'))
	.use(expectEnv('SPREADSHEET_DATABASE_ID'))
	.asHandler(async (middlewareData, event) => {
		await Promise.all(
			event.Records.map(async record => {
				if (record.eventName !== 'INSERT') return;
				if (!record.dynamodb) {
					throw new Error('dynamodb object was not found on event.');
				}
				const submission = record.dynamodb.NewImage as Submission;
				const sheetRows = [submissionToSpreadsheetRow(submission, true)];
				await appendToSpreadsheet(
					`A3:${numberToLetters(sheetRows[0]!.length)}`,
					sheetRows,
					middlewareData,
				);
				console.log('Created new row on spreadsheet for submission id', submission.userCnpj);
			}),
		);
		return null;
	});
