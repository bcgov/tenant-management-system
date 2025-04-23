Draft:

#set up tms db
oc process -f .\tms-db-install.yaml | oc apply -f -

#set up tms api build config and image stream
oc process -f .\tms-api-build.yaml | oc apply -f -

#set up tms api deployment - create dependencies
oc process -f .\tms-api-deploy.yaml --param-file=tms-api-deploy.properties | oc apply -f -

