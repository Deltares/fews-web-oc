docker network create zapnet
docker run --net zapnet -v c:/temp:/zap/wrk/:rw -t owasp/zap2docker-stable zap-full-scan.py -j -t http://ngnix-weboc -g gen.conf -r report.html -x report.xml -J report.json
