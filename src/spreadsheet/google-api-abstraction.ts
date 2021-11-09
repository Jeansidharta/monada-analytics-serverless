import { google } from 'googleapis';

type EnvironmentData = {
	SPREADSHEET_CLIENT_ID: string;
	SPREADSHEET_CLIENT_SECRET: string;
	SPREADSHEET_REDIRECT_URIS: string;
	SPREADSHEET_ACCESS_TOKEN: string;
	SPREADSHEET_REFRESH_TOKEN: string;
	SPREADSHEET_SCOPE: string;
	SPREADSHEET_TOKEN_TYPE: string;
	SPREADSHEET_EXPIRY_DATE: string;
	SPREADSHEET_DATABASE_ID: string;
};

function createSheetsInstance(environmentData: EnvironmentData) {
	const credentials = {
		client_id: environmentData.SPREADSHEET_CLIENT_ID,
		client_secret: environmentData.SPREADSHEET_CLIENT_SECRET,
		redirect_uris: environmentData.SPREADSHEET_REDIRECT_URIS,
	};

	const tokenVariables = {
		access_token: environmentData.SPREADSHEET_ACCESS_TOKEN,
		refresh_token: environmentData.SPREADSHEET_REFRESH_TOKEN,
		scope: environmentData.SPREADSHEET_SCOPE,
		token_type: environmentData.SPREADSHEET_TOKEN_TYPE,
		expiry_date: Number(environmentData.SPREADSHEET_EXPIRY_DATE),
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

export async function readRangeFromSpreadsheet(range: string, environmentData: EnvironmentData) {
	const sheets = createSheetsInstance(environmentData);

	return sheets.spreadsheets.values.get({
		spreadsheetId: environmentData.SPREADSHEET_DATABASE_ID,
		range: range,
	});
}

export async function writeRangeToSpreadsheet(
	range: string,
	values: (string | number)[][],
	environmentData: EnvironmentData,
) {
	const sheets = createSheetsInstance(environmentData);

	return sheets.spreadsheets.values.update({
		spreadsheetId: environmentData.SPREADSHEET_DATABASE_ID,
		range,
		valueInputOption: 'RAW',
		requestBody: {
			range,
			values,
		},
	});
}

export async function appendToSpreadsheet(
	range: string,
	values: (string | number)[][],
	environmentData: EnvironmentData,
) {
	const sheets = createSheetsInstance(environmentData);

	return sheets.spreadsheets.values.append({
		spreadsheetId: environmentData.SPREADSHEET_DATABASE_ID,
		range,
		valueInputOption: 'RAW',
		requestBody: {
			range,
			values,
		},
	});
}
