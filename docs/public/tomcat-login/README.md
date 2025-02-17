# The Delft-FEWS Web OC Tomcat Login

To support login with a username and password using tomcat configuration, both the weboc and Fews Web Services have to be deployed on the same tomcat server.


## conf/server.xml

<Valve className="org.apache.catalina.authenticator.SingleSignOn" />

This will allow to share the login session between the weboc and the fews web services.

## conf/web.xml

We will protect all resources with a security constraint. 

<security-constraint>
             <display-name>SecurityConstraint</display-name>
            <web-resource-collection>
                  <web-resource-name>WebOC</web-resource-name>
                 <url-pattern>/*</url-pattern>
         </web-resource-collection>
            <auth-constraint>
                  <role-name>WS_VIEWER</role-name>
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


The loing.html and loginfailed.html pages have to be created in the webapps/ROOT folder.
The login page will be login.html and the error page will be loginfailed.html.
