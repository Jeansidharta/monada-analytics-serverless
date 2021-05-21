export const readFromEnvironment = (keyName: string) => {
	const value = process.env[keyName] as string;

	if (!value) {
		throw new Error(`Environment variable '${keyName}' not found. Check your .env file`);
	}

	return value;
};
