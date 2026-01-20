app_name = "ael_customization"
app_title = "Ael Customization"
app_publisher = "aits"
app_description = "ael customization and dev"
app_email = "nikhil@aitsind.com"
app_license = "mit"

doctype_js = {
    "Quotation": "public/js/quotation.js",
    "Sales Order": "public/js/sales_order.js",
    "Sales Invoice": "public/js/sales_invoice.js"
}

fixtures = [
    {
        "dt": "Custom Field",
        "filters": [
            ["module", "in", ["custom_quotation", "custom job description"]]
        ]
    }
]

override_whitelisted_methods = {
    "erpnext.selling.doctype.quotation.quotation.make_sales_order":
        "ael_customization.custom_quotation.doctype.quotation.quotation.make_sales_order",
    "erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice":
        "ael_customization.custom_job_description.doctype.sales_order.sales_order.make_sales_invoice"
}

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "ael_customization",
# 		"logo": "/assets/ael_customization/logo.png",
# 		"title": "Ael Customization",
# 		"route": "/ael_customization",
# 		"has_permission": "ael_customization.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/ael_customization/css/ael_customization.css"
# app_include_js = "/assets/ael_customization/js/ael_customization.js"

# include js, css files in header of web template
# web_include_css = "/assets/ael_customization/css/ael_customization.css"
# web_include_js = "/assets/ael_customization/js/ael_customization.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "ael_customization/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "ael_customization/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "ael_customization.utils.jinja_methods",
# 	"filters": "ael_customization.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "ael_customization.install.before_install"
# after_install = "ael_customization.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "ael_customization.uninstall.before_uninstall"
# after_uninstall = "ael_customization.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "ael_customization.utils.before_app_install"
# after_app_install = "ael_customization.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "ael_customization.utils.before_app_uninstall"
# after_app_uninstall = "ael_customization.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "ael_customization.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"ael_customization.tasks.all"
# 	],
# 	"daily": [
# 		"ael_customization.tasks.daily"
# 	],
# 	"hourly": [
# 		"ael_customization.tasks.hourly"
# 	],
# 	"weekly": [
# 		"ael_customization.tasks.weekly"
# 	],
# 	"monthly": [
# 		"ael_customization.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "ael_customization.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "ael_customization.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "ael_customization.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["ael_customization.utils.before_request"]
# after_request = ["ael_customization.utils.after_request"]

# Job Events
# ----------
# before_job = ["ael_customization.utils.before_job"]
# after_job = ["ael_customization.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"ael_customization.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []

