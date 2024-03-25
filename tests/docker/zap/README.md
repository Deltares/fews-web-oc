# ZAP
The ZAP tool is used to detect any security vulnerabilities in the Web OC.
It is important to configure the http servers with the correct security headers to comply with the OWASP rules.
In this directory the configuration files for NGINX and the ZAP tool are stored.  

# nginx.conf

The zap scanner run using NGINX. Specific security headers are added to the config to make the Web OC mostly compliant.
In some cases the ZAP tool will report a warning that cannot be prevented.

# weboc-zap.conf
In the weboc-zap.conf file warnings are excluded with an explanation why.

Among them are:

- CSP: style-src unsafe-inline: The web framework used by the Web OC (Vue JS) is using inline css.
- Sub Resource Integrity Attribute Missing: Not supported by the googles fonts css: <link rel="stylesheet" href="https://fonts.googleapis.com/css. See also: https://github.com/google/fonts/issues/473
- Timestamp Disclosure - Unix. False positive on: /js/chunk-vendors.ce1436d0.js

After zap has generated the report.xml the zap2junit.xsl transformation can be used to create a junit compliant version from it.
Since the generated report files (report.html, report.json and report.xml) do not respect the configured weboc-zap.conf (it is only used to report to stdout) the zap2junit.xsl transformation is used to create a junit compliant version from it and respecting the ignore list.
New entries to the ignore list, should be added to the zap2junit.xsl file as well.

# zap2junit.xsl
This can be used by teamcity to generate a test report and report to github all checks have passed.
