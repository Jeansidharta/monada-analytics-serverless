import { google } from 'googleapis';
import { readFromEnvironment } from '../lib/environment';

function createSheetsInstance() {
	const credentials = {
		client_id: readFromEnvironment('SPREADSHEET_CLIENT_ID'),
		client_secret: readFromEnvironment('SPREADSHEET_CLIENT_SECRET'),
		redirect_uris: readFromEnvironment('SPREADSHEET_REDIRECT_URIS'),
	};

	const tokenVariables = {
		access_token: readFromEnvironment('SPREADSHEET_ACCESS_TOKEN'),
		refresh_token: readFromEnvironment('SPREADSHEET_REFRESH_TOKEN'),
		scope: readFromEnvironment('SPREADSHEET_SCOPE'),
		token_type: readFromEnvironment('SPREADSHEET_TOKEN_TYPE'),
		expiry_date: Number(readFromEnvironment('SPREADSHEET_EXPIRY_DATE')),
	};

	if (Number.isNaN(tokenVariables.expiry_date)) {
		throw new Error(
			`Environment variable 'SPREADSHEET_EXPIRY_DATE' must be a number. Check your .env file`,
		);
	}

	const oAuth2Client = new google.auth.OAuth2(
		credentials.client_id,
		credentials.client_secret,
		credentials.redirect_uris,
	);

	oAuth2Client.setCredentials(tokenVariables);
	return google.sheets({ version: 'v4', auth: oAuth2Client });
}

export async function readRangeFromSpreadsheet(range: string) {
	const spreadsheetId = readFromEnvironment('SPREADSHEET_DATABASE_ID');
	const sheets = createSheetsInstance();

	return sheets.spreadsheets.values.get({
		spreadsheetId,
		range: range,
	});
}

export async function writeRangeToSpreadsheet(range: string, values: (string | number)[][]) {
	const spreadsheetId = readFromEnvironment('SPREADSHEET_DATABASE_ID');
	const sheets = createSheetsInstance();

	return sheets.spreadsheets.values.update({
		spreadsheetId,
		range,
		valueInputOption: 'RAW',
		requestBody: {
			range,
			values,
		},
	});
}

export async function appendToSpreadsheet(range: string, values: (string | number)[][]) {
	const spreadsheetId = readFromEnvironment('SPREADSHEET_DATABASE_ID');
	const sheets = createSheetsInstance();

	return sheets.spreadsheets.values.append({
		spreadsheetId,
		range,
		valueInputOption: 'RAW',
		requestBody: {
			range,
			values,
		},
	});
}
