import aws from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Submission } from '../models/submission';

export async function createSubmission(
	userEmail: string,
	data: any,
	DYNAMODB_SUBMISSIONS_TABLE: string,
) {
	const docClient = new aws.DynamoDB.DocumentClient();

	const Item: Submission = {
		id: uuidv4(),
		userEmail,
		data,
		creationDate: Date.now(),
	};

	await docClient.put({ TableName: DYNAMODB_SUBMISSIONS_TABLE, Item }).promise();
	return Item;
}

export async function readAllSubmissions(DYNAMODB_SUBMISSIONS_TABLE: string) {
	const docClient = new aws.DynamoDB.DocumentClient();

	const data = await docClient.scan({ TableName: DYNAMODB_SUBMISSIONS_TABLE }).promise();

	if (!data.Items) return null;
	return data.Items as Submission[];
}
