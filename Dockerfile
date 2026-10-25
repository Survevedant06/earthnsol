FROM nginx:alpine
RUN echo "<h1>CI/CD Deployment Successful!</h1>" > /usr/share/nginx/html/index.html
EXPOSE 80
