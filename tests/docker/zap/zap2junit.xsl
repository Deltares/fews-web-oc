<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" indent="yes"/>

    <xsl:param name="falsePositives" select="' (HTTP Only Site - Active/beta) (CSP - Passive/release) (CSP: Wildcard Directive) (CSP: style-src unsafe-inline) (Hidden File Finder - Active/release) (Timestamp Disclosure - Passive/release) (Hidden File Found) '"/>
    <!-- When set to 1, minor risks are skipped.-->
    <xsl:variable name="riskCodeLimit" select="1"/>
    <xsl:param name="sourceFolder"/>
    <xsl:variable name="NumberOfItems" select="count(OWASPZAPReport/site/alerts/alertitem/riskcode)"/>
    <xsl:variable name="generatedDateTime" select="OWASPZAPReport/@generated"/>
    <xsl:variable name="host" select="OWASPZAPReport/site/@host"/>
    <xsl:template match="/">
        <testsuites>
            <testsuite id="1" name="zap" package="owasp" hostname="{$host}" timestamp="{$generatedDateTime}"
                       tests="{$NumberOfItems}" failures="{$NumberOfItems}" errors="0" time="{$generatedDateTime}">
                <properties/>
                <xsl:for-each select="OWASPZAPReport/site/alerts/alertitem">
                    <!-- riscode 0 = informational, 1 = Low, 2 = Medium, 3 = High -->
                    <!-- confidence 1 = low, 2 = medium, 3 = high -->
                    <xsl:variable name="riskcode" select="riskcode"/>
                    <xsl:variable name="confidence" select="confidence"/>
                    <xsl:variable name="riskdesc" select="riskdesc"/>
                    <xsl:variable name="name" select="name"/>

                    <!-- Only report for risks with a riskcode > limit -->
                    <xsl:if test="$riskcode &gt; $riskCodeLimit">
                        <xsl:choose>
                            <!-- should not be in the ignore list. Name is withouth (), -->
                            <xsl:when test="not(contains($falsePositives, concat('(', $name, ')')))">
                                <xsl:variable name="stacktrace">
                                    <xsl:value-of select="solution"/>:
                                    <xsl:for-each select="instances/instance">
                                        <xsl:value-of select="uri"/>, <xsl:value-of select="method"/>, <xsl:value-of
                                            select="param"/>,
                                    </xsl:for-each>
                                </xsl:variable>
                                <testcase name="{name}" classname="{riskdesc}" time="{$generatedDateTime}">
                                    <failure message="{$stacktrace}" type="{$riskdesc}">
                                    </failure>
                                </testcase>
                            </xsl:when>
                            <xsl:otherwise>
                                <testcase name="{name}" classname="{riskdesc}" time="{$generatedDateTime}">
                                    <skipped>On ignore list</skipped>
                                </testcase>
                            </xsl:otherwise>
                        </xsl:choose>
                    </xsl:if>
                    <xsl:if test="$riskcode &lt;= $riskCodeLimit">
                        <testcase name="{name}" classname="{riskdesc}" time="{$generatedDateTime}">
                            <skipped>
                            </skipped>
                        </testcase>
                    </xsl:if>

                </xsl:for-each>
                <!-- required for JUnit xsd -->
                <system-out></system-out>
                <!-- required for JUnit xsd -->
                <system-err></system-err>
            </testsuite>
        </testsuites>
    </xsl:template>
</xsl:stylesheet>
