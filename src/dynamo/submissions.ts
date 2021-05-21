import aws from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { readFromEnvironment } from '../lib/environment';
import { Submission } from '../models/submission';

export async function createSubmission(userEmail: string, data: any) {
	const docClient = new aws.DynamoDB.DocumentClient();
	const DYNAMODB_SUBMISSIONS_TABLE = readFromEnvironment('DYNAMODB_SUBMISSIONS_TABLE');

	const Item: Submission = {
		id: uuidv4(),
		userEmail,
		data,
		creationDate: Date.now(),
	};

	await docClient.put({ TableName: DYNAMODB_SUBMISSIONS_TABLE, Item }).promise();
	return Item;
}

export async function readAllSubmissions() {
	const docClient = new aws.DynamoDB.DocumentClient();
	const DYNAMODB_SUBMISSIONS_TABLE = readFromEnvironment('DYNAMODB_SUBMISSIONS_TABLE');

	const data = await docClient.scan({ TableName: DYNAMODB_SUBMISSIONS_TABLE }).promise();

	if (!data.Items) return null;
	return data.Items as Submission[];
}
