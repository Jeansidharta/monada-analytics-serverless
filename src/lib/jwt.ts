import jwt from 'jsonwebtoken';

export type JWTPayload = {
	email: string;
};

export function verifyJWT(token: string, secret: string) {
	try {
		return jwt.verify(token, secret) as JWTPayload;
	} catch (e) {
		return null;
	}
}

export function generateJWT(payload: JWTPayload, secret: string) {
	return jwt.sign(payload, secret, { expiresIn: '7d' });
}
