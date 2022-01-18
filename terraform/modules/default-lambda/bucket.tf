data "archive_file" "lambda_code" {
  type = "zip"

  source_file  = "../dist/${var.handler_filename}.js"
  output_path = "../dist/${var.handler_filename}.zip"
}

resource "aws_s3_bucket" "s3_lambda_source_code_bucket" {
	bucket = "${var.project_prefix}-lambda-source-code"
	acl    = "private"
}

resource "aws_s3_bucket_object" "source_code_object" {
	bucket = aws_s3_bucket.s3_lambda_source_code_bucket.bucket
	key    = "${local.lambda_name}.zip"
	source = data.archive_file.lambda_code.output_path
	etag = filemd5(data.archive_file.lambda_code.output_path)
}