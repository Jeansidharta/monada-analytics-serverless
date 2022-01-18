resource "aws_apigatewayv2_api" "lambda" {
	name          = "serverless_lambda_gw"
	protocol_type = "HTTP"

	cors_configuration {
		allow_origins = ["*"]
		allow_methods = ["*"]
		allow_headers = ["Content-Type"]
		expose_headers = ["*"]
		max_age = 300
	}
}

resource "aws_apigatewayv2_stage" "lambda" {
	api_id = aws_apigatewayv2_api.lambda.id

	name        = "${local.environment_name}"
	auto_deploy = true
}

output "base_url" {
	description = "Base URL for API Gateway stage."

	value = aws_apigatewayv2_stage.lambda.invoke_url
}