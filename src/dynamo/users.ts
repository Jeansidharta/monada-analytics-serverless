import aws from 'aws-sdk';
import { readFromEnvironment } from '../lib/environment';
import { User } from '../models/user';

export async function createUser(email: string, hashedPassword: string) {
	const docClient = new aws.DynamoDB.DocumentClient();
	const DYNAMODB_USERS_TABLE = readFromEnvironment('DYNAMODB_USERS_TABLE');

	const Item: User = {
		email: email,
		password: hashedPassword,
		creationDate: Date.now(),
	};

	await docClient.put({ TableName: DYNAMODB_USERS_TABLE, Item }).promise();

	return Item;
}

export async function getUser(email: string) {
	const docClient = new aws.DynamoDB.DocumentClient();
	const DYNAMODB_USERS_TABLE = readFromEnvironment('DYNAMODB_USERS_TABLE');

	const result = await docClient.get({ TableName: DYNAMODB_USERS_TABLE, Key: { email } }).promise();
	if (!result.Item) {
		return null;
	}

	return result.Item as unknown as User;
}
