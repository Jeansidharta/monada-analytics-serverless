import aws from 'aws-sdk';
import { User } from '../models/user';

export async function createUser(
	email: string,
	hashedPassword: string,
	DYNAMODB_USERS_TABLE: string,
) {
	const docClient = new aws.DynamoDB.DocumentClient();

	const Item: User = {
		email: email,
		password: hashedPassword,
		creationDate: Date.now(),
	};

	await docClient.put({ TableName: DYNAMODB_USERS_TABLE, Item }).promise();

	return Item;
}

export async function getUser(email: string, DYNAMODB_USERS_TABLE: string) {
	const docClient = new aws.DynamoDB.DocumentClient();

	const result = await docClient.get({ TableName: DYNAMODB_USERS_TABLE, Key: { email } }).promise();
	if (!result.Item) {
		return null;
	}

	return result.Item as unknown as User;
}
