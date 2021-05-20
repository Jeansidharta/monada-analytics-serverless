import aws from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Rating } from '../models/rating';

export async function createRating(userEmail: string, score: number, message: string = '') {
	const DYNAMODB_RATINGS_TABLE = process.env['DYNAMODB_RATINGS_TABLE'] as string;
	const docClient = new aws.DynamoDB.DocumentClient();

	const Item: Rating = {
		id: uuidv4(),
		userEmail,
		message,
		score,
	};

	await docClient
		.put({
			TableName: DYNAMODB_RATINGS_TABLE,
			Item,
		})
		.promise();

	return Item;
}
