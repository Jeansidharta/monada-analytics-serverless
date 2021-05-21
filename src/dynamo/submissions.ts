import aws from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Submission } from '../models/submission';

export async function createSubmission(userEmail: string, data: any) {
	const DYNAMODB_SUBMISSIONS_TABLE = process.env['DYNAMODB_SUBMISSIONS_TABLE'] as string;
	const docClient = new aws.DynamoDB.DocumentClient();

	if (!DYNAMODB_SUBMISSIONS_TABLE) {
		throw new Error(
			`Environment variable 'DYNAMODB_SUBMISSIONS_TABLE' not found. Check your .env file`,
		);
	}

	const Item: Submission = {
		id: uuidv4(),
		userEmail,
		data,
		creationDate: Date.now(),
	};

	await docClient.put({ TableName: DYNAMODB_SUBMISSIONS_TABLE, Item }).promise();
	return Item;
}
