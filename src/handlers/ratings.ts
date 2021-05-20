import { APIGatewayProxyHandler } from 'aws-lambda';
import { createRating } from '../dynamo/ratings';
import { ServerResponse } from '../lib/response';
import { withAuth } from '../lib/with-auth';
import { withBody } from '../lib/with-body';
import { Rating } from '../models/rating';

export const create: APIGatewayProxyHandler = withAuth(
	false,
	withBody(async event => {
		const email = (event as any).tokenContent.email as string;
		const body = event.body as unknown as { score: number; message?: string };

		if (!body.score) return ServerResponse.error(400, 'Você deve fornecer uma pontuação');

		const { score, message } = body;

		let rating: Rating;
		try {
			rating = await createRating(email, score, message);
		} catch (e) {
			console.error(e);
			return ServerResponse.internalError();
		}
		return ServerResponse.success(rating, 'Sucesso');
	}),
);
