import aws from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { readFromEnvironment } from '../lib/environment';
import { Rating } from '../models/rating';

export async function createRating(userEmail: string, score: number, message: string = '') {
	const docClient = new aws.DynamoDB.DocumentClient();
	const DYNAMODB_RATINGS_TABLE = readFromEnvironment('DYNAMODB_RATINGS_TABLE');

	const Item: Rating = {
		id: uuidv4(),
		userEmail,
		message,
		score,
		creationDate: Date.now(),
	};

	await docClient.put({ TableName: DYNAMODB_RATINGS_TABLE, Item }).promise();
	return Item;
}
