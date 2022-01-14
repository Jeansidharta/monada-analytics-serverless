import jwt from 'jsonwebtoken';

export type JWTPayload = {
	cpf: string;
};

export function verifyJWT(token: string, secret: string) {
	try {
		return jwt.verify(token, secret) as JWTPayload;
	} catch (e) {
		return null;
	}
}

export function generateJWT({ cpf }: JWTPayload, secret: string) {
	const cleanPayload: JWTPayload = { cpf };
	return jwt.sign(cleanPayload, secret, { expiresIn: '7d' });
}
