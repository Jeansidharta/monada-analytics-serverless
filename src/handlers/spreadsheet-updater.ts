import { google } from 'googleapis';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { ServerResponse } from '../lib/response';

export const hello: APIGatewayProxyHandler = async () => {
	const credentials = {
		client_id: process.env['SPREADSHEET_CLIENT_ID'] as string,
		client_secret: process.env['SPREADSHEET_CLIENT_SECRET'] as string,
		redirect_uris: process.env['SPREADSHEET_REDIRECT_URIS'] as string,
	};

	const tokenVariables = {
		access_token: process.env['SPREADSHEET_ACCESS_TOKEN'] as string,
		refresh_token: process.env['SPREADSHEET_REFRESH_TOKEN'] as string,
		scope: process.env['SPREADSHEET_SCOPE'] as string,
		token_type: process.env['SPREADSHEET_TOKEN_TYPE'] as string,
		expiry_date: Number(process.env['SPREADSHEET_EXPIRY_DATE']),
	};

	const oAuth2Client = new google.auth.OAuth2(
		credentials.client_id,
		credentials.client_secret,
		credentials.redirect_uris,
	);

	oAuth2Client.setCredentials(tokenVariables);
	const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

	const rows = await new Promise(resolve => {
		sheets.spreadsheets.values.get(
			{
				spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
				range: 'Class Data!A2:E',
			},
			(err, res) => {
				if (err) return console.log('The API returned an error: ' + err);
				const rows = res!.data.values!;
				if (rows.length) {
					console.log('Name, Major:');
					// Print columns A and E, which correspond to indices 0 and 4.
					rows.map(row => {
						console.log(`${row[0]}, ${row[4]}`);
					});
				} else {
					console.log('No data found.');
				}
				resolve(rows);
			},
		);
	});

	return ServerResponse.success(rows, 'Success!');
};
