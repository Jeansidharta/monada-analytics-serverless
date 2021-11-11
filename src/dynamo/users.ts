import aws from 'aws-sdk';
import { UserUninitialized, UserInitialized } from '../models/user';

export async function createUserFromCNPJ(cnpj: string, DYNAMODB_USERS_TABLE: string) {
	const docClient = new aws.DynamoDB.DocumentClient();

	const Item: UserUninitialized = {
		cnpj,
		creationDate: Date.now(),
	};

	await docClient.put({ TableName: DYNAMODB_USERS_TABLE, Item }).promise();

	return Item;
}

export async function initializeUser(
	initializationData: {
		name: string;
		hashedPassword: string;
	},
	uninitializedUser: UserUninitialized,
	DYNAMODB_USERS_TABLE: string,
) {
	const docClient = new aws.DynamoDB.DocumentClient();

	const { hashedPassword, name } = initializationData;
	const { cnpj, creationDate } = uninitializedUser;

	// Don't use spread operator here to prevent unwanted keys to be stored in the DB
	const Item: UserInitialized = {
		cnpj,
		creationDate,
		hashedPassword,
		name,
		initializationDate: Date.now(),
	};

	await docClient.put({ TableName: DYNAMODB_USERS_TABLE, Item }).promise();

	return Item;
}

export async function getUser(cnpj: string, DYNAMODB_USERS_TABLE: string) {
	const docClient = new aws.DynamoDB.DocumentClient();

	const result = await docClient.get({ TableName: DYNAMODB_USERS_TABLE, Key: { cnpj } }).promise();
	if (!result.Item) {
		return null;
	}

	return result.Item as unknown as UserInitialized | UserUninitialized;
}

export async function doesUserExist(cnpj: string, DYNAMODB_USERS_TABLE: string) {
	if (await getUser(cnpj, DYNAMODB_USERS_TABLE)) return true;
	return false;
}

export async function doesUserDoesNotExist(cnpj: string, DYNAMODB_USERS_TABLE: string) {
	return !(await doesUserExist(cnpj, DYNAMODB_USERS_TABLE));
}
