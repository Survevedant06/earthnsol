pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build Docker Image') {
            steps {
                bat '"C:\\Users\\vvsur\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe" build -t jenkins-web-app:latest .'
            }
        }
        stage('Deploy Web Application') {
            steps {
                bat '''@echo off
                "C:\\Users\\vvsur\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe" stop practical10-container 2>nul || ver >nul
                "C:\\Users\\vvsur\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe" rm practical10-container 2>nul || ver >nul
                "C:\\Users\\vvsur\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe" run -d -p 8089:80 --name practical10-container jenkins-web-app:latest
                '''
            }
        }
    }
}
