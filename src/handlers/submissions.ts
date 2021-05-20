import type { APIGatewayProxyHandler } from 'aws-lambda';
import { withAuth } from '../lib/with-auth';
import { withBody } from '../lib/with-body';
import { ServerResponse } from '../lib/response';
import { createSubmission } from '../dynamo/submissions';
import { Submission } from '../models/submission';

export const create: APIGatewayProxyHandler = withAuth(
	false,
	withBody(async event => {
		const userEmail = (event as any).tokenContent.email as string;
		const body = event.body as any;

		let submission: Submission;
		try {
			submission = await createSubmission(userEmail, body);
		} catch (e) {
			console.log(e);
			return ServerResponse.internalError();
		}

		return ServerResponse.success(submission, 'Formulário submetido com sucesso');
	}),
);
