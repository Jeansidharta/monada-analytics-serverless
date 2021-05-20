import type { APIGatewayProxyHandler } from 'aws-lambda';
import { ServerResponse } from './response';

export function withBody(handler: APIGatewayProxyHandler) {
	return (async (event, ...args) => {
		const contentType = (event.headers['content-type'] || event.headers['Content-Type']) as string;
		if (!contentType) return ServerResponse.error(415, `Missing Content-Type header`);

		if (contentType !== 'application/json') {
			return ServerResponse.error(
				415,
				`Invalid content-type. Expected 'application/json', but instead got '${contentType}'`,
			);
		}

		if (!event.body) return ServerResponse.error(415, `Missing body`);

		event.body = JSON.parse(event.body);

		return handler(event, ...args);
	}) as APIGatewayProxyHandler;
}
