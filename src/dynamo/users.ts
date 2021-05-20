import aws from 'aws-sdk';
import { User } from '../models/user';

export async function createUser(email: string, hashedPassword: string) {
	const DYNAMODB_USERS_TABLE = process.env['DYNAMODB_USERS_TABLE'] as string;
	const docClient = new aws.DynamoDB.DocumentClient();

	if (!DYNAMODB_USERS_TABLE) {
		throw new Error(`Environment variable 'DYNAMODB_USERS_TABLE' not found. Check your .env file`);
	}

	const result = await docClient
		.put({
			TableName: DYNAMODB_USERS_TABLE,
			Item: {
				email: email,
				password: hashedPassword,
			},
		})
		.promise();
	if (!result.Attributes) {
		throw new Error('Failed to create user');
	}
	return result.Attributes as unknown as User;
}

export async function getUser(email: string) {
	const DYNAMODB_USERS_TABLE = process.env['DYNAMODB_USERS_TABLE'] as string;
	const docClient = new aws.DynamoDB.DocumentClient();

	if (!DYNAMODB_USERS_TABLE) {
		throw new Error(`Environment variable 'DYNAMODB_USERS_TABLE' not found. Check your .env file`);
	}

	const result = await docClient.get({ TableName: DYNAMODB_USERS_TABLE, Key: { email } }).promise();
	if (!result.Item) {
		return null;
	}

	return result.Item as unknown as User;
}

export async function updateUserAbout(email: string, about: any) {
	const DYNAMODB_USERS_TABLE = process.env['DYNAMODB_USERS_TABLE'] as string;
	const docClient = new aws.DynamoDB.DocumentClient();

	if (!DYNAMODB_USERS_TABLE) {
		throw new Error(`Environment variable 'DYNAMODB_USERS_TABLE' not found. Check your .env file`);
	}

	const result = await docClient
		.update({
			TableName: DYNAMODB_USERS_TABLE,
			Key: {
				email,
			},
			UpdateExpression: 'SET about = :about',
			ExpressionAttributeValues: {
				':about': about,
			},
			ReturnValues: 'ALL_NEW',
		})
		.promise();
	if (!result.Attributes) {
		throw new Error('Failed to update the user');
	}

	return result.Attributes as unknown as User;
}
