# nginx.conf

The zap scanner run using NGINX. Specific security headers are added to the config to make the Web OC mostly compliant.
In some cases the ZAP tool will report a warning that cannot be prevented. The following is a list of warnings and the reason they cannot be prevented:

-   CSP: style-src unsafe-inline: The web framework used by the Web OC (Vue JS) is using inline css.
-   Sub Resource Integrity Attribute Missing: Not supported by the googles fonts css: <link rel="stylesheet" href="https://fonts.googleapis.com/css. See also: https://github.com/google/fonts/issues/473
  - Timestamp Disclosure - Unix. False positive on: /js/chunk-vendors.ce1436d0.js

# After zap has generated the report.xml the zap2junit.xsl transformation can be used to create a junit compliant version from it.
# This can be used by teamcity to generate a test report.
