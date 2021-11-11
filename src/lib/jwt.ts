import jwt from 'jsonwebtoken';

export type JWTPayload = {
	cnpj: string;
};

export function verifyJWT(token: string, secret: string) {
	try {
		return jwt.verify(token, secret) as JWTPayload;
	} catch (e) {
		return null;
	}
}

export function generateJWT({ cnpj }: JWTPayload, secret: string) {
	const cleanPayload: JWTPayload = { cnpj };
	return jwt.sign(cleanPayload, secret, { expiresIn: '7d' });
}
