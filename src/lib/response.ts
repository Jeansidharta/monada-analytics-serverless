export class ServerResponse {
	public statusCode: number;
	public body: string;
	public headers: Record<string, any>;

	constructor(statusCode: number, success: boolean, message?: string, payload?: any) {
		this.statusCode = statusCode;
		this.body = JSON.stringify({ success, message, payload });
		this.headers = {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Expose-Headers': 'authorization',
		};
	}

	static success(payload: any, message?: string) {
		return new ServerResponse(200, true, message, payload);
	}

	static error(statusCode: number, message?: string) {
		return new ServerResponse(statusCode, false, message);
	}

	static internalError() {
		return new ServerResponse(500, false, 'Internal Error');
	}
}
