import aws from 'aws-sdk';
import { UserUninitialized, UserInitialized } from '../models/user';

export async function createUserFromCpf(cpf: string, DYNAMODB_USERS_TABLE: string) {
	const docClient = new aws.DynamoDB.DocumentClient();

	const Item: UserUninitialized = {
		cpf,
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
	const { cpf, creationDate } = uninitializedUser;

	// Don't use spread operator here to prevent unwanted keys to be stored in the DB
	const Item: UserInitialized = {
		cpf,
		creationDate,
		hashedPassword,
		name,
		initializationDate: Date.now(),
	};

	await docClient.put({ TableName: DYNAMODB_USERS_TABLE, Item }).promise();

	return Item;
}

export async function getUser(cpf: string, DYNAMODB_USERS_TABLE: string) {
	const docClient = new aws.DynamoDB.DocumentClient();

	const result = await docClient.get({ TableName: DYNAMODB_USERS_TABLE, Key: { cpf } }).promise();
	if (!result.Item) {
		return null;
	}

	return result.Item as unknown as UserInitialized | UserUninitialized;
}

export async function doesUserExist(cpf: string, DYNAMODB_USERS_TABLE: string) {
	if (await getUser(cpf, DYNAMODB_USERS_TABLE)) return true;
	return false;
}

export async function doesUserDoesNotExist(cpf: string, DYNAMODB_USERS_TABLE: string) {
	return !(await doesUserExist(cpf, DYNAMODB_USERS_TABLE));
}
