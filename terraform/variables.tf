locals {
	project_prefix = "monada-analytics"
	environment_name = local.workspace_vars.environment_name

	JWT_SECRET = sensitive(local.workspace_vars.JWT_SECRET)
	SIGNUP_SECRET = sensitive(local.workspace_vars.SIGNUP_SECRET)

	workspace_vars = jsondecode(file("./env/${terraform.workspace}.json"))
}

locals {
	table_users_name = "${local.project_prefix}-users-${local.environment_name}"
	table_access_key_name = "${local.project_prefix}-access-key-${local.environment_name}"
	table_submissions_name = "${local.project_prefix}-submissions-${local.environment_name}"
	table_ratings_name = "${local.project_prefix}-ratings-${local.environment_name}"
	table_tos_refusal_message_name = "${local.project_prefix}-tos-refusal-message-${local.environment_name}"
}
