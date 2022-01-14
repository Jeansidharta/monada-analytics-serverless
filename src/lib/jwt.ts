import jwt from 'jsonwebtoken';

export type JWTPayload = {
	cpfCnpj: string;
};

export function verifyJWT(token: string, secret: string) {
	try {
		return jwt.verify(token, secret) as JWTPayload;
	} catch (e) {
		return null;
	}
}

export function generateJWT({ cpfCnpj }: JWTPayload, secret: string) {
	const cleanPayload: JWTPayload = { cpfCnpj };
	return jwt.sign(cleanPayload, secret, { expiresIn: '7d' });
}
