# The Delft-FEWS Web OC Tomcat Login

To support login with a username and password using tomcat configuration, both the weboc and the Delft-FEWS Web Services have to be deployed on the same tomcat server.
The weboc will have to be deployed in a Tomcat ROOT.war file: [See Tomcat Deployment](../deployments/README.md).
Also Single Sign On has to be enabled in the tomcat server.xml. This wil allow sharing a session cookie between the weboc and the fews web services.

## conf/server.xml

``` xml
<Valve className="org.apache.catalina.authenticator.SingleSignOn" />
```

## conf/web.xml

All URLs will be protected by the security constraint. 
The login page will be login.html and the error page will be loginfailed.html.
To access any resources a user needs to have the rol WS_VIEWER or WS_EDITOR.
In the following configuration the WS_VIEWER role only has access to GET requests.
The list of roles can be extended with more application specific roles that can be used as systemUserGroup in the UserGroups.xml. 

``` xml

	    <security-constraint>
            <display-name>SecurityConstraint Web OC Viewer</display-name>
                <web-resource-collection>
                    <web-resource-name>WebOC Viewer</web-resource-name>
                    <url-pattern>/*</url-pattern>
                    <http-method>GET</http-method>
            </web-resource-collection>
            <auth-constraint>
                  <role-name>WS_VIEWER</role-name>
                  <role-name>WS_EDITOR</role-name>
            </auth-constraint>
        </security-constraint>
	    <security-constraint>
            <display-name>SecurityConstraint Editor</display-name>
            <web-resource-collection>
                  <web-resource-name>WebOC Editor</web-resource-name>
                 <url-pattern>/*</url-pattern>
            </web-resource-collection>
            <auth-constraint>
                  <role-name>WS_EDITOR</role-name>
            </auth-constraint>
        </security-constraint>
        <login-config>
            <auth-method>FORM</auth-method>
            <form-login-config>
                  <form-login-page>/login.html</form-login-page>
                 <form-error-page>/loginfailed.html</form-error-page>
            </form-login-config>
        </login-config>
        <security-role>
            <role-name>WS_VIEWER</role-name>
        </security-role>
        <security-role>
            <role-name>WS_EDITOR</role-name>
        </security-role>
```

## webapps/ROOT
The login.html and loginfailed.html pages have to be added to the ROOT.war file.
The login page will be login.html and the error page will be loginfailed.html.

### login.html
The following is a very basic login page. The form will post the username and password to the j_security_check action that will trigger the tomcat login.
``` html
<!DOCTYPE html>
<html lang="en">
<body>
    <div class="login-container">
        <h2>Web OC</h2>
        <form method="POST" action="j_security_check">
            <input type="text" placeholder="Username" id="username" name="j_username" required>
            <input type="password" placeholder="Password" id="password" name="j_password" required>
            <button type="submit">Login</button>
        </form>
    </div>
</body>
</html>
```


### loginfailed.html

``` html
<!DOCTYPE html>
<html lang="en">
<body>
    <div class="login-container">
        <h2>Login Failed</h2>
        <a href="index.html">Back to Login</a>
    </div>
</body>
</html>
```

## ENV variable
The Fews Web Services will have to know that the authentication type is tomcat. This can be done by setting the following environment variable:

FEWS_WS_AUTHENTICATION_TYPE=AuthenticationTomcat


# User Management with Tomcat

Tomcat has some options for user management. See:
https://tomcat.apache.org/tomcat-10.0-doc/realm-howto.html#Standard_Realm_Implementations

Most common are using an LDAP connection or managing the users in a tomcat-users.xml file.

The following shows how to use the tomcat UserDatabseReleam with a SecretKeyCredentialHandler. 
This handler uses the PBKDF2WithHmacSHA512 algorithm to hash the password. The number of iterations, salt length and key length can be set as well.

## conf/server.xml

``` xml
<Realm className="org.apache.catalina.realm.LockOutRealm">
     <Realm className="org.apache.catalina.realm.UserDatabaseRealm"
             resourceName="UserDatabase">
        <CredentialHandler className="org.apache.catalina.realm.SecretKeyCredentialHandler"
                      algorithm="PBKDF2WithHmacSHA512"
                      iterations="100000"
                      keyLength="256"
                      saltLength="16"
        />
     </Realm>
  </Realm>
```

If tomcat has been configured, users can be added that are allowed access to the FEWS Web Services.
The following is an example of a tomcat-users.xml file where two users (viewer and editor) have been added. Alse roles have been assigend to the users.
All users with the role WS_VIEWER or WS_EDITOR will get access to the FEWS Web Services. The file can be found in the conf directory the tomcat installation:

## conf/tomcat-users.xml

``` xml
<tomcat-users xmlns="http://tomcat.apache.org/xml"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://tomcat.apache.org/xml tomcat-users.xsd"
version="1.0">
  <role rolename="WS_VIEWER"/>
  <role rolename="WS_EDITOR"/>
  <user username="viewer" password="91429c93e8b1d9462852770ea94d3cee$100000$48c94a74968e5a1b5df394a50c27effeb330553b66dc75d7840a9beb25a2ce90" roles="WS_VIEWER"/>
  <user username="editor" password="d0230d6ac03d2dad9d9c7168e61364f8$100000$b3b6ee84a6dbe1dd7cbe2ef9c2b5e0366ab3116d1f980038d91b81987e3a43b4" roles="WS_VIEWER,WS_EDITOR"/>
</tomcat-users>
```

## digest

Password hashes have to be generated. Tomcat provides the digest tool in the bin folder of the tomcat installation. 
To generate a hashed passwrod of "dummy_password", the following command can be issued (on Windows, the command is available on Linux as well). 
Note that the algorithm, number of iterations, salt length and keyLength all are passed to the tool:

``` bash
digest.bat -a "PBKDF2WithHmacSHA512" -i 100000 -s 16 -k 256 -h "org.apache.catalina.realm.SecretKeyCredentialHandler" dummy_password
```
This will result in the following output with the original password, followed by a : and finally the hashed value of the password:
``` bash
dummy_password:91429c93e8b1d9462852770ea94d3cee$100000$48c94a74968e5a1b5df394a50c27effeb330553b66dc75d7840a9beb25a2ce90
```

# Delft-FEWS Configuration

## UserGroups.xml

Map tomcat roles to systemUserGroups in the UserGroups.xml

``` xml
<?xml version="1.0" encoding="UTF-8"?>
<userGroups xmlns="http://www.wldelft.nl/fews" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.wldelft.nl/fews http://fews.wldelft.nl/schemas/version1.0/userGroups.xsd">
	<userGroup id="WS_VIEWER">
		<systemUserGroup id="WS_VIEWER"/>
	</userGroup>
	<userGroup id="WS_EDITOR">
		<systemUserGroup id="WS_EDITOR"/>
	</userGroup>
</userGroups>
```
